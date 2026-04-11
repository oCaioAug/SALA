import { Reservation, Room, User } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type ReservationWithRelations = Reservation & {
  user: User;
  room: Room;
};

const GOOGLE_CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";
const DEFAULT_CALENDAR_ID =
  process.env.GOOGLE_CALENDAR_DEFAULT_CALENDAR_ID || "primary";
const DEFAULT_TIMEZONE =
  process.env.GOOGLE_CALENDAR_TIMEZONE || "America/Sao_Paulo";

async function getGoogleAccessTokenForUser(
  userId: string
): Promise<string | null> {
  console.log(
    "[GoogleCalendar] Buscando conta Google para usuário:",
    userId
  );

  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "google",
    },
  });

  if (!account) {
    console.warn(
      ` Nenhuma conta do Google vinculada encontrada para o usuário ${userId}`
    );
    return null;
  }

  console.log(
    " [GoogleCalendar] Conta Google encontrada:",
    JSON.stringify(
      {
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        hasAccessToken: Boolean(account.access_token),
        hasRefreshToken: Boolean(account.refresh_token),
        expiresAt: account.expires_at,
        scope: account.scope,
        tokenType: account.token_type,
      },
      null,
      2
    )
  );

  // Se não há refresh_token nem access_token, não há muito o que fazer
  if (!account.access_token && !account.refresh_token) {
    console.warn(
      ` Conta Google para o usuário ${userId} não possui tokens OAuth armazenados`
    );
    return null;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);

  // Se ainda está válido, use o access_token atual
  if (
    account.access_token &&
    account.expires_at &&
    account.expires_at > nowInSeconds + 60
  ) {
    console.log(
      "[GoogleCalendar] Usando access_token atual (ainda válido). Expires_at:",
      account.expires_at
    );
    return account.access_token;
  }

  // Se não está válido mas temos refresh_token, tenta renovar
  if (account.refresh_token) {
    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID ?? "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
          grant_type: "refresh_token",
          refresh_token: account.refresh_token,
        }),
      });

      if (!tokenResponse.ok) {
        console.error(
          "Falha ao renovar token de acesso do Google:",
          await tokenResponse.text()
        );
        return account.access_token ?? null;
      }

      const tokens = (await tokenResponse.json()) as {
        access_token?: string;
        expires_in?: number;
        refresh_token?: string;
        scope?: string;
        token_type?: string;
      };

      console.log(
        " [GoogleCalendar] Resposta de renovação de token:",
        JSON.stringify(
          {
            hasAccessToken: Boolean(tokens.access_token),
            expiresIn: tokens.expires_in,
            hasRefreshToken: Boolean(tokens.refresh_token),
            scope: tokens.scope,
            tokenType: tokens.token_type,
          },
          null,
          2
        )
      );

      if (!tokens.access_token) {
        console.error(
          "Resposta de renovação de token não contém access_token",
          tokens
        );
        return account.access_token ?? null;
      }

      const updatedAccount = await prisma.account.update({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        data: {
          access_token: tokens.access_token,
          expires_at:
            tokens.expires_in != null
              ? Math.floor(Date.now() / 1000) + tokens.expires_in
              : account.expires_at,
          refresh_token: tokens.refresh_token ?? account.refresh_token,
          token_type: tokens.token_type ?? account.token_type,
          scope: tokens.scope ?? account.scope,
        },
      });

      console.log(
        "[GoogleCalendar] Token de acesso renovado e salvo. Novo expires_at:",
        updatedAccount.expires_at
      );

      return updatedAccount.access_token ?? null;
    } catch (error) {
      console.error(
        "Erro ao tentar renovar token de acesso do Google:",
        error
      );
      return account.access_token ?? null;
    }
  }

  // Sem refresh_token, retorna o token atual (pode falhar se realmente expirado)
  return account.access_token ?? null;
}

function buildEventPayload(reservation: ReservationWithRelations) {
  const start = reservation.startTime.toISOString();
  const end = reservation.endTime.toISOString();

  const statusLabel = (() => {
    switch (reservation.status) {
      case "APPROVED":
      case "ACTIVE":
        return "APROVADA";
      case "PENDING":
        return "PENDENTE";
      case "REJECTED":
        return "REJEITADA";
      case "CANCELLED":
        return "CANCELADA";
      case "COMPLETED":
        return "CONCLUÍDA";
      default:
        return reservation.status;
    }
  })();

  const summary = `[${statusLabel}] Reserva sala ${reservation.room.name}`;

  const descriptionLines = [
    reservation.purpose ? `Motivo: ${reservation.purpose}` : null,
    `Sala: ${reservation.room.name}`,
    `Usuário: ${reservation.user.name ?? reservation.user.email}`,
    `Status: ${reservation.status}`,
  ].filter(Boolean);

  return {
    summary,
    description: descriptionLines.join("\n"),
    start: {
      dateTime: start,
      timeZone: DEFAULT_TIMEZONE,
    },
    end: {
      dateTime: end,
      timeZone: DEFAULT_TIMEZONE,
    },
  };
}

async function createOrUpdateCalendarEvent(
  reservation: ReservationWithRelations
): Promise<string | null> {
  const accessToken = await getGoogleAccessTokenForUser(reservation.userId);

  if (!accessToken) {
    console.warn(
      ` Não foi possível obter access_token do Google para o usuário ${reservation.userId}. Pulando sincronização do calendário.`
    );
    return null;
  }

  const eventPayload = buildEventPayload(reservation);

  const calendarId = encodeURIComponent(DEFAULT_CALENDAR_ID);

  const isUpdate = Boolean(reservation.googleCalendarEventId);
  const url = isUpdate
    ? `${GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events/${encodeURIComponent(
        reservation.googleCalendarEventId as string
      )}`
    : `${GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events`;

  const method = isUpdate ? "PATCH" : "POST";

  console.log(
    ` [GoogleCalendar] Enviando requisição para ${method} evento`,
    JSON.stringify(
      {
        url,
        calendarId: DEFAULT_CALENDAR_ID,
        userId: reservation.userId,
        hasAccessToken: Boolean(accessToken),
        accessTokenPreview: accessToken.slice(0, 12) + "...",
      },
      null,
      2
    )
  );

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventPayload),
  });

  if (!response.ok) {
    console.error(
      ` Falha ao ${isUpdate ? "atualizar" : "criar"} evento no Google Calendar:`,
      await response.text()
    );
    return null;
  }

  const data = (await response.json()) as { id?: string };

  if (!data.id) {
    console.error(
      "Resposta do Google Calendar não contém ID do evento",
      data
    );
    return null;
  }

  return data.id;
}

async function deleteCalendarEvent(reservation: ReservationWithRelations) {
  if (!reservation.googleCalendarEventId) return;

  const accessToken = await getGoogleAccessTokenForUser(reservation.userId);

  if (!accessToken) {
    console.warn(
      ` Não foi possível obter access_token do Google para o usuário ${reservation.userId} ao tentar remover evento`
    );
    return;
  }

  const calendarId = encodeURIComponent(DEFAULT_CALENDAR_ID);
  const url = `${GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events/${encodeURIComponent(
    reservation.googleCalendarEventId
  )}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    console.error(
      "Falha ao remover evento do Google Calendar:",
      await response.text()
    );
  }
}

/**
 * Sincroniza uma reserva individual com o Google Calendar de acordo com seu status.
 *
 * - PENDING/APPROVED/ACTIVE/COMPLETED → evento criado/atualizado
 * - REJECTED/CANCELLED → evento removido, se existir
 */
export async function syncReservationToGoogleCalendar(
  reservationId: string
): Promise<void> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      user: true,
      room: true,
    },
  });

  if (!reservation) {
    console.warn(
      ` Reserva ${reservationId} não encontrada ao tentar sincronizar com Google Calendar`
    );
    return;
  }

  const shouldHaveEvent = !["REJECTED", "CANCELLED"].includes(
    reservation.status
  );

  if (!shouldHaveEvent) {
    await deleteCalendarEvent(reservation);

    if (reservation.googleCalendarEventId) {
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { googleCalendarEventId: null },
      });
    }

    return;
  }

  const eventId = await createOrUpdateCalendarEvent(reservation);

  if (!eventId) return;

  if (reservation.googleCalendarEventId !== eventId) {
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { googleCalendarEventId: eventId },
    });
  }
}

/**
 * Sincroniza todas as reservas futuras de um usuário com o Google Calendar.
 * Útil, por exemplo, após o usuário conceder permissão de calendário pela primeira vez.
 */
export async function syncUpcomingReservationsForUser(
  userId: string
): Promise<void> {
  console.log(
    "[GoogleCalendar] Sincronizando reservas futuras para usuário:",
    userId
  );

  const now = new Date();

  const reservations = await prisma.reservation.findMany({
    where: {
      userId,
      endTime: { gte: now },
      status: {
        in: ["PENDING", "APPROVED", "ACTIVE", "COMPLETED"],
      },
    },
    select: {
      id: true,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  if (reservations.length === 0) {
    console.log(
      " [GoogleCalendar] Nenhuma reserva futura encontrada para sincronizar."
    );
    return;
  }

  console.log(
    ` [GoogleCalendar] Encontradas ${reservations.length} reservas futuras para sincronizar.`
  );

  // Executa em paralelo, mas sem bloquear o fluxo de login
  await Promise.all(
    reservations.map(reservation =>
      syncReservationToGoogleCalendar(reservation.id)
    )
  );
}

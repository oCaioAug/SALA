import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { pushNotificationService } from "@/lib/push-notification-service";

const testPushSchema = z.object({
  userId: z.string().min(1, "User ID é obrigatório"),
  title: z.string().min(1, "Título é obrigatório"),
  body: z.string().min(1, "Mensagem é obrigatória"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return apiErrorResponse(ApiErrorCode.NOT_AUTHENTICATED, 401);
    }

    // Verificar se o usuário é admin
    const user = await session.user;
    console.log("Usuário que está testando push:", user);

    const body = await req.json();
    console.log("Dados recebidos para teste push:", body);

    const { userId, title, body: message } = testPushSchema.parse(body);

    // Enviar notificação push de teste
    console.log("Enviando push notification de teste...");

    const success = await pushNotificationService.sendSystemNotification(
      userId,
      title,
      message,
      {
        test: true,
        sentAt: new Date().toISOString(),
      }
    );

    console.log("Resultado do envio:", success);

    return NextResponse.json({
      success,
      message: success
        ? "Notificação push enviada com sucesso!"
        : "Falha ao enviar notificação push",
      userId,
      title,
      body: message,
    });
  } catch (error) {
    console.error("Erro ao testar push notification:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }

    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

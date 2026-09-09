import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PlatformRole } from "@prisma/client";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { verifyPassword } from "@/lib/auth/password";
import { getSafeCallbackPath } from "@/lib/auth/callback-path";
import { getOrgSectorCapabilities } from "@/lib/auth/permissions";
import { resolvePrimaryOrganization } from "@/lib/auth/resolve-primary-organization";
import { toLegacySessionRole } from "@/lib/auth/roles";
import { syncUpcomingReservationsForUser } from "@/lib/googleCalendar";
import { prisma } from "@/lib/prisma";
import { credentialsLoginSchema } from "@/lib/validations/auth";

const adapter = PrismaAdapter(prisma);
const originalLinkAccount = adapter.linkAccount;
if (originalLinkAccount) {
  adapter.linkAccount = (
    account: Parameters<typeof originalLinkAccount>[0]
  ) => {
    const { refresh_token_expires_in: _rt, ...cleanAccount } =
      account as Record<string, unknown>;
    return originalLinkAccount(
      cleanAccount as Parameters<typeof originalLinkAccount>[0]
    );
  };
}

async function enrichSessionUser(
  userId: string,
  preferredOrganizationId?: string | null
) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { platformRole: true },
  });
  const resolved = await resolvePrimaryOrganization(
    userId,
    preferredOrganizationId
  );
  const platformRole = dbUser?.platformRole ?? PlatformRole.NONE;
  const organizationRole = resolved?.organizationRole ?? null;
  const organizationId = resolved?.organizationId ?? null;

  let capabilities = {
    sectorCanApprove: false,
    sectorCanManageRooms: false,
  };
  if (organizationId) {
    try {
      capabilities = await getOrgSectorCapabilities(userId, organizationId);
    } catch (error) {
      console.error("Erro ao carregar capacidades de setor na sessão:", error);
    }
  }

  const isSectorManager =
    capabilities.sectorCanApprove || capabilities.sectorCanManageRooms;

  return {
    platformRole,
    organizationId,
    organizationRole,
    organizationName: resolved?.organizationName ?? null,
    role: toLegacySessionRole({ platformRole, organizationRole }),
    isSectorManager,
    sectorCanApprove: capabilities.sectorCanApprove,
    sectorCanManageRooms: capabilities.sectorCanManageRooms,
  };
}

export const authOptions: NextAuthOptions = {
  adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar",
        },
      },
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Email e senha",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsLoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user) return null;

        if (!user.passwordHash) {
          throw new Error("OAUTH_ONLY_ACCOUNT");
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.sub = user.id;
      }

      if (token.sub) {
        const preferOrganizationId =
          trigger === "update" &&
          session &&
          typeof session === "object" &&
          "preferOrganizationId" in session
            ? (session.preferOrganizationId as string | null | undefined)
            : undefined;

        const enriched = await enrichSessionUser(
          token.sub,
          preferOrganizationId
        );
        token.platformRole = enriched.platformRole;
        token.organizationId = enriched.organizationId;
        token.organizationRole = enriched.organizationRole;
        token.organizationName = enriched.organizationName;
        token.role = enriched.role;
        token.isSectorManager = enriched.isSectorManager;
        token.sectorCanApprove = enriched.sectorCanApprove;
        token.sectorCanManageRooms = enriched.sectorCanManageRooms;
      }

      return token;
    },
    async session({ session, token }) {
      if (session?.user && token.sub) {
        session.user.id = token.sub;
        session.user.platformRole =
          (token.platformRole as PlatformRole) ?? PlatformRole.NONE;
        session.user.organizationId =
          (token.organizationId as string | null) ?? null;
        session.user.organizationRole =
          (token.organizationRole as typeof session.user.organizationRole) ??
          null;
        session.user.organizationName =
          (token.organizationName as string | null) ?? null;
        session.user.role = token.role as typeof session.user.role;
        session.user.isSectorManager = Boolean(token.isSectorManager);
        session.user.sectorCanApprove = Boolean(token.sectorCanApprove);
        session.user.sectorCanManageRooms = Boolean(token.sectorCanManageRooms);
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) {
          console.error("Email não fornecido pelo Google");
          return false;
        }
        return true;
      }

      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        const path = getSafeCallbackPath(url) ?? "/organizations";
        return `${baseUrl}${path}`;
      }

      try {
        const parsed = new URL(url);
        if (parsed.origin === baseUrl) {
          const path =
            getSafeCallbackPath(
              `${parsed.pathname}${parsed.search}${parsed.hash}`
            ) ?? "/organizations";
          return `${baseUrl}${path}`;
        }
      } catch {
        // URL inválida — fallback abaixo
      }

      return `${baseUrl}/organizations`;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NEXTAUTH_DEBUG === "true",
  events: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.id) {
        void syncUpcomingReservationsForUser(user.id);
      }
    },
  },
  logger: {
    error(code, metadata) {
      console.error("NEXTAUTH ERRO:", code, metadata);
    },
    warn(code) {
      console.warn("NEXTAUTH AVISO:", code);
    },
  },
};

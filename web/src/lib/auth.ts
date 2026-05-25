import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PlatformRole } from "@prisma/client";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { toLegacySessionRole } from "@/lib/auth/roles";
import { resolvePrimaryOrganization } from "@/lib/auth/resolve-primary-organization";
import { syncUpcomingReservationsForUser } from "@/lib/googleCalendar";
import { prisma } from "@/lib/prisma";

const adapter = PrismaAdapter(prisma);
const originalLinkAccount = adapter.linkAccount;
if (originalLinkAccount) {
  adapter.linkAccount = (account) => {
    // Google returns refresh_token_expires_in which is not in our Prisma schema
    const { refresh_token_expires_in, ...cleanAccount } = account as any;
    return originalLinkAccount(cleanAccount);
  };
}

export const authOptions: NextAuthOptions = {
  adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          // Escopo ampliado para permitir integração com Google Calendar
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      console.log("Session callback chamado:", {
        sessionUser: session?.user?.email,
        userId: user?.id,
      });
      if (session?.user) {
        session.user.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { platformRole: true },
        });
        const resolved = await resolvePrimaryOrganization(user.id);
        session.user.platformRole = dbUser?.platformRole ?? PlatformRole.NONE;
        session.user.organizationId = resolved?.organizationId ?? null;
        session.user.organizationRole = resolved?.organizationRole ?? null;
        session.user.organizationName = resolved?.organizationName ?? null;
        session.user.role = toLegacySessionRole({
          platformRole: session.user.platformRole,
          organizationRole: session.user.organizationRole,
        });
      }
      return session;
    },
    async signIn({ user, account }) {
      console.log("SignIn callback chamado:", {
        email: user.email,
        provider: account?.provider,
      });

      if (account?.provider === "google") {
        if (!user.email) {
          console.error("Email não fornecido pelo Google");
          return false;
        }
        return true;
      }

      console.log("Login permitido para:", user.email);
      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.includes("/api/auth/callback/google")) {
        return `${baseUrl}/inicio`;
      }

      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      if (new URL(url).origin === baseUrl) {
        return url;
      }

      return `${baseUrl}/inicio`;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "database",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  events: {
    async signIn({ user, account }) {
      console.log("SignIn event:", {
        email: user.email,
        provider: account?.provider,
      });

      // Ao o usuário logar com Google (e possivelmente conceder permissão de calendário),
      // sincronizar reservas futuras dele com o Google Calendar.
      if (account?.provider === "google" && user.id) {
        void syncUpcomingReservationsForUser(user.id);
      }
    },
    async session({ session }) {
      console.log("Session event:", { email: session.user?.email });
    },
  },
  logger: {
    error(code, metadata) {
      console.error("NEXTAUTH ERRO:", code, metadata);
    },
    warn(code) {
      console.warn("NEXTAUTH AVISO:", code);
    },
    debug(code, metadata) {
      console.log("NEXTAUTH DEBUG:", code, metadata);
    },
  },
};

import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      console.log("🔄 Session callback chamado:", {
        sessionUser: session?.user?.email,
        userId: user?.id,
      });
      if (session?.user) {
        session.user.id = user.id;
        // Buscar informações adicionais do usuário no banco
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        session.user.role = dbUser?.role || Role.USER;
        console.log("✅ Session configurada com role:", session.user.role);
      }
      return session;
    },
    async signIn({ user, account }) {
      console.log("🔑 SignIn callback chamado:", {
        email: user.email,
        provider: account?.provider,
      });

      if (account?.provider === "google") {
        if (!user.email) {
          console.error("❌ Email não fornecido pelo Google");
          return false;
        }
        console.log("✅ Login Google autorizado para:", user.email);
        return true;
      }

      console.log("✅ Login permitido para:", user.email);
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log("🔄 Redirect callback chamado:", { url, baseUrl });

      // Se é um callback do Google OAuth, redirecionar para dashboard
      if (url.includes("/api/auth/callback/google")) {
        console.log("🎯 Redirecionando após Google OAuth para /dashboard");
        return `${baseUrl}/dashboard`;
      }

      // Se a URL é relativa, usar baseUrl
      if (url.startsWith("/")) {
        console.log(
          "🔄 URL relativa, redirecionando para:",
          `${baseUrl}${url}`
        );
        return `${baseUrl}${url}`;
      }

      // Se é da mesma origem, permitir
      if (new URL(url).origin === baseUrl) {
        console.log("🔄 Mesma origem, permitindo:", url);
        return url;
      }

      // Caso contrário, redirecionar para dashboard
      console.log("🎯 Redirecionamento padrão para /dashboard");
      return `${baseUrl}/dashboard`;
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
      console.log("🎉 SignIn event:", {
        email: user.email,
        provider: account?.provider,
      });
    },
    async session({ session }) {
      console.log("🔄 Session event:", { email: session.user?.email });
    },
  },
};

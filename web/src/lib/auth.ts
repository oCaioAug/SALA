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
      if (session?.user) {
        session.user.id = user.id;
        // Buscar informações adicionais do usuário no banco
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        session.user.role = dbUser?.role || Role.USER;
      }
      return session;
    },
    async signIn({ user, account }) {
      try {
        if (account?.provider === "google") {
          // Verificar se o email existe
          if (!user.email) {
            console.error("Email não fornecido pelo Google");
            return false;
          }

          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            // Verificar se é o primeiro usuário do sistema
            const userCount = await prisma.user.count();
            const isFirstUser = userCount === 0;

            console.log("Primeiro usuário do sistema:", isFirstUser);
            
            // O PrismaAdapter criará o usuário automaticamente, 
            // mas vamos aguardar e atualizar o role depois
            setTimeout(async () => {
              try {
                const userRole = isFirstUser ? Role.ADMIN : Role.USER;
                await prisma.user.update({
                  where: { email: user.email! },
                  data: { role: userRole }
                });
                console.log("Role definido como:", userRole);
              } catch (error) {
                console.error("Erro ao definir role:", error);
              }
            }, 2000);
          }
        }
        
        return true;
      } catch (error) {
        console.error("Erro no signIn callback:", error);
        return true; // Continuar mesmo com erro para não bloquear login
      }
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error", // Página de erro customizada
  },
  session: {
    strategy: "database", // Voltar para database agora que está funcionando
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

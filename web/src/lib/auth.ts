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
      // Verificar se é o primeiro login e definir role como ADMIN se for o primeiro usuário
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          // Verificar se é o primeiro usuário do sistema
          const userCount = await prisma.user.count();
          const isFirstUser = userCount === 0;

          // O primeiro usuário será ADMIN
          if (isFirstUser) {
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || "Usuário",
                image: user.image,
                role: Role.ADMIN,
              },
            });
          }
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "database",
  },
};

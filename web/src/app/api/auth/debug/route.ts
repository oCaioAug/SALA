// Arquivo de debug para testar configurações do NextAuth
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic behavior to prevent static optimization
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Buscar todos os usuários com suas contas OAuth
    const users = await prisma.user.findMany({
      include: {
        accounts: true,
        sessions: true,
      },
    });

    // Buscar todas as contas OAuth
    const accounts = await prisma.account.findMany();

    // Buscar todas as sessões
    const sessions = await prisma.session.findMany();

    const config = {
      googleClientId: process.env.GOOGLE_CLIENT_ID
        ? "✓ Configurado"
        : "✗ Não configurado",
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET
        ? "✓ Configurado"
        : "✗ Não configurado",
      nextAuthSecret: process.env.NEXTAUTH_SECRET
        ? "✓ Configurado"
        : "✗ Não configurado",
      nextAuthUrl: process.env.NEXTAUTH_URL || "Não configurado",
      databaseUrl: process.env.DATABASE_URL
        ? "✓ Configurado"
        : "✗ Não configurado",
      nodeEnv: process.env.NODE_ENV,
      currentSession: session ? "✓ Logado" : "✗ Não logado",
      sessionData: session,
      redirectUris: [
        "http://localhost:3000/api/auth/callback/google",
        "https://sala.ocaioaug.com.br/api/auth/callback/google",
      ],
      databaseData: {
        users,
        accounts,
        sessions,
        totalUsers: users.length,
        totalAccounts: accounts.length,
        totalSessions: sessions.length,
      },
    };

    return Response.json(config);
  } catch (err) {
    console.error("Erro ao verificar configurações:", err);
    return Response.json(
      {
        error: "Erro ao verificar configurações",
        details: err instanceof Error ? err.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

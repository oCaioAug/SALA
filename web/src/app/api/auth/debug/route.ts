// Arquivo de debug para testar configurações do NextAuth

export async function GET() {
  try {
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
      redirectUris: [
        "http://localhost:3000/api/auth/callback/google",
        "https://sala.ocaioaug.com.br/api/auth/callback/google",
      ],
    };

    return Response.json(config);
  } catch (err) {
    console.error("Erro ao verificar configurações:", err);
    return Response.json(
      { error: "Erro ao verificar configurações" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

import { verifyAuth } from "@/lib/auth-hybrid";
import { encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/vision/credentials
 * Retorna se o Roboflow está configurado e qual o ID do modelo ativo.
 * NUNCA retorna a chave de API em texto limpo ou criptografada para o cliente.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticação híbrida (Web + Mobile)
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 2. Buscar credencial no banco
    const credential = await prisma.apiCredential.findUnique({
      where: { provider: "ROBOFLOW" },
    });

    const hasEnvFallback = !!process.env.ROBOFLOW_API_KEY;

    return NextResponse.json({
      isConfigured: !!credential || hasEnvFallback,
      provider: "ROBOFLOW",
      modelId:
        credential?.modelId || process.env.ROBOFLOW_MODEL_ID || "yolov8n",
      usingEnv: !credential && hasEnvFallback,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar credenciais de visão:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao carregar status das credenciais" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vision/credentials
 * Cadastra, atualiza ou deleta a chave do Roboflow criptografada no banco.
 * Restrito apenas para administradores (ADMIN).
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação e permissão de ADMIN
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (authResult.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso proibido: Requer nível Administrador" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { apiKey, modelId } = body;

    // Caso o Admin envie um apiKey vazio, removemos a credencial do banco
    // permitindo voltar ao simulador offline/variáveis de ambiente globais
    if (!apiKey) {
      console.log(
        "🗑️ [CredentialsAPI] Removendo credenciais do Roboflow do banco de dados..."
      );
      await prisma.apiCredential.deleteMany({
        where: { provider: "ROBOFLOW" },
      });

      return NextResponse.json({
        message:
          "Configurações do Roboflow removidas com sucesso. O sistema voltará a usar o simulador/variáveis globais.",
        isConfigured: !!process.env.ROBOFLOW_API_KEY,
        usingEnv: !!process.env.ROBOFLOW_API_KEY,
      });
    }

    // 2. Criptografar a chave em AES-256-GCM
    console.log(
      "🔒 [CredentialsAPI] Criptografando chave de API usando AES-256-GCM..."
    );
    const { encrypted, iv, tag } = encrypt(apiKey);

    // 3. Upsert no banco de dados para o provedor ROBOFLOW
    await prisma.apiCredential.upsert({
      where: { provider: "ROBOFLOW" },
      update: {
        encryptedKey: encrypted,
        iv,
        tag,
        modelId: modelId || "yolov8n",
      },
      create: {
        provider: "ROBOFLOW",
        encryptedKey: encrypted,
        iv,
        tag,
        modelId: modelId || "yolov8n",
      },
    });

    console.log("✅ [CredentialsAPI] Chave de API persistida com segurança!");

    return NextResponse.json({
      message:
        "Credenciais do Roboflow atualizadas e salvas com segurança no banco de dados!",
      isConfigured: true,
      modelId: modelId || "yolov8n",
      usingEnv: false,
    });
  } catch (error) {
    console.error("❌ Erro ao salvar credenciais do Roboflow:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao salvar credenciais" },
      { status: 500 }
    );
  }
}

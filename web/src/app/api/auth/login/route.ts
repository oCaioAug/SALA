import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { toLegacySessionRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  console.log("API /api/auth/login foi chamada!");
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log("Tentativa de login:", { email, password: "***" });

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const validCredentials = {
      email: "admin@sala.com",
      password: "123456",
    };

    if (
      email === validCredentials.email &&
      password === validCredentials.password
    ) {
      console.log("Credenciais válidas, buscando usuário...");

      console.log("Buscando usuário com email:", email);
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          platformRole: true,
          memberships: {
            take: 1,
            orderBy: { createdAt: "asc" },
            select: { role: true },
          },
        },
      });

      console.log(
        "Usuário encontrado:",
        user ? { id: user.id, email: user.email } : "Nenhum usuário encontrado"
      );

      const allUsersWithEmail = await prisma.user.findMany({
        where: { email },
        orderBy: { createdAt: "desc" },
        select: { id: true, createdAt: true },
      });
      console.log(
        "Todos os usuários com este email:",
        allUsersWithEmail.map(u => ({ id: u.id, createdAt: u.createdAt }))
      );

      if (!user) {
        console.log("Usuário não encontrado, retornando erro 404");
        return NextResponse.json(
          { error: "Usuário admin não encontrado. Execute o seed primeiro." },
          { status: 404 }
        );
      }

      const membership = user.memberships[0];
      console.log("Login bem-sucedido para:", {
        id: user.id,
        email: user.email,
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationRole: membership?.role ?? null,
          role: toLegacySessionRole({
            platformRole: user.platformRole,
            organizationRole: membership?.role ?? null,
          }),
        },
      });
    }

    console.log("Credenciais inválidas");
    return NextResponse.json(
      { error: "Email ou senha incorretos" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Erro no login:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { isOrgAdmin, toLegacySessionRole } from "@/lib/auth/roles";
import { verifyAuth } from "@/lib/auth-hybrid";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    // Autenticação híbrida (web + mobile)
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status || 401 }
      );
    }

    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          take: 1,
          orderBy: { createdAt: "asc" },
          select: { role: true, organizationId: true },
        },
      },
    });

    if (!user) {
      return apiErrorResponse(ApiErrorCode.USER_NOT_FOUND, 404);
    }

    // Verificar permissões
    const currentUser = auth.user!;
    const canView =
      currentUser.id === userId ||
      isOrgAdmin({ organizationRole: currentUser.organizationRole ?? null });

    if (!canView) {
      return NextResponse.json(
        { error: "Você não tem permissão para visualizar este perfil" },
        { status: 403 }
      );
    }

    const membership = user.memberships[0];
    const { memberships: _m, ...userData } = user;

    return NextResponse.json({
      ...userData,
      organizationRole: membership?.role ?? null,
      role: toLegacySessionRole({ organizationRole: membership?.role ?? null }),
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    // Autenticação híbrida (web + mobile)
    const auth = await verifyAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status || 401 }
      );
    }

    const { name, email } = await request.json();

    // Validar dados
    if (!name && !email) {
      return NextResponse.json(
        { error: "Pelo menos um campo deve ser fornecido" },
        { status: 400 }
      );
    }

    if (email && !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    // Verificar se o usuário existe
    const userToUpdate = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToUpdate) {
      return apiErrorResponse(ApiErrorCode.USER_NOT_FOUND, 404);
    }

    // Verificar permissões
    const currentUser = auth.user!;
    const canEdit =
      currentUser.id === userId ||
      isOrgAdmin({ organizationRole: currentUser.organizationRole ?? null });

    if (!canEdit) {
      return NextResponse.json(
        { error: "Você não tem permissão para editar este perfil" },
        { status: 403 }
      );
    }

    // Se está alterando o email, verificar se já existe
    if (email && email !== userToUpdate.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Este email já está sendo usado por outro usuário" },
          { status: 400 }
        );
      }
    }

    // Atualizar o usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          take: 1,
          orderBy: { createdAt: "asc" },
          select: { role: true },
        },
      },
    });

    const membership = updatedUser.memberships[0];
    const { memberships: _m, ...userData } = updatedUser;

    return NextResponse.json({
      ...userData,
      organizationRole: membership?.role ?? null,
      role: toLegacySessionRole({ organizationRole: membership?.role ?? null }),
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

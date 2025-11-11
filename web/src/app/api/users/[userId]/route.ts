import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o usuário pode ver este perfil
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Usuário atual não encontrado" },
        { status: 404 }
      );
    }

    // Pode ver próprio perfil ou ser admin
    const canView =
      currentUser.id === params.userId || currentUser.role === "ADMIN";

    if (!canView) {
      return NextResponse.json(
        { error: "Você não tem permissão para visualizar este perfil" },
        { status: 403 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
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
      where: { id: params.userId },
    });

    if (!userToUpdate) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o usuário pode alterar este perfil
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Usuário atual não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissões: pode editar próprio perfil ou ser admin
    const canEdit =
      currentUser.id === params.userId || currentUser.role === "ADMIN";

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
      where: { id: params.userId },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

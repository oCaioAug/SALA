import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { googleId, email, name, image } = body;

    if (!googleId || !email || !name) {
      return NextResponse.json(
        { error: "Dados obrigatórios não fornecidos" },
        { status: 400 }
      );
    }

    // Buscar usuário existente pelo email ou Google ID
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { id: googleId }],
      },
    });

    if (user) {
      // Atualizar dados do usuário existente
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name,
          image: image,
          // Manter email existente para não quebrar relações
        },
      });
    } else {
      // Criar novo usuário
      user = await prisma.user.create({
        data: {
          id: googleId, // Usar Google ID como ID principal
          email: email,
          name: name,
          image: image,
          role: "USER",
        },
      });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Erro ao sincronizar usuário:", error);

    // Se for erro de ID duplicado, tentar criar com ID único
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      try {
        const { googleId, email, name, image } = await request.json();

        // Buscar pelo email se ID já existe
        const existingUser = await prisma.user.findUnique({
          where: { email: email },
        });

        if (existingUser) {
          // Retornar usuário existente
          return NextResponse.json(existingUser, { status: 200 });
        }

        // Gerar ID único se necessário
        const user = await prisma.user.create({
          data: {
            email: email,
            name: name,
            image: image,
            role: "USER",
          },
        });

        return NextResponse.json(user, { status: 201 });
      } catch (secondError) {
        console.error("Erro na segunda tentativa:", secondError);
        return NextResponse.json(
          { error: "Erro ao criar/sincronizar usuário" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

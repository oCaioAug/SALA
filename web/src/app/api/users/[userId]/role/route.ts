import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    console.log("🔄 API Role: Iniciando alteração de role para:", params.userId);
    
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    console.log("🔑 Sessão obtida:", { user: session?.user?.email, role: session?.user?.role });
    
    if (!session?.user?.email) {
      console.log("❌ Usuário não autenticado");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se o usuário é admin
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, id: true },
    });

    console.log("👤 Usuário atual:", currentUser);

    if (!currentUser || currentUser.role !== "ADMIN") {
      console.log("❌ Usuário não é admin");
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem alterar roles." },
        { status: 403 }
      );
    }

    const { role } = await request.json();
    console.log("📝 Novo role solicitado:", role);

    // Validar o role
    if (!role || !["ADMIN", "USER"].includes(role)) {
      console.log("❌ Role inválido:", role);
      return NextResponse.json(
        { error: "Role inválido. Use 'ADMIN' ou 'USER'." },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const userToUpdate = await prisma.user.findUnique({
      where: { id: params.userId },
    });

    console.log("🔍 Usuário a ser atualizado:", userToUpdate?.email);

    if (!userToUpdate) {
      console.log("❌ Usuário não encontrado");
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Impedir que o usuário altere seu próprio role
    if (userToUpdate.id === currentUser.id) {
      console.log("❌ Tentativa de auto-alteração de role");
      return NextResponse.json(
        { error: "Você não pode alterar sua própria permissão" },
        { status: 400 }
      );
    }

    // Atualizar o role do usuário
    console.log("🔄 Atualizando role no banco de dados...");
    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    console.log("✅ Usuário atualizado com sucesso:", updatedUser);
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("❌ Erro ao alterar role do usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

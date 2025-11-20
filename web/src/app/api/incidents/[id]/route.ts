import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IncidentStatus, IncidentPriority } from "@prisma/client";

// Força renderização dinâmica
export const dynamic = "force-dynamic";

// GET /api/incidents/[id] - Buscar incidente específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log(`🎫 Buscando incidente ${id}`);

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        reportedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        room: {
          select: { id: true, name: true, description: true, status: true },
        },
        item: {
          select: { id: true, name: true, description: true },
        },
        statusHistory: {
          include: {
            changedBy: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!incident) {
      return NextResponse.json(
        { error: "Incidente não encontrado" },
        { status: 404 }
      );
    }

    console.log(`✅ Incidente ${id} encontrado`);

    return NextResponse.json(incident);
  } catch (error) {
    console.error(`❌ Erro ao buscar incidente ${params.id}:`, error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// PUT /api/incidents/[id] - Atualizar incidente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const {
      title,
      description,
      priority,
      status,
      assignedToId,
      estimatedResolutionTime,
      resolutionNotes,
    } = body;

    console.log(`🎫 Atualizando incidente ${id}:`, body);

    // Buscar usuário atual
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Buscar incidente atual
    const currentIncident = await prisma.incident.findUnique({
      where: { id },
      include: { assignedTo: true, reportedBy: true },
    });

    if (!currentIncident) {
      return NextResponse.json(
        { error: "Incidente não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissões
    const isAdmin = currentUser.role === "ADMIN";
    const isAssigned = currentIncident.assignedToId === currentUser.id;
    const isReporter = currentIncident.reportedById === currentUser.id;

    if (!isAdmin && !isAssigned && !isReporter) {
      return NextResponse.json(
        { error: "Sem permissão para atualizar este incidente" },
        { status: 403 }
      );
    }

    // Preparar dados de atualização
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined)
      updateData.priority = priority as IncidentPriority;
    if (estimatedResolutionTime !== undefined) {
      updateData.estimatedResolutionTime = estimatedResolutionTime
        ? new Date(estimatedResolutionTime)
        : null;
    }
    if (resolutionNotes !== undefined)
      updateData.resolutionNotes = resolutionNotes;

    // Apenas admins podem atribuir incidentes e mudar status
    if (isAdmin) {
      if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
      if (status !== undefined) {
        updateData.status = status as IncidentStatus;

        // Se status está sendo marcado como resolvido
        if (status === "RESOLVED" && currentIncident.status !== "RESOLVED") {
          updateData.actualResolutionTime = new Date();
        }
      }
    }

    // Atualizar incidente
    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: updateData,
      include: {
        reportedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        room: {
          select: { id: true, name: true, description: true, status: true },
        },
        item: {
          select: { id: true, name: true, description: true },
        },
      },
    });

    // Criar histórico para mudanças importantes
    const historyEntries = [];

    if (status !== undefined && status !== currentIncident.status) {
      historyEntries.push({
        incidentId: id,
        fromStatus: currentIncident.status,
        toStatus: status as IncidentStatus,
        notes: `Status alterado de ${currentIncident.status} para ${status}`,
        changedById: currentUser.id,
      });
    }

    if (
      assignedToId !== undefined &&
      assignedToId !== currentIncident.assignedToId
    ) {
      const assignedUser = assignedToId
        ? await prisma.user.findUnique({
            where: { id: assignedToId },
            select: { name: true, email: true },
          })
        : null;

      historyEntries.push({
        incidentId: id,
        fromStatus: currentIncident.status,
        toStatus: currentIncident.status,
        notes: assignedUser
          ? `Incidente atribuído para ${assignedUser.name} (${assignedUser.email})`
          : "Atribuição removida",
        changedById: currentUser.id,
      });
    }

    if (historyEntries.length > 0) {
      await prisma.incidentStatusHistory.createMany({
        data: historyEntries,
      });
    }

    console.log(`✅ Incidente ${id} atualizado com sucesso`);

    // TODO: Enviar notificações para usuários relevantes
    // TODO: Se status mudou para RESOLVED, reativar sala/item se necessário

    return NextResponse.json(updatedIncident);
  } catch (error) {
    console.error(`❌ Erro ao atualizar incidente ${params.id}:`, error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/incidents/[id] - Deletar incidente (apenas admins)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = params;

    console.log(`🎫 Tentativa de deletar incidente ${id}`);

    // Buscar usuário atual
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas administradores podem deletar incidentes" },
        { status: 403 }
      );
    }

    // Verificar se incidente existe
    const incident = await prisma.incident.findUnique({
      where: { id },
    });

    if (!incident) {
      return NextResponse.json(
        { error: "Incidente não encontrado" },
        { status: 404 }
      );
    }

    // Deletar incidente (cascade deletará o histórico)
    await prisma.incident.delete({
      where: { id },
    });

    console.log(`✅ Incidente ${id} deletado com sucesso`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`❌ Erro ao deletar incidente ${params.id}:`, error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/incidents/[id] - Atualizar incidente
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    console.log(`🔄 Atualizando incidente ${id}:`, body);

    // Buscar usuário atual primeiro
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Buscar o incidente atual
    const existingIncident = await prisma.incident.findUnique({
      where: { id },
      include: {
        reportedBy: { select: { id: true } },
        assignedTo: { select: { id: true } },
      },
    });

    if (!existingIncident) {
      return NextResponse.json(
        { error: "Incidente não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissões
    const isAdmin = currentUser.role === "ADMIN";
    const isAssigned = existingIncident.assignedTo?.id === currentUser.id;
    const isReporter = existingIncident.reportedBy.id === currentUser.id;

    if (!isAdmin && !isAssigned && !isReporter) {
      return NextResponse.json(
        { error: "Sem permissão para editar este incidente" },
        { status: 403 }
      );
    }

    // Verificar se o incidente já foi resolvido (apenas não-admins não podem editar)
    if (existingIncident.status === "RESOLVED" && !isAdmin) {
      return NextResponse.json(
        { error: "Não é possível editar incidentes já resolvidos" },
        { status: 400 }
      );
    }

    // Extrair dados válidos do body
    const {
      title,
      description,
      status,
      priority,
      resolutionNotes,
      assignedToId,
    } = body;

    // Preparar dados para atualização e rastrear campos ignorados
    const updateData: any = {};
    const ignoredFields: string[] = [];
    const warnings: string[] = [];
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority as IncidentPriority;
    if (resolutionNotes !== undefined) updateData.resolutionNotes = resolutionNotes;
    
    // Apenas admins podem atribuir incidentes
    if (assignedToId !== undefined) {
      if (isAdmin) {
        updateData.assignedToId = assignedToId || null;
      } else {
        ignoredFields.push("assignedToId");
        warnings.push("Você não tem permissão para alterar a atribuição do incidente");
      }
    }

    // Atualizar status e adicionar ao histórico se mudou
    const statusRequested = status !== undefined;
    
    if (statusRequested) {
      // Verificar se usuário pode mudar status
      // Apenas admins podem mudar status, ou o próprio usuário pode resolver se for o responsável
      const canChangeStatus = isAdmin || (status === "RESOLVED" && (isAssigned || isReporter));
      
      if (canChangeStatus) {
        updateData.status = status as IncidentStatus;
        
        // Se resolvendo, adicionar timestamp
        if (status === "RESOLVED" && existingIncident.status !== "RESOLVED") {
          updateData.actualResolutionTime = new Date();
        }
      } else {
        ignoredFields.push("status");
        warnings.push("Você não tem permissão para alterar o status do incidente. Apenas administradores podem alterar o status, ou você pode resolver o incidente se for o responsável");
      }
    }

    // Verificar se há dados para atualizar
    if (Object.keys(updateData).length === 0) {
      // Se há campos solicitados mas todos foram ignorados, retornar erro
      if (ignoredFields.length > 0) {
        return NextResponse.json(
          { 
            error: "Nenhum campo pode ser atualizado com as permissões atuais",
            ignoredFields,
            warnings
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: "Nenhum dado para atualizar" },
        { status: 400 }
      );
    }

    // Atualizar incidente
    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: updateData,
      include: {
        reportedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        room: {
          select: { id: true, name: true, description: true, status: true },
        },
        item: {
          select: { id: true, name: true, description: true },
        },
      },
    });

    // Adicionar entrada no histórico se o status mudou e foi atualizado
    // statusChanged deve ser recalculado baseado no updateData.status, não no status solicitado
    const statusWasUpdated = updateData.status !== undefined && updateData.status !== existingIncident.status;
    if (statusWasUpdated) {
      await prisma.incidentStatusHistory.create({
        data: {
          incidentId: id,
          fromStatus: existingIncident.status,
          toStatus: updateData.status,
          changedById: currentUser.id,
          notes: `Status alterado de ${existingIncident.status} para ${updateData.status}`,
        },
      });
    }

    console.log(`✅ Incidente ${id} atualizado com sucesso`);
    if (ignoredFields.length > 0) {
      console.log(`⚠️ Campos ignorados devido a permissões: ${ignoredFields.join(", ")}`);
    }

    // Preparar resposta com avisos se houver campos ignorados
    const response: any = updatedIncident;
    if (ignoredFields.length > 0) {
      response.warnings = warnings;
      response.ignoredFields = ignoredFields;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error(`❌ Erro ao atualizar incidente ${params.id}:`, error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "N/A");
    
    // Se for erro do Prisma, retornar mensagem mais específica
    if (error && typeof error === 'object' && 'code' in error) {
      console.error("Prisma error code:", (error as any).code);
      console.error("Prisma error meta:", (error as any).meta);
    }
    
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

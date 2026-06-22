import { NextRequest, NextResponse } from "next/server";

import { verifyAuth } from "@/lib/auth-hybrid";
import { prisma } from "@/lib/prisma";
import { VisionServiceFactory } from "@/lib/services/vision/index";
import { AuditItemComparison, ProvisionItemSuggestion } from "@/lib/services/vision/types";

export const dynamic = "force-dynamic";

// Mapeia classes retornadas pela IA para classes em português e seus ícones fallbacks
const CLASS_METADATA_MAP: Record<string, { label: string; icon: string }> = {
  laptop: { label: "Notebook", icon: "💻" },
  projector: { label: "Projetor", icon: "📽️" },
  chair: { label: "Cadeira", icon: "🪑" },
  keyboard: { label: "Teclado", icon: "⌨️" },
  person: { label: "Pessoa", icon: "👤" },
};

/**
 * Função utilitária para mapear nomes de itens no banco para as classes detectadas pela IA.
 * Permite fazer reconciliação inteligente de inventário (KISS).
 */
function mapDatabaseItemToAiClass(itemName: string): string | null {
  const name = itemName.toLowerCase();
  if (name.includes("notebook") || name.includes("laptop") || name.includes("computador") || name.includes("pc") || name.includes("desktop")) {
    return "laptop";
  }
  if (name.includes("projetor") || name.includes("projector") || name.includes("telão")) {
    return "projector";
  }
  if (name.includes("cadeira") || name.includes("chair") || name.includes("assento")) {
    return "chair";
  }
  if (name.includes("teclado") || name.includes("keyboard")) {
    return "keyboard";
  }
  return null; // Não-mapeado ou ignorado no detector padrão
}

/**
 * POST /api/vision/analyze
 * Endpoint principal que executa a IA de visão computacional e dispara fluxos automáticos de negócio.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticação (Todos os fluxos de visão requerem autenticação)
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { image, roomId, mode } = body;

    if (!image || !roomId || !mode) {
      return NextResponse.json(
        { error: "Campos obrigatórios: image (base64), roomId, mode" },
        { status: 400 }
      );
    }

    // 2. Verificar se a sala existe no banco
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { items: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
    }

    // 3. Obter o serviço de visão ativa via fábrica resolvedora (DIP SOLID)
    const visionService = await VisionServiceFactory.getService();

    // 4. Executar detecção de objetos (IA)
    const analysisResult = await visionService.analyzeImage(image);
    const { occupancyCount, detectedClasses } = analysisResult;

    const logs: string[] = [];
    logs.push(`[${new Date().toLocaleTimeString()}] Imagem analisada com sucesso via motor ${analysisResult.provider}.`);
    logs.push(`[${new Date().toLocaleTimeString()}] Detecção concluída. Total de predições: ${analysisResult.predictions.length}.`);



    // ==========================================
    // CASO DE USO 2: AUDITORIA DE EQUIPAMENTOS E INCIDENTES (audit)
    // ==========================================
    if (mode === "audit") {
      const comparisons: AuditItemComparison[] = [];
      const missingItemsForIncident: string[] = [];

      // Reconciliar itens cadastrados no banco contra as predições da IA
      room.items.forEach(dbItem => {
        const mappedAiClass = mapDatabaseItemToAiClass(dbItem.name);

        if (mappedAiClass) {
          const expectedQuantity = dbItem.quantity;
          const detectedQuantity = detectedClasses[mappedAiClass] || 0;

          let status: "OK" | "MISSING" | "EXCESS" = "OK";
          if (detectedQuantity < expectedQuantity) {
            status = "MISSING";
            missingItemsForIncident.push(
              `- ${dbItem.name}: Esperado ${expectedQuantity} unidade(s), detectado apenas ${detectedQuantity} unidade(s).`
            );
          } else if (detectedQuantity > expectedQuantity) {
            status = "EXCESS";
          }

          comparisons.push({
            itemId: dbItem.id,
            itemName: dbItem.name,
            expectedQuantity,
            detectedQuantity,
            status,
          });
        } else {
          // Itens que o detector não cobre (Ex: Quadro, Armário)
          comparisons.push({
            itemId: dbItem.id,
            itemName: dbItem.name,
            expectedQuantity: dbItem.quantity,
            detectedQuantity: dbItem.quantity, // assume OK
            status: "OK",
          });
        }
      });

      const hasDiscrepancies = comparisons.some(c => c.status === "MISSING");
      let createdIncidentId: string | undefined;

      if (hasDiscrepancies) {
        logs.push(`[${new Date().toLocaleTimeString()}] ⚠️ DISCREPÂNCIA DETECTADA! Alguns equipamentos cadastrados estão ausentes na auditoria.`);
        
        // Criar incidente automático gerado pelo bot
        const incidentTitle = `[SALA-BOT] Equipamento Ausente na Sala: ${room.name}`;
        const incidentDesc = `Auditoria automática de Inventário via Visão Computacional realizada em ${new Date().toLocaleString()} detectou que alguns equipamentos cadastrados estão faltando:\n\n${missingItemsForIncident.join("\n")}\n\nPor favor, envie um técnico para inspecionar o local.`;

        console.log("🎫 [SALA-BOT] Criando chamado de incidente automático no banco...");
        const incident = await prisma.incident.create({
          data: {
            title: incidentTitle,
            description: incidentDesc,
            priority: "HIGH",
            category: "EQUIPMENT_FAILURE",
            reportedById: authResult.user.id,
            roomId: roomId,
            organizationId: room.organizationId,
            status: "REPORTED",
          },
        });

        // Grava no histórico de incidentes
        await prisma.incidentStatusHistory.create({
          data: {
            incidentId: incident.id,
            toStatus: "REPORTED",
            notes: "Chamado gerado de forma autônoma pelo motor S.A.L.A. Vision Bot após auditoria fotográfica da sala.",
            changedById: authResult.user.id,
          },
        });

        createdIncidentId = incident.id;
        logs.push(`[AUTOMATION] 🚨 Incidente gerado com sucesso pelo SALA-BOT! Chamado ID: #${incident.id}.`);
      } else {
        logs.push(`[${new Date().toLocaleTimeString()}] ✅ Auditoria concluída com sucesso! Todos os equipamentos cadastrados estão presentes no ambiente.`);
      }

      return NextResponse.json({
        success: true,
        mode,
        analysis: analysisResult,
        comparisons,
        hasDiscrepancies,
        createdIncidentId,
        logs,
      });
    }

    // ==========================================
    // CASO DE USO 3: CADASTRO / PROVISIONAMENTO AUTOMÁTICO (provision)
    // ==========================================
    if (mode === "provision") {
      // Apenas Administradores podem obter sugestões de provisionamento
      if (authResult.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Acesso restrito: Apenas administradores podem provisionar salas." },
          { status: 403 }
        );
      }

      logs.push(`[${new Date().toLocaleTimeString()}] Processando sugestões de provisionamento automático...`);
      const suggestions: ProvisionItemSuggestion[] = [];

      // Mapeia as classes detectadas para sugestões de cadastro
      Object.entries(detectedClasses).forEach(([aiClass, count]) => {
        // Ignora pessoas ou classes desconhecidas no provisionamento de ativos fixos
        if (aiClass !== "person" && count > 0) {
          const metadata = CLASS_METADATA_MAP[aiClass] || { label: aiClass.charAt(0).toUpperCase() + aiClass.slice(1), icon: "📦" };
          suggestions.push({
            name: metadata.label,
            quantity: count,
            icon: metadata.icon,
          });
          logs.push(`[IA SUGGEST] IA identificou "${metadata.label}" (Qtd: ${count}). Adicionado às sugestões de provisionamento.`);
        }
      });

      if (suggestions.length === 0) {
        logs.push(`[${new Date().toLocaleTimeString()}] Nenhum equipamento cadastrável foi identificado na foto enviada.`);
      } else {
        logs.push(`[${new Date().toLocaleTimeString()}] Total de ${suggestions.length} tipo(s) de equipamento(s) identificado(s) pronto(s) para revisão.`);
      }

      return NextResponse.json({
        success: true,
        mode,
        analysis: analysisResult,
        suggestions,
        logs,
      });
    }

    return NextResponse.json({ error: "Modo de análise inválido." }, { status: 400 });
  } catch (error) {
    console.error("❌ Erro ao processar rota de visão computacional:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor ao analisar a imagem",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

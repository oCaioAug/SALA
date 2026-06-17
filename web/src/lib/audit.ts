import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface AuditLogInput {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  organizationId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        organizationId: input.organizationId ?? null,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    console.error("[audit] Falha ao registrar log:", error);
  }
}

import { SectorMemberRole } from "@prisma/client";
import { z } from "zod";

export const sectorCreateBodySchema = z.object({
  name: z
    .string({ message: "Nome do setor é obrigatório" })
    .min(1, "Nome do setor é obrigatório")
    .max(120),
  description: z.string().max(500).nullable().optional(),
  roomIds: z.array(z.string().min(1)).optional(),
  memberUserIds: z.array(z.string().min(1)).optional(),
});

export const sectorUpdateBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  roomIds: z.array(z.string().min(1)).optional(),
  /** When provided, replaces the sector manager list with these org members. */
  memberUserIds: z.array(z.string().min(1)).optional(),
});

export const sectorMemberBodySchema = z.object({
  userId: z.string().min(1, "ID do usuário é obrigatório"),
  role: z.nativeEnum(SectorMemberRole).optional().default(SectorMemberRole.MANAGER),
});

export type SectorCreateBody = z.infer<typeof sectorCreateBodySchema>;
export type SectorUpdateBody = z.infer<typeof sectorUpdateBodySchema>;
export type SectorMemberBody = z.infer<typeof sectorMemberBodySchema>;

import { SectorMemberRole } from "@prisma/client";
import { z } from "zod";

const atLeastOneCapability = (
  value: {
    canApproveReservations: boolean;
    canManageRooms: boolean;
  },
  ctx: z.RefinementCtx
) => {
  if (value.canApproveReservations || value.canManageRooms) {
    return;
  }
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: "Selecione ao menos uma função",
  });
};

export const sectorMemberCapabilitiesSchema = z
  .object({
    userId: z.string().min(1, "ID do usuário é obrigatório"),
    canApproveReservations: z.boolean().optional().default(true),
    canManageRooms: z.boolean().optional().default(true),
  })
  .superRefine(atLeastOneCapability);

export type SectorMemberCapabilitiesInput = z.infer<
  typeof sectorMemberCapabilitiesSchema
>;

export const sectorCreateBodySchema = z.object({
  name: z
    .string({ message: "Nome do setor é obrigatório" })
    .min(1, "Nome do setor é obrigatório")
    .max(120),
  description: z.string().max(500).nullable().optional(),
  roomIds: z.array(z.string().min(1)).optional(),
  memberUserIds: z.array(z.string().min(1)).optional(),
  members: z.array(sectorMemberCapabilitiesSchema).optional(),
});

export const sectorUpdateBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  roomIds: z.array(z.string().min(1)).optional(),
  /** When provided, replaces the sector manager list with these org members. */
  memberUserIds: z.array(z.string().min(1)).optional(),
  members: z.array(sectorMemberCapabilitiesSchema).optional(),
});

export const sectorMemberBodySchema = z
  .object({
    userId: z.string().min(1, "ID do usuário é obrigatório"),
    role: z
      .nativeEnum(SectorMemberRole)
      .optional()
      .default(SectorMemberRole.MANAGER),
    canApproveReservations: z.boolean().optional().default(true),
    canManageRooms: z.boolean().optional().default(true),
  })
  .superRefine(atLeastOneCapability);

export type SectorCreateBody = z.infer<typeof sectorCreateBodySchema>;
export type SectorUpdateBody = z.infer<typeof sectorUpdateBodySchema>;
export type SectorMemberBody = z.infer<typeof sectorMemberBodySchema>;

export function resolveSectorMembersInput(data: {
  members?: SectorMemberCapabilitiesInput[];
  memberUserIds?: string[];
}): SectorMemberCapabilitiesInput[] | undefined {
  if (data.members !== undefined) {
    return data.members;
  }
  if (data.memberUserIds !== undefined) {
    return data.memberUserIds.map(userId => ({
      userId,
      canApproveReservations: true,
      canManageRooms: true,
    }));
  }
  return undefined;
}

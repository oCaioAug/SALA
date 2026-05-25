import { OrganizationRole } from "@prisma/client";
import { z } from "zod";

export const selfCreateOrganizationSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido")
    .optional(),
});

export const createOrganizationInviteSchema = z.object({
  email: z.string().email(),
  role: z
    .nativeEnum(OrganizationRole)
    .refine(r => r !== OrganizationRole.OWNER, {
      message: "Convite não pode atribuir papel OWNER",
    })
    .default(OrganizationRole.MEMBER),
});

import { OrganizationRole } from "@prisma/client";
import { z } from "zod";

import {
  isValidCnpj,
  stripDocument,
} from "@/lib/validations/brazilian-documents";

export const organizationEmailSchema = z
  .string()
  .email("Email da organização inválido")
  .max(255);

export const organizationPhoneSchema = z
  .string()
  .min(10, "Telefone da organização inválido")
  .max(20)
  .transform(v => stripDocument(v));

export const organizationContactFieldsSchema = z.object({
  email: organizationEmailSchema,
  phone: organizationPhoneSchema,
});

export const selfCreateOrganizationSchema = z.object({
  name: z.string().min(2).max(120),
  legalName: z.string().min(2).max(200),
  cnpj: z
    .string()
    .min(14)
    .max(18)
    .refine(isValidCnpj, "CNPJ inválido")
    .transform(stripDocument),
  email: organizationEmailSchema,
  phone: organizationPhoneSchema,
  planId: z.string().min(1, "Selecione um plano"),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido")
    .optional(),
  isSchool: z.boolean().default(false).optional(),
});

export type SelfCreateOrganizationInput = z.infer<
  typeof selfCreateOrganizationSchema
>;

export const createOrganizationStep1Schema = selfCreateOrganizationSchema.omit({
  planId: true,
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

import { z } from "zod";

import {
  isValidCnpj,
  isValidCpf,
  stripDocument,
} from "@/lib/validations/brazilian-documents";

const passwordSchema = z
  .string()
  .min(8, "Senha deve ter no mínimo 8 caracteres")
  .max(128)
  .regex(/[a-zA-Z]/, "Senha deve conter pelo menos uma letra")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número");

const registerFieldsSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  password: passwordSchema,
  confirmPassword: z.string(),
  cpf: z
    .string()
    .min(11)
    .max(14)
    .refine(isValidCpf, "CPF inválido")
    .transform(stripDocument),
  phone: z
    .string()
    .min(10)
    .max(20)
    .transform(v => stripDocument(v)),
  organizationName: z.string().min(2).max(120),
  legalName: z.string().min(2).max(200),
  cnpj: z
    .string()
    .min(14)
    .max(18)
    .refine(isValidCnpj, "CNPJ inválido")
    .transform(stripDocument),
  organizationEmail: z.string().email().max(255),
  organizationPhone: z
    .string()
    .min(10)
    .max(20)
    .transform(v => stripDocument(v)),
});

const passwordMatchRefine = {
  refine: (data: { password: string; confirmPassword: string }) =>
    data.password === data.confirmPassword,
  message: "As senhas não coincidem",
  path: ["confirmPassword"] as const,
};

export const registerStep1Schema = registerFieldsSchema.refine(
  passwordMatchRefine.refine,
  {
    message: passwordMatchRefine.message,
    path: [...passwordMatchRefine.path],
  }
);

export const registerSchema = registerFieldsSchema
  .extend({
    acceptTerms: z.literal(true, {
      error: "Você deve aceitar os termos de serviço",
    }),
    planId: z.string().min(1, "Selecione um plano"),
  })
  .refine(passwordMatchRefine.refine, {
    message: passwordMatchRefine.message,
    path: [...passwordMatchRefine.path],
  });

export type RegisterStep1Input = z.infer<typeof registerStep1Schema>;

export type RegisterInput = z.infer<typeof registerSchema>;

export const credentialsLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

import { z } from "zod";

import {
  isValidCpf,
  stripDocument,
} from "@/lib/validations/brazilian-documents";

export const completeProfileSchema = z.object({
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
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

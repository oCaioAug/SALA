import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Senha deve ter no mínimo 8 caracteres")
  .max(128)
  .regex(/[a-zA-Z]/, "Senha deve conter pelo menos uma letra")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número");

const accountFieldsSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  password: passwordSchema,
  confirmPassword: z.string(),
});

const passwordMatchRefine = {
  refine: (data: { password: string; confirmPassword: string }) =>
    data.password === data.confirmPassword,
  message: "As senhas não coincidem",
  path: ["confirmPassword"] as const,
};

const acceptTermsField = {
  acceptTerms: z.literal(true, {
    error: "Você deve aceitar os termos de serviço",
  }),
};

export const accountRegisterSchema = accountFieldsSchema
  .extend(acceptTermsField)
  .refine(passwordMatchRefine.refine, {
    message: passwordMatchRefine.message,
    path: [...passwordMatchRefine.path],
  });

export type AccountRegisterInput = z.infer<typeof accountRegisterSchema>;

export const credentialsLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const setPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(passwordMatchRefine.refine, {
    message: passwordMatchRefine.message,
    path: [...passwordMatchRefine.path],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(passwordMatchRefine.refine, {
    message: passwordMatchRefine.message,
    path: [...passwordMatchRefine.path],
  });

export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email().max(255),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(passwordMatchRefine.refine, {
    message: passwordMatchRefine.message,
    path: [...passwordMatchRefine.path],
  });

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

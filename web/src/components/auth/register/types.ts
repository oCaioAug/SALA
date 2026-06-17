export type PublicPlan = {
  id: string;
  name: string;
  slug: string;
  maxRooms: number;
  maxUsers: number;
  maxReservationsPerMonth: number | null;
  features: unknown;
};

export type RegisterFormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  cpf: string;
  phone: string;
  organizationName: string;
  legalName: string;
  cnpj: string;
  organizationEmail: string;
  organizationPhone: string;
  acceptTerms: boolean;
  planId: string;
};

export const initialRegisterForm: RegisterFormState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  cpf: "",
  phone: "",
  organizationName: "",
  legalName: "",
  cnpj: "",
  organizationEmail: "",
  organizationPhone: "",
  acceptTerms: false,
  planId: "",
};

export const REGISTER_STEPS = [1, 2, 3, 4] as const;
export type RegisterStep = (typeof REGISTER_STEPS)[number];

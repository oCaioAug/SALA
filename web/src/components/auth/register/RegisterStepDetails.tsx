"use client";

import { useTranslations } from "next-intl";
import React from "react";

import { AuthField, AuthSectionTitle } from "@/components/auth/AuthForm";
import {
  authInputClass,
  authInputErrorClass,
} from "@/components/auth/auth-styles";
import { MaskedInput } from "@/components/ui/MaskedInput";
import {
  maskCnpj,
  maskCpf,
  maskPhone,
} from "@/lib/validations/brazilian-documents";
import { cn } from "@/lib/utils";

import type { RegisterFormState } from "./types";

type RegisterStepDetailsProps = {
  form: RegisterFormState;
  fieldErrors: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFieldChange: (name: keyof RegisterFormState, value: string) => void;
};

export function RegisterStepDetails({
  form,
  fieldErrors,
  onChange,
  onFieldChange,
}: RegisterStepDetailsProps) {
  const t = useTranslations("Auth.register");

  const inputClass = (field?: string) =>
    cn(authInputClass, field && fieldErrors[field] && authInputErrorClass);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <AuthSectionTitle>{t("sections.personal")}</AuthSectionTitle>

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField label={t("fields.name")} required error={fieldErrors.name}>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder={t("placeholders.name")}
              className={inputClass("name")}
            />
          </AuthField>

          <AuthField label={t("fields.email")} required error={fieldErrors.email}>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder={t("placeholders.email")}
              autoComplete="email"
              className={inputClass("email")}
            />
          </AuthField>

          <AuthField label={t("fields.cpf")} required error={fieldErrors.cpf}>
            <MaskedInput
              name="cpf"
              value={form.cpf}
              onValueChange={value => onFieldChange("cpf", value)}
              format={maskCpf}
              placeholder={t("placeholders.cpf")}
              maxLength={14}
              autoComplete="off"
              inputClassName={inputClass("cpf")}
            />
          </AuthField>

          <AuthField label={t("fields.phone")} required error={fieldErrors.phone}>
            <MaskedInput
              name="phone"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onValueChange={value => onFieldChange("phone", value)}
              format={maskPhone}
              placeholder={t("placeholders.phone")}
              maxLength={16}
              autoComplete="tel"
              inputClassName={inputClass("phone")}
            />
          </AuthField>

          <AuthField
            label={t("fields.password")}
            required
            error={fieldErrors.password}
          >
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              placeholder={t("placeholders.password")}
              autoComplete="new-password"
              className={inputClass("password")}
            />
          </AuthField>

          <AuthField
            label={t("fields.confirmPassword")}
            required
            error={fieldErrors.confirmPassword}
          >
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={onChange}
              placeholder={t("placeholders.confirmPassword")}
              autoComplete="new-password"
              className={inputClass("confirmPassword")}
            />
          </AuthField>
        </div>
      </section>

      <section className="space-y-4">
        <AuthSectionTitle>{t("sections.organization")}</AuthSectionTitle>

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField
            label={t("fields.organizationName")}
            required
            error={fieldErrors.organizationName}
          >
            <input
              name="organizationName"
              value={form.organizationName}
              onChange={onChange}
              placeholder={t("placeholders.organizationName")}
              className={inputClass("organizationName")}
            />
          </AuthField>

          <AuthField
            label={t("fields.legalName")}
            required
            error={fieldErrors.legalName}
          >
            <input
              name="legalName"
              value={form.legalName}
              onChange={onChange}
              placeholder={t("placeholders.legalName")}
              className={inputClass("legalName")}
            />
          </AuthField>

          <AuthField label={t("fields.cnpj")} required error={fieldErrors.cnpj}>
            <MaskedInput
              name="cnpj"
              value={form.cnpj}
              onValueChange={value => onFieldChange("cnpj", value)}
              format={maskCnpj}
              placeholder={t("placeholders.cnpj")}
              maxLength={18}
              autoComplete="off"
              inputClassName={inputClass("cnpj")}
            />
          </AuthField>

          <AuthField
            label={t("fields.organizationEmail")}
            required
            error={fieldErrors.organizationEmail}
          >
            <input
              type="email"
              name="organizationEmail"
              value={form.organizationEmail}
              onChange={onChange}
              placeholder={t("placeholders.organizationEmail")}
              autoComplete="organization"
              className={inputClass("organizationEmail")}
            />
          </AuthField>

          <AuthField
            label={t("fields.organizationPhone")}
            required
            error={fieldErrors.organizationPhone}
          >
            <MaskedInput
              name="organizationPhone"
              type="tel"
              inputMode="tel"
              value={form.organizationPhone}
              onValueChange={value => onFieldChange("organizationPhone", value)}
              format={maskPhone}
              placeholder={t("placeholders.organizationPhone")}
              maxLength={16}
              autoComplete="tel"
              inputClassName={inputClass("organizationPhone")}
            />
          </AuthField>
        </div>
      </section>
    </div>
  );
}

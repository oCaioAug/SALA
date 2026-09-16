"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import React, { useState } from "react";

import {
  AuthError,
  AuthField,
  AuthPrimaryButton,
  AuthSectionTitle,
} from "@/components/auth/AuthForm";
import {
  authInputClass,
  authInputErrorClass,
} from "@/components/auth/auth-styles";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { useApiErrorMessage } from "@/lib/hooks/useApiErrorMessage";
import { completeProfileSchema } from "@/lib/validations/user-profile";
import { maskCpf, maskPhone } from "@/lib/validations/brazilian-documents";
import { cn } from "@/lib/utils";

type CompleteProfileStepProps = {
  onComplete: () => void;
};

export function CompleteProfileStep({ onComplete }: CompleteProfileStepProps) {
  const t = useTranslations("ProfileSetup");
  const { data: session } = useSession();
  const { fromPayload } = useApiErrorMessage();

  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const inputClass = (field?: string) =>
    cn(authInputClass, field && fieldErrors[field] && authInputErrorClass);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      const parsed = completeProfileSchema.safeParse({ cpf, phone });
      if (!parsed.success) {
        const errors: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          const field = issue.path[0];
          if (typeof field === "string" && !errors[field]) {
            errors[field] = issue.message;
          }
        }
        setFieldErrors(errors);
        setFormError(t("messages.fixErrors"));
        return;
      }

      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.issues?.length) {
          const errors: Record<string, string> = {};
          for (const issue of data.issues) {
            const field = issue.path?.[0];
            if (field && !errors[field]) errors[field] = issue.message;
          }
          setFieldErrors(errors);
        }
        setFormError(fromPayload(data) || t("errors.generic"));
        return;
      }

      onComplete();
    } catch {
      setFormError(t("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {formError && <AuthError>{formError}</AuthError>}

      <section className="space-y-4">
        <AuthSectionTitle>{t("sections.account")}</AuthSectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField label={t("fields.name")}>
            <input
              value={session?.user?.name ?? ""}
              readOnly
              className={cn(authInputClass, "cursor-not-allowed opacity-70")}
            />
          </AuthField>
          <AuthField label={t("fields.email")}>
            <input
              value={session?.user?.email ?? ""}
              readOnly
              className={cn(authInputClass, "cursor-not-allowed opacity-70")}
            />
          </AuthField>
        </div>
      </section>

      <section className="space-y-4">
        <AuthSectionTitle>{t("sections.personal")}</AuthSectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField label={t("fields.cpf")} required error={fieldErrors.cpf}>
            <MaskedInput
              name="cpf"
              value={cpf}
              onValueChange={setCpf}
              format={maskCpf}
              placeholder={t("placeholders.cpf")}
              maxLength={14}
              autoComplete="off"
              inputClassName={inputClass("cpf")}
            />
          </AuthField>
          <AuthField
            label={t("fields.phone")}
            required
            error={fieldErrors.phone}
          >
            <MaskedInput
              name="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onValueChange={setPhone}
              format={maskPhone}
              placeholder={t("placeholders.phone")}
              maxLength={16}
              autoComplete="tel"
              inputClassName={inputClass("phone")}
            />
          </AuthField>
        </div>
      </section>

      <AuthPrimaryButton loading={isLoading}>{t("submit")}</AuthPrimaryButton>
    </form>
  );
}

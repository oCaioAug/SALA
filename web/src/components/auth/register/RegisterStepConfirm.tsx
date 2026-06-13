"use client";

import { useTranslations } from "next-intl";
import React from "react";

import { Link } from "@/navigation";

import type { PublicPlan, RegisterFormState } from "./types";

type RegisterStepConfirmProps = {
  form: RegisterFormState;
  plan: PublicPlan | null;
  fieldErrors: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function RegisterStepConfirm({
  form,
  plan,
  fieldErrors,
  onChange,
}: RegisterStepConfirmProps) {
  const t = useTranslations("Auth.register.step4");
  const tLogin = useTranslations("Auth.login");

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center lg:text-left">
        <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
        <p className="text-sm text-foreground">
          {t("readyMessage", {
            organization: form.organizationName,
            plan: plan?.name ?? "—",
          })}
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50">
        <input
          type="checkbox"
          name="acceptTerms"
          checked={form.acceptTerms}
          onChange={onChange}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-violet-600 focus:ring-violet-500/40"
        />
        <span className="text-sm leading-relaxed text-foreground">
          {t("acceptTermsPrefix")}{" "}
          <Link
            href="/terms-of-service"
            className="font-medium text-violet-600 underline-offset-2 hover:text-violet-500 hover:underline dark:text-violet-400 dark:hover:text-violet-300"
          >
            {tLogin("termsOfService")}
          </Link>{" "}
          {tLogin("legalAnd")}{" "}
          <Link
            href="/privacy-policy"
            className="font-medium text-violet-600 underline-offset-2 hover:text-violet-500 hover:underline dark:text-violet-400 dark:hover:text-violet-300"
          >
            {tLogin("privacyPolicy")}
          </Link>
          .
        </span>
      </label>
      {fieldErrors.acceptTerms && (
        <p className="text-sm text-red-600 dark:text-red-400">{fieldErrors.acceptTerms}</p>
      )}
    </div>
  );
}

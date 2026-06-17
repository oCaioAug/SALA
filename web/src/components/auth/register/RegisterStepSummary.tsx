"use client";

import { useTranslations } from "next-intl";
import React from "react";

import type { PublicPlan, RegisterFormState } from "./types";

type RegisterStepSummaryProps = {
  form: RegisterFormState;
  plan: PublicPlan | null;
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground sm:text-right">{value || "—"}</dd>
    </div>
  );
}

function SummarySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-muted/30 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-400">
        {title}
      </h3>
      <dl className="space-y-3">{children}</dl>
    </section>
  );
}

export function RegisterStepSummary({ form, plan }: RegisterStepSummaryProps) {
  const t = useTranslations("Auth.register.step3");

  return (
    <div className="space-y-4">
      <div className="space-y-1 text-center lg:text-left">
        <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <SummarySection title={t("personal")}>
        <SummaryRow label={t("fields.name")} value={form.name} />
        <SummaryRow label={t("fields.email")} value={form.email} />
        <SummaryRow label={t("fields.cpf")} value={form.cpf} />
        <SummaryRow label={t("fields.phone")} value={form.phone} />
      </SummarySection>

      <SummarySection title={t("organization")}>
        <SummaryRow
          label={t("fields.organizationName")}
          value={form.organizationName}
        />
        <SummaryRow label={t("fields.legalName")} value={form.legalName} />
        <SummaryRow label={t("fields.cnpj")} value={form.cnpj} />
        <SummaryRow
          label={t("fields.organizationEmail")}
          value={form.organizationEmail}
        />
        <SummaryRow
          label={t("fields.organizationPhone")}
          value={form.organizationPhone}
        />
      </SummarySection>

      {plan && (
        <SummarySection title={t("plan")}>
          <SummaryRow label={t("fields.planName")} value={plan.name} />
          <SummaryRow
            label={t("fields.planLimits")}
            value={t("planLimitsValue", {
              rooms: plan.maxRooms,
              users: plan.maxUsers,
            })}
          />
          <SummaryRow label={t("fields.trial")} value={t("trialValue")} />
        </SummarySection>
      )}
    </div>
  );
}

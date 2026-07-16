"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";

import {
  authInputClass,
  authInputErrorClass,
} from "@/components/auth/auth-styles";
import {
  AuthError,
  AuthField,
  AuthPrimaryButton,
  AuthSecondaryButton,
  AuthSectionTitle,
} from "@/components/auth/AuthForm";
import { AuthStepProgress } from "@/components/auth/register/AuthStepProgress";
import { RegisterStepPlan } from "@/components/auth/register/RegisterStepPlan";
import type { PublicPlan } from "@/components/auth/register/types";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { useApiErrorMessage } from "@/lib/hooks/useApiErrorMessage";
import { cn } from "@/lib/utils";
import { maskCnpj, maskPhone } from "@/lib/validations/brazilian-documents";
import { createOrganizationStep1Schema } from "@/lib/validations/organization";

type CreateOrgForm = {
  name: string;
  legalName: string;
  cnpj: string;
  email: string;
  phone: string;
  planId: string;
  isSchool: boolean;
};

const initialForm: CreateOrgForm = {
  name: "",
  legalName: "",
  cnpj: "",
  email: "",
  phone: "",
  planId: "",
  isSchool: false,
};

const STEPS = [1, 2, 3] as const;
type WizardStep = (typeof STEPS)[number];

type CreateOrganizationWizardProps = {
  onCancel?: () => void;
  cancelHref?: string;
  successHref?: string;
  requireProfile?: boolean;
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

export function CreateOrganizationWizard({
  onCancel,
  cancelHref,
  successHref = "/organizations",
  requireProfile = true,
}: CreateOrganizationWizardProps) {
  const t = useTranslations("CreateOrganizationPage");
  const { fromPayload } = useApiErrorMessage();
  const router = useRouter();
  const { update } = useSession();

  const [profileChecked, setProfileChecked] = useState(!requireProfile);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [form, setForm] = useState<CreateOrgForm>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);

  const selectedPlan = useMemo(
    () => plans.find(plan => plan.id === form.planId) ?? null,
    [form.planId, plans]
  );

  useEffect(() => {
    if (!requireProfile) {
      setProfileChecked(true);
      return;
    }

    let cancelled = false;

    const checkProfile = async () => {
      try {
        const res = await fetch("/api/users/me");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (!data.profileComplete) {
          router.replace("/organizations/setup");
          return;
        }
        setProfileChecked(true);
      } catch {
        if (!cancelled) setProfileChecked(true);
      }
    };

    void checkProfile();
    return () => {
      cancelled = true;
    };
  }, [requireProfile, router]);

  useEffect(() => {
    if (currentStep !== 2) return;

    let cancelled = false;

    const loadPlans = async () => {
      setPlansLoading(true);
      setPlansError(null);
      try {
        const res = await fetch("/api/plans");
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as PublicPlan[];
        if (!cancelled) setPlans(data);
      } catch {
        if (!cancelled) setPlansError(t("step2.error"));
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    };

    void loadPlans();
    return () => {
      cancelled = true;
    };
  }, [currentStep, t]);

  const inputClass = (field?: string) =>
    cn(authInputClass, field && fieldErrors[field] && authInputErrorClass);

  const mapZodErrors = (
    issues: { path?: PropertyKey[]; message: string }[]
  ) => {
    const errors: Record<string, string> = {};
    for (const issue of issues) {
      const field = issue.path?.[0];
      if (typeof field === "string" && !errors[field]) {
        errors[field] = issue.message;
      }
    }
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({ ...prev, [name]: "" }));
    setFormError(null);
  };

  const handleFieldChange = (name: keyof CreateOrgForm, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({ ...prev, [name]: "" }));
    setFormError(null);
  };

  const validateStep1 = () => {
    const result = createOrganizationStep1Schema.safeParse(form);
    if (result.success) {
      setFieldErrors({});
      return true;
    }
    setFieldErrors(mapZodErrors(result.error.issues));
    setFormError(t("messages.fixErrors"));
    return false;
  };

  const handleNext = () => {
    setFormError(null);

    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!form.planId) {
        setFormError(t("step2.selectPlan"));
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => (prev - 1) as WizardStep);
      setFormError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep !== 3) {
      handleNext();
      return;
    }

    setIsLoading(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.issues?.length) {
          setFieldErrors(mapZodErrors(data.issues));
          const planIssue = data.issues.some(
            (i: { path?: string[] }) => i.path?.[0] === "planId"
          );
          setCurrentStep(planIssue ? 2 : 1);
        }
        if (data.errorCode === "PROFILE_INCOMPLETE") {
          router.replace("/organizations/setup");
          return;
        }
        setFormError(fromPayload(data) || t("errors.generic"));
        return;
      }

      await update({ preferOrganizationId: data.id });
      router.push(successHref);
      router.refresh();
    } catch {
      setFormError(t("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed =
    currentStep === 1
      ? createOrganizationStep1Schema.safeParse(form).success
      : currentStep === 2
        ? Boolean(form.planId)
        : true;

  const stepLabels = {
    1: t("steps.step1"),
    2: t("steps.step2"),
    3: t("steps.step3"),
  };

  if (!profileChecked) {
    return null;
  }

  return (
    <div className="space-y-6">
      <AuthStepProgress
        currentStep={currentStep}
        steps={STEPS}
        labels={stepLabels}
      />

      {formError && <AuthError>{formError}</AuthError>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {currentStep === 1 && (
          <section className="space-y-4">
            <AuthSectionTitle>{t("sections.organization")}</AuthSectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <AuthField
                label={t("fields.name")}
                required
                error={fieldErrors.name}
              >
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={t("placeholders.name")}
                  className={inputClass("name")}
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
                  onChange={handleChange}
                  placeholder={t("placeholders.legalName")}
                  className={inputClass("legalName")}
                />
              </AuthField>

              <AuthField
                label={t("fields.cnpj")}
                required
                error={fieldErrors.cnpj}
              >
                <MaskedInput
                  name="cnpj"
                  value={form.cnpj}
                  onValueChange={value => handleFieldChange("cnpj", value)}
                  format={maskCnpj}
                  placeholder={t("placeholders.cnpj")}
                  maxLength={18}
                  autoComplete="off"
                  inputClassName={inputClass("cnpj")}
                />
              </AuthField>

              <AuthField
                label={t("fields.email")}
                required
                error={fieldErrors.email}
              >
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t("placeholders.email")}
                  autoComplete="organization"
                  className={inputClass("email")}
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
                  value={form.phone}
                  onValueChange={value => handleFieldChange("phone", value)}
                  format={maskPhone}
                  placeholder={t("placeholders.phone")}
                  maxLength={16}
                  autoComplete="tel"
                  inputClassName={inputClass("phone")}
                />
              </AuthField>

              <AuthField
                label="Instituição de Ensino"
                error={fieldErrors.isSchool}
              >
                <label className="flex items-center gap-3 mt-2 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      name="isSchool"
                      checked={form.isSchool}
                      onChange={e => {
                        handleFieldChange("isSchool", e.target.checked as any);
                      }}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Ativar módulo de Grade Horária para Escolas/Universidades
                  </span>
                </label>
              </AuthField>
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <RegisterStepPlan
            plans={plans}
            selectedPlanId={form.planId}
            loading={plansLoading}
            error={plansError}
            onSelect={plan => handleFieldChange("planId", plan.id)}
          />
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">
                {t("step3.title")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("step3.subtitle")}
              </p>
            </div>

            <section className="rounded-xl border border-border bg-muted/30 p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-violet-400/90">
                {t("sections.organization")}
              </h3>
              <dl className="space-y-3">
                <SummaryRow label={t("fields.name")} value={form.name} />
                <SummaryRow
                  label={t("fields.legalName")}
                  value={form.legalName}
                />
                <SummaryRow label={t("fields.cnpj")} value={form.cnpj} />
                <SummaryRow label={t("fields.email")} value={form.email} />
                <SummaryRow label={t("fields.phone")} value={form.phone} />
                <SummaryRow
                  label="Instituição de Ensino"
                  value={form.isSchool ? "Sim" : "Não"}
                />
              </dl>
            </section>

            {selectedPlan && (
              <section className="rounded-xl border border-border bg-muted/30 p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-violet-400/90">
                  {t("sections.plan")}
                </h3>
                <dl className="space-y-3">
                  <SummaryRow
                    label={t("fields.planName")}
                    value={selectedPlan.name}
                  />
                  <SummaryRow
                    label={t("fields.planLimits")}
                    value={t("step3.planLimitsValue", {
                      rooms: selectedPlan.maxRooms,
                      users: selectedPlan.maxUsers,
                    })}
                  />
                  <SummaryRow
                    label={t("fields.trial")}
                    value={t("step3.trialValue")}
                  />
                </dl>
              </section>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          {currentStep > 1 ? (
            <AuthSecondaryButton
              type="button"
              onClick={handleBack}
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4" />
              {t("buttons.back")}
            </AuthSecondaryButton>
          ) : cancelHref || onCancel ? (
            <AuthSecondaryButton
              type="button"
              disabled={isLoading}
              onClick={() => {
                if (onCancel) onCancel();
                else if (cancelHref) router.push(cancelHref);
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              {t("buttons.cancel")}
            </AuthSecondaryButton>
          ) : (
            <div className="hidden sm:block" />
          )}

          <AuthPrimaryButton
            loading={isLoading}
            disabled={!canProceed || isLoading}
            className="sm:min-w-[180px]"
          >
            {isLoading ? (
              t("submitting")
            ) : currentStep === 3 ? (
              t("submit")
            ) : (
              <>
                {t("buttons.next")}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </AuthPrimaryButton>
        </div>
      </form>
    </div>
  );
}

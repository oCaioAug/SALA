"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";

import {
  AuthCard,
  AuthDivider,
  AuthError,
  AuthFooterLink,
  AuthGoogleButton,
  AuthPrimaryButton,
  AuthSecondaryButton,
} from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthStepProgress } from "@/components/auth/register/AuthStepProgress";
import { RegisterStepConfirm } from "@/components/auth/register/RegisterStepConfirm";
import { RegisterStepDetails } from "@/components/auth/register/RegisterStepDetails";
import { RegisterStepPlan } from "@/components/auth/register/RegisterStepPlan";
import { RegisterStepSummary } from "@/components/auth/register/RegisterStepSummary";
import {
  initialRegisterForm,
  type PublicPlan,
  type RegisterFormState,
  type RegisterStep,
} from "@/components/auth/register/types";
import { useApiErrorMessage } from "@/lib/hooks/useApiErrorMessage";
import { registerStep1Schema } from "@/lib/validations/auth";
import { Link } from "@/navigation";

export default function RegisterPage() {
  const t = useTranslations("Auth.register");
  const tLogin = useTranslations("Auth.login");
  const { fromPayload } = useApiErrorMessage();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<RegisterStep>(1);
  const [form, setForm] = useState<RegisterFormState>(initialRegisterForm);
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

  const stepSubtitle = {
    1: t("subtitles.step1"),
    2: t("subtitles.step2"),
    3: t("subtitles.step3"),
    4: t("subtitles.step4"),
  }[currentStep];

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

  const handleFieldChange = (name: keyof RegisterFormState, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({ ...prev, [name]: "" }));
    setFormError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFieldErrors(prev => ({ ...prev, [name]: "" }));
    setFormError(null);
  };

  const mapZodErrors = (issues: { path?: (string | number)[]; message: string }[]) => {
    const errors: Record<string, string> = {};
    for (const issue of issues) {
      const field = issue.path?.[0];
      if (typeof field === "string" && !errors[field]) {
        errors[field] = issue.message;
      }
    }
    return errors;
  };

  const validateStep1 = () => {
    const result = registerStep1Schema.safeParse(form);
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
      return;
    }

    if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => (prev - 1) as RegisterStep);
      setFormError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== 4) {
      handleNext();
      return;
    }

    if (!form.acceptTerms) {
      setFieldErrors({ acceptTerms: t("messages.acceptTerms") });
      return;
    }

    setIsLoading(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.issues?.length) {
          setFieldErrors(mapZodErrors(data.issues));
          if (data.issues.some((i: { path?: string[] }) => i.path?.[0] === "planId")) {
            setCurrentStep(2);
          } else {
            setCurrentStep(1);
          }
        }
        setFormError(fromPayload(data) || t("errors.generic"));
        return;
      }

      const signInResult = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
        callbackUrl: "/organizations",
      });

      if (signInResult?.error) {
        router.push("/auth/login?registered=1");
        return;
      }

      router.push("/organizations");
    } catch {
      setFormError(t("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    await signIn("google", { callbackUrl: "/organizations", redirect: true });
  };

  const handlePlanSelect = (plan: PublicPlan) => {
    setForm(prev => ({ ...prev, planId: plan.id }));
    setFormError(null);
  };

  const canProceed =
    currentStep === 1
      ? registerStep1Schema.safeParse(form).success
      : currentStep === 2
        ? Boolean(form.planId)
        : currentStep === 3
          ? true
          : form.acceptTerms;

  return (
    <AuthShell wide>
      <AuthCard title={t("title")} subtitle={stepSubtitle}>
        <AuthStepProgress currentStep={currentStep} />

        {formError && <AuthError>{formError}</AuthError>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep === 1 && (
            <RegisterStepDetails
              form={form}
              fieldErrors={fieldErrors}
              onChange={handleChange}
              onFieldChange={handleFieldChange}
            />
          )}

          {currentStep === 2 && (
            <RegisterStepPlan
              plans={plans}
              selectedPlanId={form.planId}
              loading={plansLoading}
              error={plansError}
              onSelect={handlePlanSelect}
            />
          )}

          {currentStep === 3 && (
            <RegisterStepSummary form={form} plan={selectedPlan} />
          )}

          {currentStep === 4 && (
            <RegisterStepConfirm
              form={form}
              plan={selectedPlan}
              fieldErrors={fieldErrors}
              onChange={handleChange}
            />
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
              ) : currentStep === 4 ? (
                t("submit")
              ) : (
                <>
                  {t("buttons.next")}
                  <ArrowRight className="ml-1 inline h-4 w-4" />
                </>
              )}
            </AuthPrimaryButton>
          </div>
        </form>

        {currentStep === 1 && (
          <>
            <AuthDivider label={tLogin("or")} />

            <AuthGoogleButton
              label={t("googleSignUp")}
              onClick={handleGoogleSignUp}
              disabled={isLoading}
            />
          </>
        )}

        <AuthFooterLink>
          {t("hasAccount")}{" "}
          <Link
            href="/auth/login"
            className="font-medium text-violet-400 transition-colors hover:text-violet-300"
          >
            {t("loginLink")}
          </Link>
        </AuthFooterLink>
      </AuthCard>
    </AuthShell>
  );
}

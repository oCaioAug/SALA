"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

import { CompleteProfileStep } from "./CompleteProfileStep";
import { CreateOrganizationWizard } from "./CreateOrganizationWizard";

type MeResponse = {
  profileComplete: boolean;
  hasOrganization: boolean;
};

type OrganizationSetupWizardProps = {
  cancelHref?: string;
  onFinishedHref?: string;
};

export function OrganizationSetupWizard({
  cancelHref = "/organizations",
  onFinishedHref = "/organizations",
}: OrganizationSetupWizardProps) {
  const t = useTranslations("OrganizationSetup");
  const router = useRouter();
  const { update } = useSession();
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [phase, setPhase] = useState<"profile" | "organization">("profile");

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch("/api/users/me");
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as MeResponse;
      setProfileComplete(data.profileComplete);
      setPhase(data.profileComplete ? "organization" : "profile");
    } catch {
      setPhase("profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  const handleProfileComplete = async () => {
    await update();
    setProfileComplete(true);
    setPhase("organization");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-sm text-violet-100/90">
        {phase === "profile" ? t("hintProfile") : t("hintOrganization")}
      </div>

      {phase === "profile" ? (
        <CompleteProfileStep onComplete={handleProfileComplete} />
      ) : (
        <CreateOrganizationWizard
          cancelHref={cancelHref}
          successHref={onFinishedHref}
          requireProfile={false}
        />
      )}

      {!profileComplete && phase === "organization" && null}
    </div>
  );
}

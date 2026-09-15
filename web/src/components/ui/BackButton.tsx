"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useRouter } from "@/navigation";

interface BackButtonProps {
  fallbackUrl?: string;
  className?: string;
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  showIcon?: boolean;
}

export const BackButton: React.FC<BackButtonProps> = ({
  fallbackUrl = "/grade-horaria",
  className,
  children,
  variant = "outline",
  size = "sm",
  showIcon = true,
}) => {
  const router = useRouter();
  const tCommon = useTranslations("GradeHoraria.common");

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleBack}
      className={cn("gap-1.5 transition-colors", className)}
    >
      {showIcon && <ArrowLeft className="h-4 w-4 shrink-0" />}
      <span>{children ?? tCommon("back")}</span>
    </Button>
  );
};

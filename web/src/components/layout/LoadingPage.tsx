"use client";

import React from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface LoadingPageProps {
  message?: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({
  message = "Carregando...",
}) => {
  return (
    <div className="page-container flex items-center justify-center gap-4">
      <LoadingSpinner size="lg" />
      <div className="text-slate-900 dark:text-white text-xl">{message}</div>
    </div>
  );
};


"use client";

import React from "react";
import { useTranslations } from "next-intl";

import { RoomStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: RoomStatus;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const t = useTranslations("Dashboard.filters");
  
  const statusConfig = {
    LIVRE: {
      dotColor: "bg-green-500",
      text: t("statusFree"),
      textColor: "text-green-700 dark:text-green-300",
      bgColor: "bg-green-50 dark:bg-green-500/20",
    },
    EM_USO: {
      dotColor: "bg-red-500",
      text: t("statusInUse"),
      textColor: "text-red-700 dark:text-red-300",
      bgColor: "bg-red-50 dark:bg-red-500/20",
    },
    RESERVADO: {
      dotColor: "bg-yellow-500",
      text: t("statusReserved"),
      textColor: "text-yellow-700 dark:text-yellow-300",
      bgColor: "bg-yellow-50 dark:bg-yellow-500/20",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-full",
        config.bgColor,
        className
      )}
    >
      <div className={cn("h-2 w-2 rounded-full", config.dotColor)} />
      <span className={cn("text-sm font-medium", config.textColor)}>
        {config.text}
      </span>
    </div>
  );
};

export { StatusBadge };

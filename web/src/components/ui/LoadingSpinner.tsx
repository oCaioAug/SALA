import React from "react";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
  /** Horizontal layout for use inside buttons / inline UI */
  inline?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  text,
  className = "",
  inline = false,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div
      className={cn(
        "items-center justify-center",
        inline ? "inline-flex flex-row gap-2" : "flex flex-col gap-3",
        className
      )}
    >
      <div
        className={cn(
          sizeClasses[size],
          "animate-spin rounded-full border-2 border-gray-600 border-t-blue-500 shrink-0"
        )}
      />
      {text ? (
        <p
          className={cn(
            "text-sm",
            inline
              ? "text-current animate-none"
              : "text-gray-400 animate-pulse"
          )}
        >
          {text}
        </p>
      ) : null}
    </div>
  );
};

export { LoadingSpinner };

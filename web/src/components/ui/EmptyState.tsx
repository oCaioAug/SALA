import React from "react";

import { Button } from "./Button";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
    >
      <div className="w-20 h-20 bg-slate-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 transition-colors duration-300">
        {React.isValidElement(icon) ? icon : <div>{icon}</div>}
      </div>

      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-gray-400 mb-6 max-w-md">
        {description}
      </p>

      {action && (
        <Button onClick={action.onClick} className="px-8 py-3">
          {action.label}
        </Button>
      )}
    </div>
  );
};

export { EmptyState };

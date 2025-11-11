import React from "react";

import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined" | "glass";
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { className, children, variant = "default", hover = false, ...props },
    ref
  ) => {
    const variants = {
      default:
        "bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50",
      elevated:
        "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600/50 shadow-2xl",
      outlined:
        "bg-transparent border-2 border-slate-300 dark:border-slate-600/50",
      glass:
        "bg-white/30 dark:bg-slate-800/30 backdrop-blur-xl border-slate-300/30 dark:border-slate-600/30",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border p-6 shadow-lg transition-all duration-300",
          variants[variant],
          hover &&
            "hover:shadow-2xl hover:scale-[1.02] hover:border-slate-400 dark:hover:border-slate-500/50",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-2 pb-6", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn(
        "text-xl font-bold text-slate-900 dark:text-white tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
});

CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn(
        "text-slate-600 dark:text-slate-400 text-sm leading-relaxed",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
});

CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("text-slate-700 dark:text-slate-300", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center pt-6 border-t border-slate-200 dark:border-slate-700/50",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};

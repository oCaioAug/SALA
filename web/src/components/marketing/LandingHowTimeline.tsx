"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const STEPS = ["step1", "step2", "step3", "step4"] as const;

export function LandingHowTimeline() {
  const t = useTranslations("LandingPage.howItWorks");
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight || 1;
      // 0 when section top hits mid viewport; 1 when bottom leaves mid
      const start = viewH * 0.65;
      const end = viewH * 0.25;
      const raw = (start - rect.top) / (start - end + rect.height * 0.35);
      setProgress(Math.min(1, Math.max(0, raw)));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative mx-auto max-w-2xl">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border sm:left-[19px]" />
      <div
        className="absolute left-[15px] top-2 w-px origin-top bg-primary transition-[height] duration-150 ease-out sm:left-[19px]"
        style={{ height: `calc(${progress * 100}% - 0.5rem)` }}
      />

      <ol className="relative space-y-10">
        {STEPS.map((step, i) => {
          const threshold = i / (STEPS.length - 1 || 1);
          const active = progress >= threshold - 0.05;
          return (
            <li key={step} className="flex gap-4 sm:gap-5">
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors sm:h-10 sm:w-10 sm:text-sm",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground"
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="pt-0.5 sm:pt-1.5">
                <h3
                  className={cn(
                    "mb-1 text-base font-semibold transition-colors sm:text-lg",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {t(`${step}.title`)}
                </h3>
                <p
                  className={cn(
                    "text-sm leading-relaxed transition-opacity sm:text-base",
                    active ? "text-muted-foreground opacity-100" : "opacity-50"
                  )}
                >
                  {t(`${step}.desc`)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

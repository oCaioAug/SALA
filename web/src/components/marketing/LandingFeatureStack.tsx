"use client";

import {
  AlertTriangle,
  Calendar,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const FEATURES: { key: "f1" | "f2" | "f3" | "f4"; icon: LucideIcon }[] = [
  { key: "f1", icon: Calendar },
  { key: "f2", icon: ClipboardList },
  { key: "f3", icon: AlertTriangle },
  { key: "f4", icon: Calendar },
];

const STICKY_TOP = 88;
const CARD_GAP = 16;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Cartões sticky que empilham no scroll — adaptado de Não Codei (j01). */
export function LandingFeatureStack() {
  const t = useTranslations("LandingPage.features");
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
    if (!cards.length) return;

    const measureNatural = () =>
      cards.map(card => {
        const prev = card.style.position;
        card.style.position = "static";
        const y = card.offsetTop;
        card.style.position = prev;
        return y;
      });

    let naturals = measureNatural();
    let raf = 0;
    let alive = false;

    const step = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const rootTop =
        root.getBoundingClientRect().top + scrollTop - root.clientTop;

      cards.forEach((card, i) => {
        const gap = card.offsetHeight + CARD_GAP;
        const naturalDocY = rootTop + naturals[i];
        const stuck = clamp((scrollTop + STICKY_TOP - naturalDocY) / gap, 0, 1);
        card.style.transform = `scale(${1 - stuck * 0.08})`;
        card.style.filter = `brightness(${1 - stuck * 0.28})`;
        card.style.zIndex = String(i + 1);
      });

      raf = requestAnimationFrame(step);
    };

    const start = () => {
      if (alive) return;
      alive = true;
      raf = requestAnimationFrame(step);
    };
    const stop = () => {
      if (!alive) return;
      alive = false;
      cancelAnimationFrame(raf);
    };

    const onResize = () => {
      naturals = measureNatural();
    };

    const obs = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) start();
        else stop();
      },
      { threshold: 0 }
    );
    obs.observe(root);
    window.addEventListener("resize", onResize);

    const fallback = window.setTimeout(start, 1200);

    return () => {
      window.clearTimeout(fallback);
      stop();
      obs.disconnect();
      window.removeEventListener("resize", onResize);
      cards.forEach(card => {
        card.style.transform = "";
        card.style.filter = "";
        card.style.zIndex = "";
      });
    };
  }, []);

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-2xl">
      {FEATURES.map(({ key, icon: Icon }, i) => (
        <article
          key={key}
          ref={el => {
            cardRefs.current[i] = el;
          }}
          className={cn(
            "mb-4 flex min-h-[148px] flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-[0_-8px_28px_rgba(15,23,42,0.08)] sm:min-h-[160px] sm:p-6",
            "will-change-transform"
          )}
          style={{
            position: "sticky",
            top: STICKY_TOP,
          }}
        >
          <div>
            <Icon className="mb-3 h-5 w-5 text-primary" aria-hidden />
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              {t(`${key}.title`)}
            </h3>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t(`${key}.desc`)}
          </p>
        </article>
      ))}
    </div>
  );
}

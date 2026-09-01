"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef } from "react";

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Texto que se preenche no scroll — adaptado de Não Codei (j04). */
export function LandingScrollPaintText() {
  const t = useTranslations("LandingPage.story");
  const rootRef = useRef<HTMLElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const text = t("text");
  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean), [text]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const spans = wordRefs.current.filter(Boolean) as HTMLSpanElement[];
    if (!spans.length) return;

    if (reduce) {
      spans.forEach(span => {
        span.style.opacity = "1";
        span.style.color = "var(--foreground)";
      });
      return;
    }

    let raf = 0;
    let alive = false;

    const step = () => {
      const rect = root.getBoundingClientRect();
      const viewH = window.innerHeight || 800;
      const progress = clamp((viewH - rect.top) / (viewH + rect.height), 0, 1);
      const cursor = progress * (spans.length + 6) - 3;

      spans.forEach((span, i) => {
        const d = clamp((cursor - i) / 3, 0, 1);
        span.style.opacity = (0.18 + d * 0.82).toFixed(3);
        span.style.color = "var(--foreground)";
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

    const obs = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) start();
        else stop();
      },
      { threshold: 0 }
    );
    obs.observe(root);

    const fallback = window.setTimeout(start, 1200);

    return () => {
      window.clearTimeout(fallback);
      stop();
      obs.disconnect();
    };
  }, [words]);

  return (
    <section
      ref={rootRef}
      id="historia"
      className="scroll-mt-24 border-t border-border px-5 py-0 sm:px-6"
      aria-label={t("aria")}
    >
      <div className="relative mx-auto max-w-2xl">
        <div className="sticky top-0 z-[1] flex min-h-[55vh] items-center py-14 sm:min-h-[60vh] sm:py-16">
          <p className="text-center text-2xl font-semibold leading-snug tracking-tight sm:text-3xl lg:text-[2.15rem]">
            {words.map((word, i) => (
              <span
                key={`${word}-${i}`}
                ref={el => {
                  wordRefs.current[i] = el;
                }}
                className="text-foreground opacity-[0.18] transition-[opacity] duration-300 ease-out"
              >
                {word}
                {i < words.length - 1 ? " " : ""}
              </span>
            ))}
          </p>
        </div>
        <div className="h-[70vh]" aria-hidden />
      </div>
    </section>
  );
}

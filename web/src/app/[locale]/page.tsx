// src/app/[locale]/page.tsx
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/navigation";

export default function LocalePage() {
  const t = useTranslations("Dashboard");
  const router = useRouter();

  // Redirecionar para o dashboard por padrão
  React.useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="p-10 bg-blue-500 text-white">
      <h1 className="text-4xl font-bold">TESTE DE VIDA</h1>
      <p>Se você está lendo isso, o i18n funcionou.</p>
      <p>Tradução teste: {t("header.title")}</p>
      <p>Redirecionando para o dashboard...</p>
    </div>
  );
}

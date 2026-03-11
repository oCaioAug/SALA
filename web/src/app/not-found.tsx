"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="pt">
      <body>
        <div style={{ padding: "40px", fontFamily: "system-ui, sans-serif" }}>
          <h1>404 - Página não encontrada</h1>
          <p>
            O sistema de internacionalização não encontrou o recurso solicitado.
          </p>
          <Link href="/" style={{ color: "blue", textDecoration: "underline" }}>
            Voltar para o início
          </Link>
        </div>
      </body>
    </html>
  );
}

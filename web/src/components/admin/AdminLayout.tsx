"use client";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminShell } from "@/components/admin/AdminShell";

export { AdminPageHeader } from "@/components/admin/AdminPageHeader";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

/**
 * Wrapper de conveniência para páginas fora do layout consolidado.
 * Preferir AdminPageHeader + conteúdo quando AdminShell já envolve a rota.
 */
export function AdminLayout({
  children,
  title,
  description,
  actions,
}: AdminLayoutProps) {
  return (
    <AdminShell>
      <AdminPageHeader
        title={title}
        description={description}
        actions={actions}
      />
      <div className="p-8">{children}</div>
    </AdminShell>
  );
}

export function AdminPageContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className ?? "p-8"}>{children}</div>;
}

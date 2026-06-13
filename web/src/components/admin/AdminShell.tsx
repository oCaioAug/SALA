"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SuperAdminRoute } from "@/components/auth/SuperAdminRoute";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <SuperAdminRoute>
      <div className="flex min-h-screen bg-background text-foreground">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </SuperAdminRoute>
  );
}

"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SuperAdminRoute } from "@/components/auth/SuperAdminRoute";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function AdminLayout({
  children,
  title,
  description,
}: AdminLayoutProps) {
  return (
    <SuperAdminRoute>
      <div className="flex min-h-screen bg-gray-950 text-gray-100">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">
          {(title || description) && (
            <header className="border-b border-white/5 px-8 py-6">
              {title && (
                <h1 className="text-2xl font-bold text-white">{title}</h1>
              )}
              {description && (
                <p className="mt-1 text-sm text-gray-400">{description}</p>
              )}
            </header>
          )}
          <MotionlessAdminContent>{children}</MotionlessAdminContent>
        </main>
      </div>
    </SuperAdminRoute>
  );
}

function MotionlessAdminContent({ children }: { children: React.ReactNode }) {
  return <div className="p-8">{children}</div>;
}

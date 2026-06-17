"use client";

import { AdminPageContent, AdminPageHeader } from "@/components/admin/AdminLayout";
import { AdminPlansSection } from "@/components/admin/AdminPlansSection";
import { useTranslations } from "next-intl";

export default function AdminPlansPage() {
  const t = useTranslations("Admin.plans");

  return (
    <>
      <AdminPageHeader title={t("title")} description={t("description")} />
      <AdminPageContent>
        <AdminPlansSection />
      </AdminPageContent>
    </>
  );
}

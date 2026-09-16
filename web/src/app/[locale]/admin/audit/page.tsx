"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import {
  AdminPageContent,
  AdminPageHeader,
} from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { ClipboardList } from "lucide-react";

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  actor: { id: string; name: string | null; email: string };
  organization: { id: string; name: string; slug: string } | null;
}

export default function AdminAuditPage() {
  const t = useTranslations("Admin.audit");
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (actionFilter) params.set("action", actionFilter);
      const res = await fetch(`/api/admin/audit-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data);
        setTotal(data.pagination?.total ?? data.data.length);
      }
    } finally {
      setLoading(false);
    }
  }, [actionFilter, page, pageSize]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <>
      <AdminPageHeader title={t("title")} description={t("description")} />
      <AdminPageContent>
        <AdminFilterBar
          className="mb-6"
          searchPlaceholder={t("searchPlaceholder")}
          searchValue={actionFilter}
          onSearchChange={value => {
            setActionFilter(value);
            setPage(1);
          }}
          actions={
            <Button
              type="button"
              onClick={fetchLogs}
              className="bg-primary hover:bg-primary"
            >
              {t("refresh")}
            </Button>
          }
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-12 w-12 text-muted-foreground" />}
            title={t("emptyTitle")}
            description={t("emptyDesc")}
          />
        ) : (
          <>
            <div className="space-y-3">
              {logs.map(log => (
                <Card key={log.id} className="border-border bg-card">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {log.action}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {log.entityType}
                          {log.entityId ? ` · ${log.entityId}` : ""}
                        </p>
                        {log.organization && (
                          <p className="text-xs text-primary dark:text-primary">
                            {log.organization.name}
                          </p>
                        )}
                      </div>
                      <MotionlessActorMeta log={log} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Pagination
              className="mt-6"
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={size => {
                setPageSize(size);
                setPage(1);
              }}
              pageSizeOptions={[15, 30, 50]}
            />
          </>
        )}
      </AdminPageContent>
    </>
  );
}

function MotionlessActorMeta({ log }: { log: AuditLogEntry }) {
  return (
    <div className="text-right text-sm text-muted-foreground">
      <p>{log.actor.name ?? log.actor.email}</p>
      <p className="text-xs">
        {new Date(log.createdAt).toLocaleString("pt-BR")}
      </p>
    </div>
  );
}

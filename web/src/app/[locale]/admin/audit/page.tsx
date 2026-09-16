"use client";

import { ClipboardList, Eye, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { AdminActionError } from "@/components/admin/AdminActionError";
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
import { useApiErrorMessage } from "@/lib/hooks/useApiErrorMessage";
import { getIntlLocale } from "@/lib/utils";

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
  actor: { id: string; name: string | null; email: string };
  organization: { id: string; name: string; slug: string } | null;
}

interface OrganizationOption {
  id: string;
  name: string;
}

export default function AdminAuditPage() {
  const t = useTranslations("Admin.audit");
  const locale = useLocale();
  const intlLocale = getIntlLocale(locale);
  const { fromResponse } = useApiErrorMessage();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    const loadOrganizations = async () => {
      const all: OrganizationOption[] = [];
      let orgPage = 1;
      let totalPages = 1;
      try {
        do {
          const res = await fetch(
            `/api/admin/organizations?page=${orgPage}&pageSize=100`
          );
          if (!res.ok) break;
          const json = await res.json();
          const batch = (json.data as OrganizationOption[]).map(o => ({
            id: o.id,
            name: o.name,
          }));
          all.push(...batch);
          totalPages = json.pagination?.totalPages ?? 1;
          orgPage += 1;
        } while (orgPage <= totalPages);
        setOrganizations(all);
      } catch {
        setOrganizations([]);
      }
    };

    void loadOrganizations();
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (actionFilter) params.set("action", actionFilter);
      if (organizationFilter) params.set("organizationId", organizationFilter);
      const res = await fetch(`/api/admin/audit-logs?${params}`);
      if (!res.ok) {
        setLogs([]);
        setTotal(0);
        setActionError(await fromResponse(res));
        return;
      }
      const data = await res.json();
      setLogs(data.data);
      setTotal(data.pagination?.total ?? data.data.length);
    } catch {
      setLogs([]);
      setTotal(0);
      setActionError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [actionFilter, organizationFilter, page, pageSize, fromResponse, t]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!selectedLog) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedLog(null);
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [selectedLog]);

  return (
    <>
      <AdminPageHeader title={t("title")} description={t("description")} />
      <AdminPageContent>
        <AdminActionError
          message={actionError}
          onDismiss={() => setActionError(null)}
        />

        <AdminFilterBar
          className="mb-6"
          searchPlaceholder={t("searchPlaceholder")}
          searchValue={actionFilter}
          onSearchChange={value => {
            setActionFilter(value);
            setPage(1);
          }}
          filters={[
            {
              id: "organization",
              label: t("organizationFilter"),
              value: organizationFilter,
              onChange: value => {
                setOrganizationFilter(value);
                setPage(1);
              },
              allLabel: t("allOrganizations"),
              options: organizations.map(org => ({
                value: org.id,
                label: org.name,
              })),
            },
          ]}
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
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
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
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{log.actor.name ?? log.actor.email}</p>
                        <p className="text-xs">
                          {new Date(log.createdAt).toLocaleString(intlLocale)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="mr-1.5 h-4 w-4" />
                        {t("viewDetails")}
                      </Button>
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

      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label={t("closeModal")}
            onClick={() => setSelectedLog(null)}
          />
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="flex items-start justify-between border-b border-border px-6 py-5">
              <div className="min-w-0 pr-4">
                <p className="text-lg font-bold text-foreground">
                  {t("detailTitle")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedLog.action}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-6 text-sm">
              <DetailRow
                label={t("actor")}
                value={selectedLog.actor.name ?? selectedLog.actor.email}
              />
              <DetailRow
                label={t("organization")}
                value={selectedLog.organization?.name ?? "—"}
              />
              <DetailRow label={t("entityType")} value={selectedLog.entityType} />
              <DetailRow
                label={t("entityId")}
                value={selectedLog.entityId ?? "—"}
              />
              <DetailRow
                label={t("createdAt")}
                value={new Date(selectedLog.createdAt).toLocaleString(
                  intlLocale
                )}
              />
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  {t("metadata")}
                </p>
                <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 text-xs text-foreground">
                  {selectedLog.metadata == null
                    ? "—"
                    : JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            </div>
            <div className="border-t border-border p-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setSelectedLog(null)}
              >
                {t("closeModal")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-0.5 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="break-all text-foreground">{value}</p>
    </div>
  );
}

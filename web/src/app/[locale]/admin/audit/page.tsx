"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

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

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set("action", actionFilter);
      const res = await fetch(`/api/admin/audit-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data);
      }
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <AdminLayout title={t("title")} description={t("description")}>
      <MotionlessFilterBar
        value={actionFilter}
        onChange={setActionFilter}
        onRefresh={fetchLogs}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : logs.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum registro encontrado</p>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <Card key={log.id} className="border-white/10 bg-white/5">
              <CardContent className="p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-white">{log.action}</p>
                    <p className="text-sm text-gray-400">
                      {log.entityType}
                      {log.entityId ? ` · ${log.entityId}` : ""}
                    </p>
                    {log.organization && (
                      <p className="text-xs text-violet-300">
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
      )}
    </AdminLayout>
  );
}

function MotionlessFilterBar({
  value,
  onChange,
  onRefresh,
}: {
  value: string;
  onChange: (v: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <input
        type="text"
        placeholder="Filtrar por ação..."
        value={value}
        onChange={e => onChange(e.target.value)}
        className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-gray-500"
      />
      <button
        type="button"
        onClick={onRefresh}
        className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-500"
      >
        Atualizar
      </button>
    </div>
  );
}

function MotionlessActorMeta({ log }: { log: AuditLogEntry }) {
  return (
    <div className="text-right text-sm text-gray-500">
      <p>{log.actor.name ?? log.actor.email}</p>
      <p className="text-xs">
        {new Date(log.createdAt).toLocaleString("pt-BR")}
      </p>
    </div>
  );
}

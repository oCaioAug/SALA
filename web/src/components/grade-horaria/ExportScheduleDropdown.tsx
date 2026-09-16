"use client";

import {
  ChevronDown,
  Download,
  FileIcon,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ExportScheduleDropdownProps {
  onExportPDF: () => void;
  onExportXLSX: () => void;
  onExportCSV: () => void;
  disabled?: boolean;
  className?: string;
}

export const ExportScheduleDropdown: React.FC<ExportScheduleDropdownProps> = ({
  onExportPDF,
  onExportXLSX,
  onExportCSV,
  disabled = false,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => !disabled && setOpen(prev => !prev)}
        className="gap-2 font-medium shadow-sm bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        <Download className="h-4 w-4 text-primary" />
        <span>Exportar Grade</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-52 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
          <div className="p-1 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onExportPDF();
              }}
              className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <FileText className="h-4 w-4 text-red-500 shrink-0" />
              <div className="flex flex-col">
                <span className="font-medium">Exportar PDF</span>
                <span className="text-[11px] text-muted-foreground">Documento formatado</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onExportXLSX();
              }}
              className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="flex flex-col">
                <span className="font-medium">Exportar Excel (XLSX)</span>
                <span className="text-[11px] text-muted-foreground">Planilha editável</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onExportCSV();
              }}
              className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <FileIcon className="h-4 w-4 text-blue-500 shrink-0" />
              <div className="flex flex-col">
                <span className="font-medium">Exportar CSV</span>
                <span className="text-[11px] text-muted-foreground">Dados tabulares leves</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

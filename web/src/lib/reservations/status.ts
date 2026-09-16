export function getReservationStatusStyle(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-500/15 text-amber-900 ring-amber-500/25 dark:text-amber-200";
    case "APPROVED":
      return "bg-emerald-500/15 text-emerald-800 ring-emerald-500/25 dark:text-emerald-300";
    case "ACTIVE":
      return "bg-blue-500/15 text-blue-800 ring-blue-500/25 dark:text-blue-300";
    case "CANCELLED":
      return "bg-rose-500/15 text-rose-800 ring-rose-500/25 dark:text-rose-300";
    case "REJECTED":
      return "bg-rose-500/15 text-rose-800 ring-rose-500/25 dark:text-rose-300";
    case "COMPLETED":
      return "bg-slate-500/15 text-slate-700 ring-slate-500/20 dark:text-slate-300";
    default:
      return "bg-slate-500/15 text-slate-700 ring-slate-500/20 dark:text-slate-300";
  }
}

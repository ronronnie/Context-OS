import { FileText } from "lucide-react";

export function SourceChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-white px-2 py-1 text-xs font-medium text-[var(--muted-strong)]">
      <FileText className="h-3.5 w-3.5 text-[var(--blue)]" aria-hidden />
      {label}
    </span>
  );
}

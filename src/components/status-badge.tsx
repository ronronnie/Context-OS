import { cn } from "@/lib/utils";
import type { MemoryStatus } from "@/types/app";

const labels: Record<MemoryStatus, string> = {
  current: "Current",
  active: "Active",
  verified: "Verified",
  needs_review: "Needs review",
  draft: "Draft",
  proposed: "Proposed",
  superseded: "Superseded",
  exported: "Exported",
  planned: "Planned",
  deprecated: "Deprecated",
  archived: "Archived",
  outdated: "Outdated",
  rejected: "Rejected",
};

const styles: Record<MemoryStatus, string> = {
  current: "border-[#bfdbfe] bg-[#dbeafe] text-[#1e40af]",
  active: "border-[#bbf7d0] bg-[#dcfce7] text-[#166534]",
  verified: "border-[#bbf7d0] bg-[#dcfce7] text-[#166534]",
  needs_review: "border-[#fde68a] bg-[#fef3c7] text-[#92400e]",
  draft: "border-[var(--border)] bg-white text-[var(--muted-strong)]",
  proposed: "border-[#fde68a] bg-[#fef3c7] text-[#92400e]",
  superseded: "border-[#fecaca] bg-[#fee2e2] text-[#991b1b]",
  exported: "border-[#99f6e4] bg-[#ccfbf1] text-[#134e4a]",
  planned: "border-[#bfdbfe] bg-[#dbeafe] text-[#1e40af]",
  deprecated: "border-[#fecaca] bg-[#fee2e2] text-[#991b1b]",
  archived: "border-[var(--border)] bg-white text-[var(--muted-strong)]",
  outdated: "border-[var(--border)] bg-white text-[var(--muted-strong)]",
  rejected: "border-[#fecaca] bg-[#fee2e2] text-[#991b1b]",
};

export function StatusBadge({
  status,
  className,
}: {
  status: MemoryStatus;
  className?: string;
}) {
  return (
    <span
      aria-label={`Status: ${labels[status]}`}
      className={cn(
        "inline-flex min-h-6 items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        styles[status],
        className,
      )}
    >
      {labels[status]}
    </span>
  );
}

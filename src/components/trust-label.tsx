import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  Verified: "border-[#bbf7d0] bg-[#dcfce7] text-[#166534]",
  Proposed: "border-[#fde68a] bg-[#fef3c7] text-[#92400e]",
  Outdated: "border-[var(--border)] bg-white text-[var(--muted-strong)]",
  Rejected: "border-[#fecaca] bg-[#fee2e2] text-[#991b1b]",
  Canonical: "border-[#99f6e4] bg-[#ccfbf1] text-[#134e4a]",
  Unverified: "border-[var(--border)] bg-white text-[var(--muted-strong)]",
};

export function TrustLabel({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        styles[label] ?? styles.Unverified,
        className,
      )}
    >
      {label}
    </span>
  );
}

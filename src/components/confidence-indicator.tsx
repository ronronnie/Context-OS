import { cn } from "@/lib/utils";

export function ConfidenceIndicator({
  label,
  value,
  tone = "teal",
}: {
  label: string;
  value: number;
  tone?: "teal" | "blue" | "amber";
}) {
  const barColor = {
    teal: "bg-[var(--accent)]",
    blue: "bg-[var(--blue)]",
    amber: "bg-[var(--amber)]",
  }[tone];

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-[var(--panel-subtle)]">
        <div
          className={cn("h-2 rounded-full", barColor)}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

import { StatusBadge } from "@/components/status-badge";
import type { MemoryStatus } from "@/types/app";

export function TimelineRow({
  title,
  description,
  time,
  status,
}: {
  title: string;
  description: string;
  time: string;
  status: MemoryStatus;
}) {
  return (
    <div className="grid gap-3 border-b border-[var(--border)] p-4 last:border-b-0 md:grid-cols-[120px_1fr_120px]">
      <time className="text-sm text-[var(--muted)]">{time}</time>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p>
      </div>
      <div className="md:text-right">
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

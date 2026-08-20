import { GitBranch } from "lucide-react";

export function RelationshipChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[#99f6e4] bg-[#ccfbf1] px-2 py-1 text-xs font-medium text-[#134e4a]">
      <GitBranch className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}

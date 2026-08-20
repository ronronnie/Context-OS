import { MoreHorizontal } from "lucide-react";

export function ActionMenu({ label = "Actions" }: { label?: string }) {
  return (
    <details className="relative inline-block">
      <summary className="flex h-8 cursor-pointer list-none items-center gap-2 rounded-md border border-[var(--border)] bg-white px-2 text-sm font-medium marker:hidden">
        <MoreHorizontal className="h-4 w-4" aria-hidden />
        <span className="sr-only">{label}</span>
      </summary>
      <div className="absolute right-0 z-10 mt-2 w-40 rounded-md border border-[var(--border)] bg-white p-1 shadow-lg">
        {["Open", "Review", "Archive"].map((item) => (
          <button
            key={item}
            className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-[var(--panel-subtle)]"
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
    </details>
  );
}

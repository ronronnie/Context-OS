import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

type PageHeaderAction = {
  label: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions = [],
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: PageHeaderAction[];
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-medium text-[var(--accent-strong)]">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#171717] sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          {description}
        </p>
      </div>
      {actions.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {actions.map((action, index) => (
            <Button key={action.label} variant={index === 0 ? "default" : "secondary"}>
              {index === 0 ? <Plus className="h-4 w-4" aria-hidden /> : null}
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </header>
  );
}

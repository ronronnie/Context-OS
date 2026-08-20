import { Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  actionLabel,
}: {
  title: string;
  description: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-md border border-dashed border-[var(--border-strong)] bg-[var(--panel)] p-6 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-[var(--panel-subtle)] text-[var(--muted-strong)]">
        <Inbox className="h-5 w-5" aria-hidden />
      </div>
      <h2 className="mt-3 text-base font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
      {actionLabel ? (
        <div className="mt-4">
          <Button variant="secondary">{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}

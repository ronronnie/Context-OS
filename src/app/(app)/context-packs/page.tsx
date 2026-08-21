import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { getContextPacksForUser } from "@/db/queries";
import { requireUser } from "@/lib/auth/session";
import { contextPackRoute } from "@/lib/routes";

export default async function ContextPacksPage() {
  const user = await requireUser();
  const packs = await getContextPacksForUser(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Context Packs"
        title="Generated AI context"
        description="Versioned task outputs compiled from source-backed Product Memory."
        actions={[]}
      />

      <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
        <SectionHeader
          title="Pack history"
          description="Regeneration creates a new version and preserves older outputs."
        />
        {packs.length ? (
          <div className="divide-y divide-[var(--border)]">
            {packs.map((row) => (
              <Link
                className="block p-4 transition hover:bg-[var(--panel-subtle)]"
                href={contextPackRoute(row.pack.productId, row.pack.id)}
                key={row.pack.id}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <PackStatusBadge />
                  <span className="text-xs text-[var(--muted)]">
                    v{row.pack.version}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {row.product.name}
                  </span>
                  {row.feature ? (
                    <span className="text-xs text-[var(--muted)]">
                      {row.feature.name}
                    </span>
                  ) : null}
                  <span className="text-xs text-[var(--muted)]">
                    {row.pack.createdAt.toLocaleString()}
                  </span>
                </div>
                <h2 className="mt-2 text-sm font-semibold">{row.task.title}</h2>
                <p className="mt-1 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
                  {row.task.description}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-4">
            <EmptyState
              title="No Context Packs yet"
              description="Create a task to generate the first Context Pack."
            />
          </div>
        )}
      </section>
    </div>
  );
}

function PackStatusBadge() {
  return (
    <span className="inline-flex min-h-6 items-center rounded-md border border-[#99f6e4] bg-[#ccfbf1] px-2 py-0.5 text-xs font-medium text-[#134e4a]">
      packed
    </span>
  );
}

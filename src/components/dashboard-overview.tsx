import { ArrowRight, Database, FileCheck2, Sparkles } from "lucide-react";
import Link from "next/link";

import { ConfidenceIndicator } from "@/components/confidence-indicator";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import { PRODUCT_PROMISE } from "@/config/product";
import type { getDashboardWorkspace } from "@/db/queries";
import { contextPackRoute, productRoute, sourceRoute } from "@/lib/routes";

export function DashboardOverview({
  workspace,
}: {
  workspace: Awaited<ReturnType<typeof getDashboardWorkspace>>;
}) {
  const stats = [
    { label: "Modules", value: workspace.stats.modules, detail: "Mapped product areas" },
    { label: "Features", value: workspace.stats.features, detail: "Feature-aware memory targets" },
    { label: "Verified memory", value: workspace.stats.verifiedKnowledge, detail: "Trusted retrieval surface" },
    { label: "Unresolved conflicts", value: workspace.stats.unresolvedConflicts, detail: "Needs human resolution" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Product Memory control center"
        description={PRODUCT_PROMISE}
        actions={[]}
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-md border border-[var(--border)] bg-[var(--panel)] p-4"
          >
            <p className="text-sm font-medium text-[var(--muted)]">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{stat.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentList
            empty="No source evidence has been added yet."
            items={workspace.recentSources.map((source) => ({
              href: sourceRoute(source.productId, source.id),
              title: source.name,
              detail: source.sourceType.replaceAll("_", " "),
              meta: source.createdAt.toLocaleDateString(),
            }))}
            title="Recent sources"
          />
          <RecentList
            empty="No tasks have been created yet."
            items={workspace.recentTasks.map((task) => ({
              href: "/tasks",
              title: task.title,
              detail: task.status,
              meta: task.updatedAt.toLocaleDateString(),
            }))}
            title="Recent tasks"
          />
          <RecentList
            empty="No Context Packs have been generated yet."
            items={workspace.recentContextPacks.map((row) => ({
              href: contextPackRoute(row.pack.productId, row.pack.id),
              title: row.task.title,
              detail: `v${row.pack.version}`,
              meta: row.pack.createdAt.toLocaleDateString(),
            }))}
            title="Recent Context Packs"
          />
          <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
            <SectionHeader
              title="Suggested next actions"
              description="Work from unresolved memory and active product context."
            />
            <div className="space-y-3 p-4">
              {workspace.suggestedNextActions.map((action) => (
                <div
                  className="rounded-md border border-[var(--border)] bg-white p-3 text-sm font-medium"
                  key={action}
                >
                  {action}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <div className="rounded-md border border-[var(--border)] bg-[var(--panel)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--muted)]">Current product</p>
                <h2 className="mt-1 text-lg font-semibold">
                  {workspace.selectedProduct?.name ?? "No product selected"}
                </h2>
              </div>
              <StatusBadge status={workspace.selectedProduct ? "current" : "draft"} />
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {workspace.selectedProduct?.description ?? "Create a product to start mapping Product Memory."}
            </p>
            {workspace.selectedProduct ? (
              <Link
                href={productRoute(workspace.selectedProduct.id)}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent-strong)]"
              >
                Open product detail
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : null}
          </div>

          <div className="rounded-md border border-[var(--border)] bg-[var(--panel)] p-4">
            <div className="mb-4 flex items-center gap-2">
              <Database className="h-4 w-4 text-[var(--accent)]" aria-hidden />
              <h2 className="font-semibold">Memory health</h2>
            </div>
            <div className="space-y-4">
              <ConfidenceIndicator
                label="Verified memory"
                value={Math.min(100, workspace.stats.verifiedKnowledge * 2)}
              />
              <ConfidenceIndicator
                label="Feature coverage"
                value={workspace.stats.features ? Math.min(100, workspace.stats.features * 6) : 0}
                tone="blue"
              />
              <ConfidenceIndicator
                label="Conflict risk"
                value={Math.min(100, workspace.stats.unresolvedConflicts * 20)}
                tone="amber"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-[var(--border)] bg-[var(--panel)] p-4">
              <FileCheck2 className="h-4 w-4 text-[var(--blue)]" aria-hidden />
              <p className="mt-3 text-sm font-medium">Verify AI drafts</p>
            </div>
            <div className="rounded-md border border-[var(--border)] bg-[var(--panel)] p-4">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" aria-hidden />
              <p className="mt-3 text-sm font-medium">Generate Context Pack</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function RecentList({
  title,
  items,
  empty,
}: {
  title: string;
  items: Array<{ href: string; title: string; detail: string; meta: string }>;
  empty: string;
}) {
  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
      <SectionHeader title={title} />
      {items.length ? (
        <div className="divide-y divide-[var(--border)]">
          {items.map((item) => (
            <Link className="block p-4 hover:bg-white" href={item.href} key={`${item.title}-${item.meta}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">{item.title}</h2>
                <span className="text-xs text-[var(--muted)]">{item.meta}</span>
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">{item.detail}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-4">
          <EmptyState title={title} description={empty} />
        </div>
      )}
    </section>
  );
}

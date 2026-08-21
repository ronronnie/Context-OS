import Link from "next/link";
import { notFound } from "next/navigation";

import { regenerateContextPackAction } from "@/app/actions/context-packs";
import { ContextPackExportPanel } from "@/components/context-pack-export-panel";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { SourceChip } from "@/components/source-chip";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { getContextPackDetail } from "@/db/queries";
import { requireUser } from "@/lib/auth/session";
import { taskIntentOptions } from "@/lib/context-packs/forms";
import { productRoute } from "@/lib/routes";

export default async function ContextPackDetailPage({
  params,
}: {
  params: Promise<{ productId: string; contextPackId: string }>;
}) {
  const user = await requireUser();
  const { productId, contextPackId } = await params;
  const detail = await getContextPackDetail(productId, contextPackId, user.id);

  if (!detail) {
    notFound();
  }

  const regenerate = regenerateContextPackAction.bind(
    null,
    productId,
    detail.task.id,
  );
  const metadata = detail.pack.metadata as {
    taskIntent?: string;
    moduleName?: string | null;
    featureName?: string | null;
  };
  const evidenceByKnowledgeId = detail.evidence.reduce((map, row) => {
    const list = map.get(row.knowledgeItemId) ?? [];
    list.push(row.source);
    map.set(row.knowledgeItemId, list);
    return map;
  }, new Map<string, Array<(typeof detail.evidence)[number]["source"]>>());
  const exportData = {
    pack: {
      id: detail.pack.id,
      version: detail.pack.version,
      generatedContent: detail.pack.generatedContent,
    },
    task: {
      title: detail.task.title,
      description: detail.task.description,
      status: detail.task.status,
    },
    product: {
      name: detail.product.name,
      description: detail.product.description,
    },
    module: detail.module
      ? {
          name: detail.module.name,
          description: detail.module.description,
        }
      : null,
    feature: detail.feature
      ? {
          name: detail.feature.name,
          description: detail.feature.description,
        }
      : null,
    items: detail.items.map((row) => ({
      title: row.knowledgeItem.title,
      body: row.knowledgeItem.body,
      knowledgeType: row.knowledgeItem.knowledgeType,
      authority: row.knowledgeItem.authority,
      confidence: row.knowledgeItem.confidence,
      lifecycleStatus: row.knowledgeItem.lifecycleStatus,
      relevanceScore: row.item.relevanceScore,
      reasonForInclusion: row.item.reasonForInclusion,
      evidence: (evidenceByKnowledgeId.get(row.knowledgeItem.id) ?? []).map(
        (source) => ({
          name: source.name,
          sourceType: source.sourceType,
          url: source.url,
        }),
      ),
    })),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Context Pack v${detail.pack.version}`}
        title={detail.task.title}
        description={detail.task.description}
        actions={[]}
      />

      <nav className="text-sm text-[var(--muted)]" aria-label="Breadcrumb">
        <Link className="font-medium text-[var(--accent-strong)]" href={productRoute(productId)}>
          {detail.product.name}
        </Link>{" "}
        / Context Pack
      </nav>

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
            <SectionHeader title="Pack metadata" />
            <dl className="grid gap-3 p-4 text-sm">
              <Meta label="Product" value={detail.product.name} />
              <Meta label="Module" value={detail.module?.name ?? metadata.moduleName ?? "Not specified"} />
              <Meta label="Feature" value={detail.feature?.name ?? metadata.featureName ?? "Not specified"} />
              <Meta label="Task status" value={detail.task.status} />
              <Meta label="Version" value={`v${detail.pack.version}`} />
              <Meta label="Generated" value={detail.pack.createdAt.toLocaleString()} />
              <Meta label="Included items" value={String(detail.items.length)} />
            </dl>
          </section>

          <form
            action={regenerate}
            className="rounded-md border border-[var(--border)] bg-[var(--panel)]"
          >
            <SectionHeader
              title="Regenerate"
              description="Create a new historical output after Product Memory changes."
            />
            <div className="space-y-4 p-4">
              <label className="block">
                <span className="text-sm font-medium">Task intent</span>
                <select
                  className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                  defaultValue={metadata.taskIntent ?? "design"}
                  name="taskIntent"
                >
                  {taskIntentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="submit">Regenerate pack</Button>
            </div>
          </form>

          <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
            <SectionHeader title="Included Product Memory" />
            {detail.items.length ? (
              <div className="divide-y divide-[var(--border)]">
                {detail.items.map((row) => (
                  <article className="p-4" key={row.item.knowledgeItemId}>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={row.knowledgeItem.lifecycleStatus} />
                      <span className="text-xs text-[var(--muted)]">
                        {row.item.relevanceScore ?? 0}% relevance
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {row.knowledgeItem.authority} authority
                      </span>
                    </div>
                    <h2 className="mt-2 text-sm font-semibold">
                      {row.knowledgeItem.title}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      {row.item.reasonForInclusion}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="p-4">
                <EmptyState
                  title="No included memory"
                  description="This pack was generated without linked memory items."
                />
              </div>
            )}
          </section>

          <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
            <SectionHeader title="Source evidence" />
            {detail.evidence.length ? (
              <div className="flex flex-wrap gap-2 p-4">
                {detail.evidence.map((row) => (
                  <SourceChip key={`${row.knowledgeItemId}-${row.source.id}`} label={row.source.name} />
                ))}
              </div>
            ) : (
              <div className="p-4">
                <EmptyState
                  title="No source evidence"
                  description="No linked evidence was retrieved for this pack."
                />
              </div>
            )}
          </section>
        </div>

        <ContextPackExportPanel data={exportData} />
      </section>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 text-[var(--muted-strong)]">{value}</dd>
    </div>
  );
}

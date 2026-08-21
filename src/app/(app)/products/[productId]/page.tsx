import Link from "next/link";
import { notFound } from "next/navigation";

import {
  createModuleAction,
  updateProductAction,
} from "@/app/actions/product-architecture";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RelationshipChip } from "@/components/relationship-chip";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  getModulesWithFeatureCounts,
  getProductGraphSummary,
  getProductSummary,
} from "@/db/queries";
import { requireUser } from "@/lib/auth/session";
import { formatRelationshipType } from "@/lib/product-graph/relationships";
import { moduleRoute } from "@/lib/routes";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const user = await requireUser();
  const { productId } = await params;
  const [summary, productModules, graphSummary] = await Promise.all([
    getProductSummary(productId, user.id),
    getModulesWithFeatureCounts(productId, user.id),
    getProductGraphSummary(productId, user.id),
  ]);

  if (!summary) {
    notFound();
  }

  const updateProduct = updateProductAction.bind(null, productId);
  const createModule = createModuleAction.bind(null, productId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Product"
        title={summary.product.name}
        description={summary.product.description || "No product description yet."}
        actions={[]}
      />

      <section className="grid gap-3 md:grid-cols-4">
        {[
          ["Modules", summary.counts.modules],
          ["Features", summary.counts.features],
          ["Knowledge", summary.counts.knowledge],
          ["Context Packs", summary.counts.contextPacks],
        ].map(([label, value]) => (
          <div
            className="rounded-md border border-[var(--border)] bg-[var(--panel)] p-4"
            key={label}
          >
            <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
        <SectionHeader
          title="Product Graph"
          description="A structured map of feature, component, decision, constraint, source, and memory relationships."
        />
        <div className="grid gap-4 p-4 lg:grid-cols-4">
          <GraphMetric label="Feature edges" value={graphSummary.featureRelationships.length} />
          <GraphMetric label="Knowledge edges" value={graphSummary.knowledgeRelationships.length} />
          <GraphMetric label="Constraints" value={graphSummary.buckets.constraints} />
          <GraphMetric label="Components" value={graphSummary.buckets.components} />
        </div>
        <div className="grid gap-6 border-t border-[var(--border)] p-4 xl:grid-cols-2">
          <GraphEdges
            empty="No feature relationships have been mapped yet."
            featureById={new Map(graphSummary.features.map((feature) => [feature.id, feature]))}
            relationships={graphSummary.featureRelationships}
            title="Feature relationships"
          />
          <KnowledgeEdges
            empty="No knowledge relationships have been mapped yet."
            knowledgeById={new Map(graphSummary.knowledge.map((item) => [item.id, item]))}
            relationships={graphSummary.knowledgeRelationships}
            title="Knowledge relationships"
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <form
            action={updateProduct}
            className="rounded-md border border-[var(--border)] bg-[var(--panel)]"
          >
            <SectionHeader
              title="Edit product"
              description="Keep product naming and scope clear for retrieval."
            />
            <div className="space-y-4 p-4">
              <label className="block">
                <span className="text-sm font-medium">Name</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                  defaultValue={summary.product.name}
                  name="name"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Description</span>
                <textarea
                  className="mt-1 min-h-24 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                  defaultValue={summary.product.description}
                  name="description"
                />
              </label>
              <Button type="submit">Save product</Button>
            </div>
          </form>

          <form
            action={createModule}
            className="rounded-md border border-[var(--border)] bg-[var(--panel)]"
          >
            <SectionHeader
              title="Create module"
              description="Modules make Product Memory feature-aware."
            />
            <div className="space-y-4 p-4">
              <label className="block">
                <span className="text-sm font-medium">Name</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                  name="name"
                  required
                  placeholder="Progress Reporting"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Description</span>
                <textarea
                  className="mt-1 min-h-20 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                  name="description"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Position</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                  defaultValue={productModules.length + 1}
                  min={0}
                  name="position"
                  type="number"
                />
              </label>
              <Button type="submit">Create module</Button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
            <SectionHeader
              title="Modules"
              description="Open a module to manage its ordered features."
            />
            {productModules.length ? (
              <div className="divide-y divide-[var(--border)]">
                {productModules.map((module) => (
                  <Link
                    className="grid gap-3 p-4 transition hover:bg-[var(--panel-subtle)] md:grid-cols-[48px_1fr_160px]"
                    href={moduleRoute(productId, module.id)}
                    key={module.id}
                  >
                    <span className="text-sm text-[var(--muted)]">
                      #{module.position}
                    </span>
                    <div>
                      <h2 className="font-medium">{module.name}</h2>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                        {module.description || "No module description yet."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status="active" />
                      <span className="text-xs text-[var(--muted)]">
                        {module.featureCount} features
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {module.knowledgeCount} memories
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4">
                <EmptyState
                  title="No modules mapped"
                  description="Create the first module so features and knowledge have a durable product location."
                />
              </div>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <RecentPanel
              empty="No knowledge has been attached to this product yet."
              items={summary.recentKnowledge.map((item) => ({
                id: item.id,
                title: item.title,
                description: item.body,
              }))}
              title="Recent knowledge"
            />
            <RecentPanel
              empty="No Context Packs have been generated for this product yet."
              items={summary.recentContextPacks.map((pack) => ({
                id: pack.id,
                title: pack.taskTitle,
                description: pack.generatedContent,
              }))}
              title="Recent Context Packs"
            />
          </section>
        </div>
      </section>
    </div>
  );
}

function GraphMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-white p-3">
      <p className="text-xs font-medium uppercase tracking-normal text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function GraphEdges({
  title,
  relationships,
  featureById,
  empty,
}: {
  title: string;
  relationships: Array<{
    id: string;
    fromFeatureId: string;
    toFeatureId: string;
    relationshipType: string;
    reason: string;
  }>;
  featureById: Map<string, { name: string }>;
  empty: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      {relationships.length ? (
        <div className="mt-3 space-y-3">
          {relationships.map((relationship) => (
            <article
              className="rounded-md border border-[var(--border)] bg-white p-3"
              key={relationship.id}
            >
              <RelationshipChip label={formatRelationshipType(relationship.relationshipType)} />
              <p className="mt-2 text-sm font-medium">
                {featureById.get(relationship.fromFeatureId)?.name ??
                  relationship.fromFeatureId}{" "}
                {"->"}{" "}
                {featureById.get(relationship.toFeatureId)?.name ??
                  relationship.toFeatureId}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                {relationship.reason || "No reason recorded."}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{empty}</p>
      )}
    </div>
  );
}

function KnowledgeEdges({
  title,
  relationships,
  knowledgeById,
  empty,
}: {
  title: string;
  relationships: Array<{
    id: string;
    fromKnowledgeId: string;
    toKnowledgeId: string;
    relationshipType: string;
    reason: string;
  }>;
  knowledgeById: Map<string, { title: string }>;
  empty: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      {relationships.length ? (
        <div className="mt-3 space-y-3">
          {relationships.map((relationship) => (
            <article
              className="rounded-md border border-[var(--border)] bg-white p-3"
              key={relationship.id}
            >
              <RelationshipChip label={formatRelationshipType(relationship.relationshipType)} />
              <p className="mt-2 text-sm font-medium">
                {knowledgeById.get(relationship.fromKnowledgeId)?.title ??
                  relationship.fromKnowledgeId}{" "}
                {"->"}{" "}
                {knowledgeById.get(relationship.toKnowledgeId)?.title ??
                  relationship.toKnowledgeId}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                {relationship.reason || "No reason recorded."}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{empty}</p>
      )}
    </div>
  );
}

function RecentPanel({
  title,
  items,
  empty,
}: {
  title: string;
  items: Array<{ id: string; title: string; description: string }>;
  empty: string;
}) {
  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
      <SectionHeader title={title} />
      {items.length ? (
        <div className="divide-y divide-[var(--border)]">
          {items.map((item) => (
            <div className="p-4" key={item.id}>
              <h3 className="text-sm font-medium">{item.title}</h3>
              <p className="mt-1 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="p-4 text-sm leading-6 text-[var(--muted)]">{empty}</p>
      )}
    </section>
  );
}

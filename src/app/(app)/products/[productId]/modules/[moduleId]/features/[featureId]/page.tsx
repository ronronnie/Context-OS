import Link from "next/link";
import { notFound } from "next/navigation";

import {
  createFeatureRelationshipAction,
  removeFeatureRelationshipAction,
} from "@/app/actions/product-graph";
import { updateFeatureAction } from "@/app/actions/product-architecture";
import { createFeatureKnowledgeAction } from "@/app/actions/feature-memory";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RelationshipChip } from "@/components/relationship-chip";
import { SectionHeader } from "@/components/section-header";
import { SourceChip } from "@/components/source-chip";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { getFeatureWorkspace } from "@/db/queries";
import { requireUser } from "@/lib/auth/session";
import {
  authorityOptions,
  getKnowledgeTypeLabel,
  groupKnowledgeItemsByType,
  knowledgeTypeOptions,
  lifecycleStatusOptions,
  type KnowledgeType,
} from "@/lib/product-memory/knowledge-model";
import {
  featureRelationshipOptions,
  formatRelationshipType,
  getGraphBucketForKnowledgeType,
} from "@/lib/product-graph/relationships";
import {
  knowledgeRoute,
  moduleRoute,
  productRoute,
  sourceRoute,
} from "@/lib/routes";

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ productId: string; moduleId: string; featureId: string }>;
}) {
  const user = await requireUser();
  const { productId, moduleId, featureId } = await params;
  const workspace = await getFeatureWorkspace(featureId, productId, user.id);

  if (!workspace || workspace.module.id !== moduleId) {
    notFound();
  }

  const updateFeature = updateFeatureAction.bind(
    null,
    productId,
    moduleId,
    featureId,
  );
  const createKnowledge = createFeatureKnowledgeAction.bind(
    null,
    productId,
    moduleId,
    featureId,
  );
  const createRelationship = createFeatureRelationshipAction.bind(
    null,
    productId,
    moduleId,
    featureId,
  );
  const knowledgeByType = groupKnowledgeItemsByType(workspace.knowledge);
  const relationshipFeatureById = new Map(
    workspace.productFeatures.map((feature) => [feature.id, feature]),
  );
  const relationshipCandidates = workspace.productFeatures.filter(
    (feature) => feature.id !== featureId,
  );
  const graphBuckets = groupGraphBuckets(workspace.knowledge);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Feature Memory Workspace"
        title={workspace.feature.name}
        description={workspace.feature.description || "No feature description yet."}
        actions={[]}
      />

      <nav className="text-sm text-[var(--muted)]" aria-label="Breadcrumb">
        <Link className="font-medium text-[var(--accent-strong)]" href={productRoute(productId)}>
          {workspace.product.name}
        </Link>{" "}
        /{" "}
        <Link
          className="font-medium text-[var(--accent-strong)]"
          href={moduleRoute(productId, moduleId)}
        >
          {workspace.module.name}
        </Link>{" "}
        / {workspace.feature.name}
      </nav>

      <nav
        aria-label="Feature workspace sections"
        className="flex gap-2 overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--panel)] p-2"
      >
        {[
          ["#overview", "Overview"],
          ["#knowledge", "Knowledge"],
          ["#sources", "Sources"],
          ["#relationships", "Relationships"],
          ["#timeline", "Timeline"],
          ["#tasks", "Tasks"],
        ].map(([href, label]) => (
          <a
            className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-[var(--muted-strong)] hover:bg-[var(--panel-subtle)]"
            href={href}
            key={href}
          >
            {label}
          </a>
        ))}
      </nav>

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <form
            action={updateFeature}
            className="rounded-md border border-[var(--border)] bg-[var(--panel)]"
            id="overview"
          >
            <SectionHeader
              title="Feature overview"
              description="Edit status and ordering without leaving the memory workspace."
            />
            <div className="space-y-4 p-4">
              <label className="block">
                <span className="text-sm font-medium">Name</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                  defaultValue={workspace.feature.name}
                  name="name"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Description</span>
                <textarea
                  className="mt-1 min-h-24 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                  defaultValue={workspace.feature.description}
                  name="description"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium">Status</span>
                  <select
                    className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                    defaultValue={workspace.feature.status}
                    name="status"
                  >
                    <option value="active">Active</option>
                    <option value="planned">Planned</option>
                    <option value="deprecated">Deprecated</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Position</span>
                  <input
                    className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                    defaultValue={workspace.feature.position}
                    min={0}
                    name="position"
                    type="number"
                  />
                </label>
              </div>
              <Button type="submit">Save feature</Button>
            </div>
          </form>

          <form
            action={createKnowledge}
            className="rounded-md border border-[var(--border)] bg-[var(--panel)]"
          >
            <SectionHeader
              title="Create Product Memory"
              description="Manual memory defaults to proposed unless you explicitly mark it verified."
            />
            <KnowledgeFields sources={workspace.productSources} />
            <div className="border-t border-[var(--border)] p-4">
              <Button type="submit">Create knowledge</Button>
            </div>
          </form>

          <SidePanel id="sources" title="Sources connected to this feature">
            {workspace.sources.length ? (
              <div className="flex flex-wrap gap-2">
                {workspace.sources.map((source) => (
                  <Link
                    href={sourceRoute(productId, source.id)}
                    key={source.id}
                  >
                    <SourceChip label={source.name} />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No feature sources yet"
                description="Connect source evidence before trusting important feature claims."
              />
            )}
          </SidePanel>

          <form
            action={createRelationship}
            className="rounded-md border border-[var(--border)] bg-[var(--panel)]"
            id="relationships"
          >
            <SectionHeader
              title="Add feature relationship"
              description="Map how this feature depends on, reuses, impacts, or blocks another feature."
            />
            <div className="space-y-4 p-4">
              <label className="block">
                <span className="text-sm font-medium">Related feature</span>
                <select
                  className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                  name="toFeatureId"
                  required
                >
                  <option value="">Choose a feature</option>
                  {relationshipCandidates.map((feature) => (
                    <option key={feature.id} value={feature.id}>
                      {feature.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium">Relationship</span>
                <select
                  className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                  name="relationshipType"
                >
                  {featureRelationshipOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium">Reason</span>
                <textarea
                  className="mt-1 min-h-20 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                  name="reason"
                  placeholder="Explain why this relationship matters."
                />
              </label>
              <Button type="submit">Add relationship</Button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
            <SectionHeader
              title="Product Graph"
              description="Structured view of what this feature touches, reuses, constrains, and may impact."
            />
            <div className="grid gap-4 p-4 lg:grid-cols-2">
              <GraphList
                empty="No feature relationships yet."
                items={workspace.relationships.map((relationship) => {
                  const relatedId =
                    relationship.fromFeatureId === featureId
                      ? relationship.toFeatureId
                      : relationship.fromFeatureId;
                  const relatedFeature = relationshipFeatureById.get(relatedId);

                  return {
                    id: relationship.id,
                    title: relatedFeature?.name ?? relatedId,
                    eyebrow: formatRelationshipType(relationship.relationshipType),
                    description: relationship.reason || "No reason recorded.",
                    action: removeFeatureRelationshipAction.bind(
                      null,
                      productId,
                      moduleId,
                      featureId,
                      relationship.id,
                    ),
                  };
                })}
                title="Related features"
              />
              <GraphList
                empty="No constraints linked to this feature yet."
                items={graphBuckets.constraints}
                title="Constraints"
              />
              <GraphList
                empty="No decision memory linked to this feature yet."
                items={graphBuckets.decisions}
                title="Decisions and rejected approaches"
              />
              <GraphList
                empty="No component memory linked to this feature yet."
                items={graphBuckets.components}
                title="Components and patterns"
              />
            </div>
          </section>

          <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
            <SectionHeader
              title="Knowledge grouped by type"
              description="Each claim keeps authority, confidence, lifecycle, evidence count, and verification state visible."
            />
            <div className="divide-y divide-[var(--border)]" id="knowledge">
              {knowledgeTypeOptions.map((type) => {
                const items = knowledgeByType[type.value] ?? [];
                return (
                  <div className="p-4" key={type.value}>
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-semibold">{type.label}</h2>
                      <span className="text-xs text-[var(--muted)]">
                        {items.length} items
                      </span>
                    </div>
                    {items.length ? (
                      <div className="mt-3 space-y-3">
                        {items.map((item) => (
                          <Link
                            className="block rounded-md border border-[var(--border)] bg-white p-3 transition hover:bg-[var(--panel-subtle)]"
                            href={knowledgeRoute(productId, moduleId, featureId, item.id)}
                            key={item.id}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge status={item.lifecycleStatus} />
                              <span className="text-xs text-[var(--muted)]">
                                {item.authority} authority
                              </span>
                              <span className="text-xs text-[var(--muted)]">
                                {item.confidence}% confidence
                              </span>
                              <span className="text-xs text-[var(--muted)]">
                                {item.sourceCount} sources
                              </span>
                              <span className="text-xs text-[var(--muted)]">
                                Verified {formatDate(item.lastVerifiedAt)}
                              </span>
                            </div>
                            <h3 className="mt-2 text-sm font-medium">{item.title}</h3>
                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                              {item.body}
                            </p>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-[var(--muted)]">
                        No {type.label.toLowerCase()} captured for this feature yet.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <SidePanel id="timeline" title="Feature timeline">
              {workspace.timeline.length ? (
                <div className="space-y-3">
                  {workspace.timeline.map((event) => (
                    <div
                      className="rounded-md border border-[var(--border)] bg-white p-3"
                      key={event.id}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-[var(--panel-subtle)] px-2 py-1 text-xs font-medium">
                          {String(event.eventType).replaceAll("_", " ")}
                        </span>
                        <span className="text-xs text-[var(--muted)]">
                          {event.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-medium">{event.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                        {event.note || "No note recorded."}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No timeline events yet"
                  description="Creating, verifying, rejecting, or marking knowledge outdated will add feature history."
                />
              )}
            </SidePanel>

            <SidePanel id="tasks" title="Tasks and Context Packs">
              {workspace.tasks.length || workspace.contextPacks.length ? (
                <div className="space-y-3">
                  {workspace.tasks.map((task) => (
                    <div className="rounded-md border border-[var(--border)] bg-white p-3" key={task.id}>
                      <h3 className="text-sm font-medium">{task.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                        {task.description}
                      </p>
                    </div>
                  ))}
                  {workspace.contextPacks.map((pack) => (
                    <div className="rounded-md border border-[var(--border)] bg-white p-3" key={pack.id}>
                      <h3 className="text-sm font-medium">Context Pack</h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                        {pack.generatedContent}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No feature tasks yet"
                  description="Create a task when you want AI to work on this feature with the right Product Memory."
                />
              )}
            </SidePanel>
          </section>
        </div>
      </section>
    </div>
  );
}

function KnowledgeFields({
  sources,
  selectedSourceIds = [],
  defaults,
}: {
  sources: Array<{ id: string; name: string; sourceType: string }>;
  selectedSourceIds?: string[];
  defaults?: {
    title?: string;
    body?: string;
    knowledgeType?: string;
    authority?: string;
    confidence?: number;
    lifecycleStatus?: string;
    validFrom?: Date | null;
    validUntil?: Date | null;
    lastVerifiedAt?: Date | null;
  };
}) {
  return (
    <div className="space-y-4 p-4">
      <label className="block">
        <span className="text-sm font-medium">Title</span>
        <input
          className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
          defaultValue={defaults?.title}
          name="title"
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Body</span>
        <textarea
          className="mt-1 min-h-28 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
          defaultValue={defaults?.body}
          name="body"
          required
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Type</span>
          <select
            className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
            defaultValue={defaults?.knowledgeType ?? "current_behaviour"}
            name="knowledgeType"
          >
            {knowledgeTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Authority</span>
          <select
            className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
            defaultValue={defaults?.authority ?? "unverified"}
            name="authority"
          >
            {authorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Confidence</span>
          <input
            className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
            defaultValue={defaults?.confidence ?? 50}
            max={100}
            min={0}
            name="confidence"
            type="number"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Lifecycle</span>
          <select
            className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
            defaultValue={defaults?.lifecycleStatus ?? "proposed"}
            name="lifecycleStatus"
          >
            {lifecycleStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <DateInput label="Valid from" name="validFrom" value={defaults?.validFrom} />
        <DateInput label="Valid until" name="validUntil" value={defaults?.validUntil} />
        <DateInput
          label="Last verified"
          name="lastVerifiedAt"
          value={defaults?.lastVerifiedAt}
        />
      </div>
      <label className="flex items-start gap-2 rounded-md border border-[#fecaca] bg-[#fee2e2] p-3 text-sm text-[#991b1b]">
        <input className="mt-1" name="confirmRejected" type="checkbox" />
        Confirm if changing verified knowledge to rejected.
      </label>
      <fieldset className="rounded-md border border-[var(--border)] p-3">
        <legend className="px-1 text-sm font-medium">Source evidence</legend>
        {sources.length ? (
          <div className="mt-2 space-y-2">
            {sources.map((source) => (
              <label className="flex items-start gap-2 text-sm" key={source.id}>
                <input
                  className="mt-1"
                  defaultChecked={selectedSourceIds.includes(source.id)}
                  name="sourceIds"
                  type="checkbox"
                  value={source.id}
                />
                <span>
                  {source.name}
                  <span className="ml-2 text-xs text-[var(--muted)]">
                    {source.sourceType}
                  </span>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--muted)]">
            No product sources exist yet.
          </p>
        )}
      </fieldset>
    </div>
  );
}

function DateInput({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value?: Date | null;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
        defaultValue={toDateInputValue(value)}
        name={name}
        type="datetime-local"
      />
    </label>
  );
}

function SidePanel({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
      <SectionHeader title={title} />
      <div className="p-4">{children}</div>
    </section>
  );
}

function GraphList({
  title,
  items,
  empty,
}: {
  title: string;
  items: Array<{
    id: string;
    title: string;
    eyebrow: string;
    description: string;
    action?: () => void | Promise<void>;
  }>;
  empty: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      {items.length ? (
        <div className="mt-3 space-y-3">
          {items.map((item) => (
            <article
              className="rounded-md border border-[var(--border)] bg-white p-3"
              key={item.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <RelationshipChip label={item.eyebrow} />
                {item.action ? (
                  <form action={item.action}>
                    <Button type="submit" variant="secondary">
                      Remove
                    </Button>
                  </form>
                ) : null}
              </div>
              <h3 className="mt-2 text-sm font-medium">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                {item.description}
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

function groupGraphBuckets(
  knowledge: Array<{
    id: string;
    title: string;
    body: string;
    knowledgeType: KnowledgeType;
    lifecycleStatus: string;
  }>,
) {
  return knowledge.reduce(
    (buckets, item) => {
      const bucket = getGraphBucketForKnowledgeType(item.knowledgeType);
      const graphItem = {
        id: item.id,
        title: item.title,
        eyebrow:
          bucket === "decisions" && item.lifecycleStatus === "rejected"
            ? "rejected approach"
            : getKnowledgeTypeLabel(item.knowledgeType),
        description: item.body,
      };

      if (bucket === "components") {
        buckets.components.push(graphItem);
      } else if (bucket === "constraints") {
        buckets.constraints.push(graphItem);
      } else if (bucket === "decisions") {
        buckets.decisions.push(graphItem);
      }

      return buckets;
    },
    {
      components: [] as Array<{
        id: string;
        title: string;
        eyebrow: string;
        description: string;
      }>,
      constraints: [] as Array<{
        id: string;
        title: string;
        eyebrow: string;
        description: string;
      }>,
      decisions: [] as Array<{
        id: string;
        title: string;
        eyebrow: string;
        description: string;
      }>,
    },
  );
}

function formatDate(value: Date | null) {
  return value ? value.toLocaleDateString() : "not yet";
}

function toDateInputValue(value?: Date | null) {
  if (!value) {
    return "";
  }

  return new Date(value.getTime() - value.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

import Link from "next/link";
import { notFound } from "next/navigation";

import {
  createKnowledgeRelationshipAction,
  removeKnowledgeRelationshipAction,
} from "@/app/actions/product-graph";
import {
  transitionKnowledgeLifecycleAction,
  updateFeatureKnowledgeAction,
} from "@/app/actions/feature-memory";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RelationshipChip } from "@/components/relationship-chip";
import { SectionHeader } from "@/components/section-header";
import { SourceChip } from "@/components/source-chip";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  getKnowledgeItemDetail,
  getSourcesForProduct,
} from "@/db/queries";
import { requireUser } from "@/lib/auth/session";
import {
  authorityOptions,
  getKnowledgeTypeLabel,
  knowledgeTypeOptions,
  lifecycleStatusOptions,
} from "@/lib/product-memory/knowledge-model";
import {
  formatRelationshipType,
  knowledgeRelationshipOptions,
} from "@/lib/product-graph/relationships";
import { featureRoute, moduleRoute, productRoute } from "@/lib/routes";

export default async function KnowledgeDetailPage({
  params,
}: {
  params: Promise<{
    productId: string;
    moduleId: string;
    featureId: string;
    knowledgeId: string;
  }>;
}) {
  const user = await requireUser();
  const { productId, moduleId, featureId, knowledgeId } = await params;
  const [detail, productSources] = await Promise.all([
    getKnowledgeItemDetail(knowledgeId, productId, user.id),
    getSourcesForProduct(productId, user.id),
  ]);

  if (
    !detail ||
    detail.knowledge.moduleId !== moduleId ||
    detail.knowledge.featureId !== featureId
  ) {
    notFound();
  }

  const updateKnowledge = updateFeatureKnowledgeAction.bind(
    null,
    productId,
    moduleId,
    featureId,
    knowledgeId,
  );
  const transitionKnowledge = transitionKnowledgeLifecycleAction.bind(
    null,
    productId,
    moduleId,
    featureId,
    knowledgeId,
  );
  const createRelationship = createKnowledgeRelationshipAction.bind(
    null,
    productId,
    moduleId,
    featureId,
    knowledgeId,
  );
  const selectedSourceIds = detail.sources.map((source) => source.id);
  const relationshipKnowledgeById = new Map(
    detail.productKnowledge.map((item) => [item.id, item]),
  );
  const relationshipCandidates = detail.productKnowledge.filter(
    (item) => item.id !== knowledgeId,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={getKnowledgeTypeLabel(detail.knowledge.knowledgeType)}
        title={detail.knowledge.title}
        description={detail.knowledge.body}
        actions={[]}
      />

      <nav className="text-sm text-[var(--muted)]" aria-label="Breadcrumb">
        <Link className="font-medium text-[var(--accent-strong)]" href={productRoute(productId)}>
          Product
        </Link>{" "}
        /{" "}
        <Link
          className="font-medium text-[var(--accent-strong)]"
          href={moduleRoute(productId, moduleId)}
        >
          Module
        </Link>{" "}
        /{" "}
        <Link
          className="font-medium text-[var(--accent-strong)]"
          href={featureRoute(productId, moduleId, featureId)}
        >
          Feature
        </Link>{" "}
        / Knowledge
      </nav>

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
            <SectionHeader
              title="Lifecycle"
              description="Historical knowledge is never deleted automatically."
            />
            <div className="space-y-4 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={detail.knowledge.lifecycleStatus} />
                <span className="text-sm text-[var(--muted)]">
                  {detail.knowledge.authority} authority
                </span>
                <span className="text-sm text-[var(--muted)]">
                  {detail.knowledge.confidence}% confidence
                </span>
              </div>
              <div className="grid gap-2">
                <LifecycleButton
                  action={transitionKnowledge}
                  disabled={detail.knowledge.lifecycleStatus !== "proposed"}
                  label="Mark verified"
                  targetStatus="verified"
                />
                <LifecycleButton
                  action={transitionKnowledge}
                  disabled={detail.knowledge.lifecycleStatus !== "verified"}
                  label="Mark outdated"
                  targetStatus="outdated"
                />
                <form action={transitionKnowledge} className="space-y-2">
                  <input name="targetStatus" type="hidden" value="rejected" />
                  {detail.knowledge.lifecycleStatus === "verified" ? (
                    <label className="flex items-start gap-2 rounded-md border border-[#fecaca] bg-[#fee2e2] p-3 text-sm text-[#991b1b]">
                      <input className="mt-1" name="confirmRejected" type="checkbox" />
                      Confirm rejection of verified knowledge.
                    </label>
                  ) : null}
                  <Button
                    disabled={
                      !["proposed", "verified"].includes(
                        detail.knowledge.lifecycleStatus,
                      )
                    }
                    type="submit"
                    variant="secondary"
                  >
                    Mark rejected
                  </Button>
                </form>
              </div>
            </div>
          </section>

          <form
            action={updateKnowledge}
            className="rounded-md border border-[var(--border)] bg-[var(--panel)]"
          >
            <SectionHeader
              title="Edit knowledge"
              description="Keep the claim structured, source-backed, and lifecycle-aware."
            />
            <KnowledgeEditFields
              defaults={detail.knowledge}
              selectedSourceIds={selectedSourceIds}
              sources={productSources}
            />
            <div className="border-t border-[var(--border)] p-4">
              <Button type="submit">Save knowledge</Button>
            </div>
          </form>

          <form
            action={createRelationship}
            className="rounded-md border border-[var(--border)] bg-[var(--panel)]"
          >
            <SectionHeader
              title="Add knowledge relationship"
              description="Preserve explicit links between rules, decisions, constraints, evidence, and contradictions."
            />
            <div className="space-y-4 p-4">
              <label className="block">
                <span className="text-sm font-medium">Related memory</span>
                <select
                  className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                  name="toKnowledgeId"
                  required
                >
                  <option value="">Choose knowledge</option>
                  {relationshipCandidates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
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
                  {knowledgeRelationshipOptions.map((option) => (
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
            <SectionHeader title="Full body" />
            <p className="p-4 text-sm leading-7 text-[var(--muted-strong)]">
              {detail.knowledge.body}
            </p>
          </section>

          <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
            <SectionHeader title="Source evidence" />
            {detail.sources.length ? (
              <div className="space-y-3 p-4">
                <div className="flex flex-wrap gap-2">
                  {detail.sources.map((source) => (
                    <SourceChip key={source.id} label={source.name} />
                  ))}
                </div>
                {detail.sources.map((source) => (
                  <article
                    className="rounded-md border border-[var(--border)] bg-white p-3"
                    key={source.id}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-[var(--panel-subtle)] px-2 py-1 text-xs font-medium">
                        {source.sourceType}
                      </span>
                      {source.url ? (
                        <a className="text-xs text-[var(--accent-strong)]" href={source.url}>
                          {source.url}
                        </a>
                      ) : null}
                    </div>
                    <h3 className="mt-2 text-sm font-medium">{source.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      {source.rawContent || "No raw content stored."}
                    </p>
                    <pre className="mt-2 overflow-auto rounded-md bg-[var(--panel-subtle)] p-2 text-xs text-[var(--muted-strong)]">
                      {JSON.stringify(source.metadata, null, 2)}
                    </pre>
                  </article>
                ))}
              </div>
            ) : (
              <div className="p-4">
                <EmptyState
                  title="No source evidence linked"
                  description="Connect source evidence before relying on this memory in Context Packs."
                />
              </div>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <DetailPanel title="Relationships">
              {detail.relationships.length ? (
                <div className="space-y-3">
                  {detail.relationships.map((relationship) => {
                    const relatedId =
                      relationship.fromKnowledgeId === knowledgeId
                        ? relationship.toKnowledgeId
                        : relationship.fromKnowledgeId;
                    const related = detail.relatedKnowledge.find(
                      (item) => item.id === relatedId,
                    ) ?? relationshipKnowledgeById.get(relatedId);
                    const removeRelationship = removeKnowledgeRelationshipAction.bind(
                      null,
                      productId,
                      moduleId,
                      featureId,
                      knowledgeId,
                      relationship.id,
                    );
                    return (
                      <div
                        className="rounded-md border border-[var(--border)] bg-white p-3"
                        key={relationship.id}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <RelationshipChip
                            label={formatRelationshipType(relationship.relationshipType)}
                          />
                          <form action={removeRelationship}>
                            <Button type="submit" variant="secondary">
                              Remove
                            </Button>
                          </form>
                        </div>
                        <p className="mt-2 text-sm font-medium">
                          {related?.title ?? relatedId}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                          {relationship.reason || "No reason recorded."}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No knowledge relationships"
                  description="Relationships will show contradictions, supersession, and related decisions."
                />
              )}
            </DetailPanel>

            <DetailPanel title="Lifecycle history">
              {detail.history.length ? (
                <div className="space-y-3">
                  {detail.history.map((event) => (
                    <div
                      className="rounded-md border border-[var(--border)] bg-white p-3"
                      key={event.id}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-[var(--panel-subtle)] px-2 py-1 text-xs font-medium">
                          {event.eventType.replaceAll("_", " ")}
                        </span>
                        <span className="text-xs text-[var(--muted)]">
                          {event.createdAt.toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium">{event.title}</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                        {event.note || "No note recorded."}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No lifecycle history yet"
                  description="Lifecycle events appear when memory is created, verified, outdated, or rejected."
                />
              )}
            </DetailPanel>
          </section>

          <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
            <SectionHeader title="Metadata" />
            <dl className="grid gap-3 p-4 text-sm sm:grid-cols-2">
              <Meta label="Valid from" value={formatDate(detail.knowledge.validFrom)} />
              <Meta label="Valid until" value={formatDate(detail.knowledge.validUntil)} />
              <Meta
                label="Last verified"
                value={formatDate(detail.knowledge.lastVerifiedAt)}
              />
              <Meta label="Created" value={detail.knowledge.createdAt.toLocaleString()} />
              <Meta label="Updated" value={detail.knowledge.updatedAt.toLocaleString()} />
              <Meta label="Created by" value={detail.knowledge.createdBy} />
            </dl>
          </section>
        </div>
      </section>
    </div>
  );
}

function KnowledgeEditFields({
  sources,
  selectedSourceIds,
  defaults,
}: {
  sources: Array<{ id: string; name: string; sourceType: string }>;
  selectedSourceIds: string[];
  defaults: {
    title: string;
    body: string;
    knowledgeType: string;
    authority: string;
    confidence: number;
    lifecycleStatus: string;
    validFrom: Date | null;
    validUntil: Date | null;
    lastVerifiedAt: Date | null;
  };
}) {
  return (
    <div className="space-y-4 p-4">
      <label className="block">
        <span className="text-sm font-medium">Title</span>
        <input
          className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
          defaultValue={defaults.title}
          name="title"
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Body</span>
        <textarea
          className="mt-1 min-h-32 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
          defaultValue={defaults.body}
          name="body"
          required
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Type"
          name="knowledgeType"
          options={knowledgeTypeOptions}
          value={defaults.knowledgeType}
        />
        <SelectField
          label="Authority"
          name="authority"
          options={authorityOptions}
          value={defaults.authority}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Confidence</span>
          <input
            className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
            defaultValue={defaults.confidence}
            max={100}
            min={0}
            name="confidence"
            type="number"
          />
        </label>
        <SelectField
          label="Lifecycle"
          name="lifecycleStatus"
          options={lifecycleStatusOptions}
          value={defaults.lifecycleStatus}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <DateInput label="Valid from" name="validFrom" value={defaults.validFrom} />
        <DateInput label="Valid until" name="validUntil" value={defaults.validUntil} />
        <DateInput
          label="Last verified"
          name="lastVerifiedAt"
          value={defaults.lastVerifiedAt}
        />
      </div>
      <label className="flex items-start gap-2 rounded-md border border-[#fecaca] bg-[#fee2e2] p-3 text-sm text-[#991b1b]">
        <input className="mt-1" name="confirmRejected" type="checkbox" />
        Confirm if changing verified knowledge to rejected.
      </label>
      <fieldset className="rounded-md border border-[var(--border)] p-3">
        <legend className="px-1 text-sm font-medium">Source evidence</legend>
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
      </fieldset>
    </div>
  );
}

function LifecycleButton({
  action,
  disabled,
  label,
  targetStatus,
}: {
  action: (formData: FormData) => void | Promise<void>;
  disabled: boolean;
  label: string;
  targetStatus: string;
}) {
  return (
    <form action={action}>
      <input name="targetStatus" type="hidden" value={targetStatus} />
      <Button disabled={disabled} type="submit" variant="secondary">
        {label}
      </Button>
    </form>
  );
}

function SelectField({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <select
        className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
        defaultValue={value}
        name={name}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
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

function DetailPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
      <SectionHeader title={title} />
      <div className="p-4">{children}</div>
    </section>
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

function formatDate(value: Date | null) {
  return value ? value.toLocaleString() : "Not set";
}

function toDateInputValue(value?: Date | null) {
  if (!value) {
    return "";
  }

  return new Date(value.getTime() - value.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

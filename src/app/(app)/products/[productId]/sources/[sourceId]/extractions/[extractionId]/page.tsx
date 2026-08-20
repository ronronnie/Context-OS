import Link from "next/link";
import { notFound } from "next/navigation";

import {
  approveAllExtractionCandidatesAction,
  approveExtractionCandidateAction,
  rejectExtractionCandidateAction,
  resolveExtractionConflictAction,
} from "@/app/actions/source-extraction";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { SourceChip } from "@/components/source-chip";
import { Button } from "@/components/ui/button";
import { getSourceExtractionReview } from "@/db/queries";
import { requireUser } from "@/lib/auth/session";
import { authorityOptions, knowledgeTypeOptions } from "@/lib/product-memory/knowledge-model";
import { productRoute, sourceRoute } from "@/lib/routes";

export default async function SourceExtractionReviewPage({
  params,
}: {
  params: Promise<{ productId: string; sourceId: string; extractionId: string }>;
}) {
  const user = await requireUser();
  const { productId, sourceId, extractionId } = await params;
  const review = await getSourceExtractionReview(
    productId,
    sourceId,
    extractionId,
    user.id,
  );

  if (!review) {
    notFound();
  }

  const pendingCount = review.candidates.filter(
    (candidate) => candidate.status === "pending",
  ).length;
  const approveAll = approveAllExtractionCandidatesAction.bind(
    null,
    productId,
    sourceId,
    extractionId,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Knowledge Extraction"
        title={`AI found ${review.candidates.length} pieces of Product Knowledge`}
        description="Review each atomic candidate. Only approved items become verified Product Memory."
        actions={[]}
      />

      <nav className="text-sm text-[var(--muted)]" aria-label="Breadcrumb">
        <Link className="font-medium text-[var(--accent-strong)]" href={productRoute(productId)}>
          {review.product.name}
        </Link>{" "}
        /{" "}
        <Link
          className="font-medium text-[var(--accent-strong)]"
          href={sourceRoute(productId, sourceId)}
        >
          {review.source.name}
        </Link>{" "}
        / Extraction review
      </nav>

      <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-6">
          <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
            <SectionHeader title="Review summary" />
            <dl className="grid gap-3 p-4 text-sm">
              <SummaryRow label="Pending" value={pendingCount} />
              <SummaryRow
                label="Approved"
                value={review.candidates.filter((item) => item.status === "approved").length}
              />
              <SummaryRow
                label="Rejected"
                value={review.candidates.filter((item) => item.status === "rejected").length}
              />
              <SummaryRow label="Skipped" value={review.extraction.skippedClaims.length} />
            </dl>
            <form action={approveAll} className="border-t border-[var(--border)] p-4">
              <Button disabled={!pendingCount} type="submit">
                Approve all pending
              </Button>
            </form>
          </section>

          <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
            <SectionHeader title="Skipped claims" />
            {review.extraction.skippedClaims.length ? (
              <div className="space-y-2 p-4">
                {review.extraction.skippedClaims.map((claim, index) => (
                  <div className="rounded-md border border-[var(--border)] bg-white p-3" key={index}>
                    <h2 className="text-sm font-medium">{claim.claim}</h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">{claim.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4">
                <EmptyState
                  title="No skipped claims"
                  description="The model did not report ambiguous unsupported claims for this run."
                />
              </div>
            )}
          </section>
        </aside>

        <section className="space-y-4">
          {review.candidates.length ? (
            review.candidates.map((candidate) => (
              <CandidateReviewCard
                candidate={candidate}
                conflicts={review.conflicts.filter(
                  (conflict) => conflict.candidateId === candidate.id,
                )}
                extractionId={extractionId}
                key={candidate.id}
                productId={productId}
                sourceId={sourceId}
              />
            ))
          ) : (
            <EmptyState
              title="No candidates extracted"
              description="This source did not produce atomic Product Memory candidates."
            />
          )}
        </section>
      </section>
    </div>
  );
}

function CandidateReviewCard({
  candidate,
  conflicts,
  productId,
  sourceId,
  extractionId,
}: {
  candidate: NonNullable<
    Awaited<ReturnType<typeof getSourceExtractionReview>>
  >["candidates"][number];
  conflicts: NonNullable<
    Awaited<ReturnType<typeof getSourceExtractionReview>>
  >["conflicts"];
  productId: string;
  sourceId: string;
  extractionId: string;
}) {
  const approve = approveExtractionCandidateAction.bind(
    null,
    productId,
    sourceId,
    extractionId,
    candidate.id,
  );
  const reject = rejectExtractionCandidateAction.bind(
    null,
    productId,
    sourceId,
    extractionId,
    candidate.id,
  );
  const disabled = candidate.status !== "pending";
  const pendingConflictCount = conflicts.filter(
    (conflict) => conflict.resolution === "pending",
  ).length;

  return (
    <form action={approve} className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input defaultChecked disabled={disabled} name="approvedCandidateIds" type="checkbox" value={candidate.id} />
          Review candidate
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <CandidateStatus status={candidate.status} />
          <SourceChip label={String(candidate.knowledgeType).replaceAll("_", " ")} />
          <span className="text-xs text-[var(--muted)]">
            {candidate.confidence}% confidence
          </span>
          <span className="text-xs text-[var(--muted)]">
            {candidate.suggestedAuthority} authority
          </span>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <label className="block lg:col-span-2">
          <span className="text-sm font-medium">Title</span>
          <input
            className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
            defaultValue={candidate.title}
            disabled={disabled}
            name="title"
            required
          />
        </label>
        <label className="block lg:col-span-2">
          <span className="text-sm font-medium">Body</span>
          <textarea
            className="mt-1 min-h-28 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm leading-6 outline-none focus:ring-4 focus:ring-[#99f6e4]"
            defaultValue={candidate.body}
            disabled={disabled}
            name="body"
            required
          />
        </label>
        <SelectField
          disabled={disabled}
          label="Type"
          name="knowledgeType"
          options={knowledgeTypeOptions}
          value={candidate.knowledgeType}
        />
        <SelectField
          disabled={disabled}
          label="Suggested authority"
          name="authority"
          options={authorityOptions}
          value={candidate.suggestedAuthority}
        />
        <label className="block">
          <span className="text-sm font-medium">Confidence</span>
          <input
            className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
            defaultValue={candidate.confidence}
            disabled={disabled}
            max={100}
            min={0}
            name="confidence"
            type="number"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Historical</span>
          <input
            className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm"
            defaultValue={candidate.appearsHistorical ? "Yes" : "No"}
            disabled
          />
        </label>
        <label className="block lg:col-span-2">
          <span className="text-sm font-medium">Source evidence</span>
          <textarea
            className="mt-1 min-h-24 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 font-mono text-xs leading-5 outline-none focus:ring-4 focus:ring-[#99f6e4]"
            defaultValue={JSON.stringify(candidate.sourceEvidence, null, 2)}
            disabled={disabled}
            name="sourceEvidence"
            required
          />
        </label>
        <label className="block lg:col-span-2">
          <span className="text-sm font-medium">Reasoning summary</span>
          <textarea
            className="mt-1 min-h-20 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm leading-6 outline-none focus:ring-4 focus:ring-[#99f6e4]"
            defaultValue={candidate.reasoningSummary}
            disabled={disabled}
            name="reasoningSummary"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Potential relationships</span>
          <textarea
            className="mt-1 min-h-20 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm leading-6 outline-none focus:ring-4 focus:ring-[#99f6e4]"
            defaultValue={candidate.potentialRelationships.join("\n")}
            disabled={disabled}
            name="potentialRelationships"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Possible conflicts</span>
          <textarea
            className="mt-1 min-h-20 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm leading-6 outline-none focus:ring-4 focus:ring-[#99f6e4]"
            defaultValue={candidate.possibleConflicts.join("\n")}
            disabled={disabled}
            name="possibleConflicts"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[var(--border)] p-4">
        <Button disabled={disabled || pendingConflictCount > 0} type="submit">
          Approve
        </Button>
        <Button disabled={disabled} formAction={reject} type="submit" variant="secondary">
          Reject
        </Button>
      </div>
      {conflicts.length ? (
        <div className="space-y-3 border-t border-[var(--border)] bg-white p-4">
          <h3 className="text-sm font-semibold">Potential conflicts</h3>
          {conflicts.map((conflict) => (
            <ConflictReview
              conflict={conflict}
              disabled={disabled || conflict.resolution !== "pending"}
              extractionId={extractionId}
              key={conflict.id}
              productId={productId}
              sourceId={sourceId}
            />
          ))}
        </div>
      ) : null}
      {pendingConflictCount ? (
        <p className="border-t border-[var(--border)] bg-[#fef3c7] p-4 text-sm text-[#92400e]">
          Resolve {pendingConflictCount} potential conflict
          {pendingConflictCount === 1 ? "" : "s"} before normal approval.
        </p>
      ) : null}
    </form>
  );
}

function ConflictReview({
  conflict,
  productId,
  sourceId,
  extractionId,
  disabled,
}: {
  conflict: NonNullable<
    Awaited<ReturnType<typeof getSourceExtractionReview>>
  >["conflicts"][number];
  productId: string;
  sourceId: string;
  extractionId: string;
  disabled: boolean;
}) {
  const replaceExisting = resolveExtractionConflictAction.bind(
    null,
    productId,
    sourceId,
    extractionId,
    conflict.id,
    "replace_existing",
  );
  const keepBoth = resolveExtractionConflictAction.bind(
    null,
    productId,
    sourceId,
    extractionId,
    conflict.id,
    "keep_both",
  );
  const markExistingOutdated = resolveExtractionConflictAction.bind(
    null,
    productId,
    sourceId,
    extractionId,
    conflict.id,
    "mark_existing_outdated",
  );
  const rejectNew = resolveExtractionConflictAction.bind(
    null,
    productId,
    sourceId,
    extractionId,
    conflict.id,
    "reject_new",
  );
  const existing = conflict.existingSnapshot;
  const candidate = conflict.candidateSnapshot;

  return (
    <section className="rounded-md border border-[#fde68a] bg-[#fffbeb] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-[#fde68a] bg-[#fef3c7] px-2 py-1 text-xs font-medium text-[#92400e]">
          {String(conflict.conflictType).replaceAll("_", " ")}
        </span>
        <span className="text-xs text-[var(--muted)]">
          Resolution: {String(conflict.resolution).replaceAll("_", " ")}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">
        {conflict.summary}
      </p>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <SnapshotPanel label="Existing" snapshot={existing} />
        <SnapshotPanel label="New" snapshot={candidate} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button disabled={disabled} formAction={replaceExisting} type="submit" variant="secondary">
          Replace Existing
        </Button>
        <Button disabled={disabled} formAction={keepBoth} type="submit" variant="secondary">
          Keep Both
        </Button>
        <Button disabled={disabled} formAction={markExistingOutdated} type="submit" variant="secondary">
          Mark Existing Outdated
        </Button>
        <Button disabled={disabled} formAction={rejectNew} type="submit" variant="secondary">
          Reject New
        </Button>
      </div>
    </section>
  );
}

function SnapshotPanel({
  label,
  snapshot,
}: {
  label: string;
  snapshot: Record<string, unknown>;
}) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-white p-3">
      <h4 className="text-xs font-semibold uppercase text-[var(--muted)]">
        {label}
      </h4>
      <h5 className="mt-2 text-sm font-medium">{String(snapshot.title ?? "Untitled")}</h5>
      <p className="mt-1 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
        {String(snapshot.body ?? "No body captured.")}
      </p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
        {snapshot.authority ? <span>{String(snapshot.authority)} authority</span> : null}
        {snapshot.suggestedAuthority ? <span>{String(snapshot.suggestedAuthority)} authority</span> : null}
        {snapshot.lastVerifiedAt ? <span>Verified {formatDate(snapshot.lastVerifiedAt)}</span> : null}
        {snapshot.confidence ? <span>{String(snapshot.confidence)}% confidence</span> : null}
      </div>
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  options,
  disabled,
}: {
  label: string;
  name: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  disabled: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <select
        className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
        defaultValue={value}
        disabled={disabled}
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

function CandidateStatus({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "border-[#fde68a] bg-[#fef3c7] text-[#92400e]",
    approved: "border-[#bbf7d0] bg-[#dcfce7] text-[#166534]",
    rejected: "border-[#fecaca] bg-[#fee2e2] text-[#991b1b]",
  };

  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function formatDate(value: unknown) {
  if (!value) {
    return "unknown";
  }

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "unknown" : date.toLocaleDateString();
}

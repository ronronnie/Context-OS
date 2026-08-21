import Link from "next/link";
import { notFound } from "next/navigation";

import {
  approveDecisionCandidateAction,
  rejectDecisionCandidateAction,
} from "@/app/actions/decision-capture";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { SourceChip } from "@/components/source-chip";
import { Button } from "@/components/ui/button";
import { getTaskOutcomeReview } from "@/db/queries";
import { requireUser } from "@/lib/auth/session";
import { authorityOptions, knowledgeTypeOptions } from "@/lib/product-memory/knowledge-model";
import { contextPackRoute, productRoute, sourceRoute } from "@/lib/routes";

export default async function TaskOutcomeReviewPage({
  params,
}: {
  params: Promise<{ productId: string; contextPackId: string; outcomeId: string }>;
}) {
  const user = await requireUser();
  const { productId, contextPackId, outcomeId } = await params;
  const review = await getTaskOutcomeReview(
    productId,
    contextPackId,
    outcomeId,
    user.id,
  );

  if (!review) {
    notFound();
  }

  const pendingCount = review.candidates.filter(
    (candidate) => candidate.status === "pending",
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Decision Capture"
        title={review.outcome.summary}
        description="Review extracted candidates before they become trusted Product Memory."
        actions={[]}
      />

      <nav className="text-sm text-[var(--muted)]" aria-label="Breadcrumb">
        <Link className="font-medium text-[var(--accent-strong)]" href={productRoute(productId)}>
          {review.product.name}
        </Link>{" "}
        /{" "}
        <Link
          className="font-medium text-[var(--accent-strong)]"
          href={contextPackRoute(productId, contextPackId)}
        >
          Context Pack v{review.pack.version}
        </Link>{" "}
        / Outcome review
      </nav>

      <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-6">
          <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
            <SectionHeader title="Outcome links" />
            <dl className="grid gap-3 p-4 text-sm">
              <SummaryRow label="Task" value={review.task.title} />
              <SummaryRow label="Status" value={review.outcome.status} />
              <SummaryRow label="Pending" value={String(pendingCount)} />
              <SummaryRow
                label="Approved"
                value={String(review.candidates.filter((item) => item.status === "approved").length)}
              />
              <SummaryRow
                label="Rejected"
                value={String(review.candidates.filter((item) => item.status === "rejected").length)}
              />
            </dl>
            <div className="space-y-2 border-t border-[var(--border)] p-4 text-sm">
              <Link
                className="block font-medium text-[var(--accent-strong)]"
                href="/tasks"
              >
                View task list
              </Link>
              <Link
                className="block font-medium text-[var(--accent-strong)]"
                href={contextPackRoute(productId, contextPackId)}
              >
                View originating Context Pack
              </Link>
              {review.source ? (
                <Link
                  className="block font-medium text-[var(--accent-strong)]"
                  href={sourceRoute(productId, review.source.id)}
                >
                  View outcome source
                </Link>
              ) : null}
            </div>
          </section>

          <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
            <SectionHeader title="Submitted outcome" />
            <div className="space-y-4 p-4 text-sm leading-6">
              <div>
                <h2 className="font-medium">Final notes</h2>
                <p className="mt-1 text-[var(--muted)]">
                  {review.outcome.finalDecisionNotes || "None supplied."}
                </p>
              </div>
              <div>
                <h2 className="font-medium">References</h2>
                <p className="mt-1 whitespace-pre-wrap text-[var(--muted)]">
                  {review.outcome.references || "None supplied."}
                </p>
              </div>
              <div>
                <h2 className="font-medium">Pasted result</h2>
                <p className="mt-1 max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-[var(--border)] bg-white p-3 text-[var(--muted)]">
                  {review.outcome.pastedOutcome}
                </p>
              </div>
              {review.outcome.errorMessage ? (
                <p className="rounded-md border border-[#fecaca] bg-[#fee2e2] p-3 text-[#991b1b]">
                  {review.outcome.errorMessage}
                </p>
              ) : null}
            </div>
          </section>
        </aside>

        <section className="space-y-4">
          {review.candidates.length ? (
            review.candidates.map((candidate) => (
              <DecisionCandidateCard
                candidate={candidate}
                contextPackId={contextPackId}
                existingKnowledge={review.existingKnowledge}
                key={candidate.id}
                outcomeId={outcomeId}
                productId={productId}
              />
            ))
          ) : (
            <EmptyState
              title="No decision candidates"
              description={
                review.outcome.status === "failed"
                  ? "Extraction failed. The task outcome source was still preserved."
                  : "The pasted outcome did not produce reviewable Product Memory candidates."
              }
            />
          )}
        </section>
      </section>
    </div>
  );
}

function DecisionCandidateCard({
  candidate,
  existingKnowledge,
  productId,
  contextPackId,
  outcomeId,
}: {
  candidate: NonNullable<
    Awaited<ReturnType<typeof getTaskOutcomeReview>>
  >["candidates"][number];
  existingKnowledge: NonNullable<
    Awaited<ReturnType<typeof getTaskOutcomeReview>>
  >["existingKnowledge"];
  productId: string;
  contextPackId: string;
  outcomeId: string;
}) {
  const approve = approveDecisionCandidateAction.bind(
    null,
    productId,
    contextPackId,
    outcomeId,
    candidate.id,
  );
  const reject = rejectDecisionCandidateAction.bind(
    null,
    productId,
    contextPackId,
    outcomeId,
    candidate.id,
  );
  const disabled = candidate.status !== "pending";

  return (
    <form action={approve} className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-4">
        <h2 className="text-sm font-semibold">Review candidate</h2>
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
          label="Authority"
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
          <span className="text-sm font-medium">Link to existing memory</span>
          <select
            className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
            disabled={disabled}
            name="relatedKnowledgeId"
          >
            <option value="">No relationship</option>
            {existingKnowledge.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <SelectField
          disabled={disabled}
          label="Relationship type"
          name="relationshipType"
          options={[
            { value: "related_to", label: "Related to" },
            { value: "supersedes", label: "Supersedes" },
            { value: "contradicts", label: "Contradicts" },
            { value: "rejects", label: "Rejects" },
          ]}
          value="related_to"
        />
        <label className="block lg:col-span-2">
          <span className="text-sm font-medium">Relationship reason</span>
          <input
            className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
            defaultValue={candidate.potentialRelationships[0] ?? ""}
            disabled={disabled}
            name="relationshipReason"
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
        <Button disabled={disabled} type="submit">
          Approve
        </Button>
        <Button disabled={disabled} formAction={reject} type="submit" variant="secondary">
          Reject
        </Button>
      </div>
    </form>
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 text-[var(--muted-strong)]">{value}</dd>
    </div>
  );
}

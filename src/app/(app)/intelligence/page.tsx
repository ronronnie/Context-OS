import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RelationshipChip } from "@/components/relationship-chip";
import { SectionHeader } from "@/components/section-header";
import { SourceChip } from "@/components/source-chip";
import { Button } from "@/components/ui/button";
import {
  getProductIntelligenceOptions,
  runProductIntelligenceQuery,
} from "@/db/queries";
import { requireUser } from "@/lib/auth/session";
import {
  intelligenceQuestionTypes,
  parseIntelligenceQuerySearchParams,
} from "@/lib/product-intelligence/question-types";
import { productRoute } from "@/lib/routes";

export default async function ProductIntelligencePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const options = await getProductIntelligenceOptions(user.id);
  const hasQuery = Boolean(params.productId && params.questionType);
  let result: Awaited<ReturnType<typeof runProductIntelligenceQuery>> | null = null;
  let error: string | null = null;

  if (hasQuery) {
    try {
      const input = parseIntelligenceQuerySearchParams(params);
      result = await runProductIntelligenceQuery(input, user.id);
    } catch (caught) {
      error = caught instanceof Error ? caught.message : "Product Intelligence query failed.";
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Product Intelligence"
        title="Ask structured questions of Product Memory"
        description="Run guided, source-backed product analysis without opening a generic chat."
        actions={[]}
      />

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form
          className="rounded-md border border-[var(--border)] bg-[var(--panel)]"
          method="GET"
        >
          <SectionHeader
            title="Guided query"
            description="Select a product area and the kind of product analysis you need."
          />
          <div className="space-y-4 p-4">
            <label className="block">
              <span className="text-sm font-medium">Product</span>
              <select
                className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                defaultValue={firstString(params.productId)}
                name="productId"
                required
              >
                <option value="">Choose product</option>
                {options.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Module</span>
              <select
                className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                defaultValue={firstString(params.moduleId)}
                name="moduleId"
              >
                <option value="">Any module</option>
                {options.modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Feature</span>
              <select
                className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                defaultValue={firstString(params.featureId)}
                name="featureId"
              >
                <option value="">Any feature</option>
                {options.features.map((feature) => (
                  <option key={feature.id} value={feature.id}>
                    {feature.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Question type</span>
              <select
                className="mt-1 min-h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                defaultValue={firstString(params.questionType) || "change_impact"}
                name="questionType"
              >
                {intelligenceQuestionTypes.map((question) => (
                  <option key={question.value} value={question.value}>
                    {question.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Optional detail</span>
              <textarea
                className="mt-1 min-h-28 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm leading-6 outline-none focus:ring-4 focus:ring-[#99f6e4]"
                defaultValue={firstString(params.detail)}
                name="detail"
                placeholder="Describe the proposed change, pattern, or concern."
              />
            </label>
            <Button disabled={!options.products.length} type="submit">
              Run intelligence query
            </Button>
          </div>
        </form>

        <section className="space-y-6">
          {error ? (
            <div className="rounded-md border border-[#fecaca] bg-[#fee2e2] p-4 text-sm text-[#991b1b]">
              {error}
            </div>
          ) : null}

          {result ? (
            <IntelligenceResult result={result} />
          ) : (
            <EmptyState
              title="No query run"
              description="Choose a guided question to analyze Product Memory, graph relationships, and source evidence."
            />
          )}
        </section>
      </section>
    </div>
  );
}

function IntelligenceResult({
  result,
}: {
  result: Awaited<ReturnType<typeof runProductIntelligenceQuery>>;
}) {
  const supportedIds = new Set(
    result.answer.supportingMemory.map((item) => item.knowledgeItemId),
  );

  return (
    <>
      <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
        <SectionHeader
          title="Direct answer"
          description={`${result.product.name}${result.feature ? ` / ${result.feature.name}` : ""}`}
        />
        <div className="space-y-4 p-4">
          <p className="text-sm leading-6 text-[var(--muted-strong)]">
            {result.answer.directAnswer}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md border border-[#99f6e4] bg-[#ccfbf1] px-2 py-1 text-xs font-medium text-[#134e4a]">
              Confidence {result.answer.confidence}%
            </span>
            {result.module ? <SourceChip label={result.module.name} /> : null}
            {result.feature ? <SourceChip label={result.feature.name} /> : null}
          </div>
        </div>
      </section>

      <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
        <SectionHeader title="Supporting Product Memory" />
        {result.memory.length ? (
          <div className="divide-y divide-[var(--border)]">
            {result.memory.map((item) => (
              <article className="p-4" key={item.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-[var(--border)] bg-white px-2 py-1 text-xs text-[var(--muted)]">
                    {item.knowledgeType.replaceAll("_", " ")}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {item.authority} authority
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {item.relevanceScore}% relevance
                  </span>
                  {supportedIds.has(item.id) ? (
                    <span className="text-xs font-medium text-[var(--accent-strong)]">
                      cited
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-2 text-sm font-semibold">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  {item.body}
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {item.reasonForInclusion}
                </p>
                {item.sourceEvidence.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.sourceEvidence.map((source) => (
                      <SourceChip key={source.id} label={source.name} />
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="p-4">
            <EmptyState
              title="No supporting memory"
              description="The query did not retrieve source-backed Product Memory."
            />
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ResultList
          items={result.answer.risks}
          title="Risks"
          empty="No risks were identified from the retrieved memory."
        />
        <ResultList
          items={result.answer.openQuestions}
          title="Open questions"
          empty="No open questions were identified from the retrieved memory."
        />
      </section>

      <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
        <SectionHeader title="Relationship path" />
        {result.answer.relationshipPath.length || result.graphRelationships.length ? (
          <div className="space-y-3 p-4">
            {result.answer.relationshipPath.map((path, index) => (
              <div className="rounded-md border border-[var(--border)] bg-white p-3" key={index}>
                <RelationshipChip label={path.label} />
                <p className="mt-2 text-sm text-[var(--muted)]">{path.detail}</p>
              </div>
            ))}
            {result.graphRelationships.map((relationship, index) => (
              <div className="rounded-md border border-[var(--border)] bg-white p-3" key={`${relationship.kind}-${index}`}>
                <RelationshipChip label={`${relationship.kind}: ${relationship.relationshipType}`} />
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {relationship.from} {"->"} {relationship.to}
                  {relationship.reason ? `: ${relationship.reason}` : ""}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4">
            <EmptyState
              title="No relationship path"
              description="No graph path was found for this query."
            />
          </div>
        )}
      </section>

      {result.answer.unsupportedClaims.length ? (
        <section className="rounded-md border border-[#fde68a] bg-[#fffbeb]">
          <SectionHeader title="Unsupported claims" />
          <ul className="space-y-2 p-4 text-sm text-[#92400e]">
            {result.answer.unsupportedClaims.map((claim) => (
              <li key={claim}>- {claim}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <Link
        className="inline-flex text-sm font-medium text-[var(--accent-strong)]"
        href={productRoute(result.product.id)}
      >
        Open product graph
      </Link>
    </>
  );
}

function ResultList({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
      <SectionHeader title={title} />
      {items.length ? (
        <ul className="space-y-2 p-4 text-sm leading-6 text-[var(--muted)]">
          {items.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      ) : (
        <div className="p-4">
          <EmptyState title={title} description={empty} />
        </div>
      )}
    </section>
  );
}

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

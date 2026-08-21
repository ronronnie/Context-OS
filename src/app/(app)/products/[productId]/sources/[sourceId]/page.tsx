import Link from "next/link";
import { notFound } from "next/navigation";

import { startSourceExtractionAction } from "@/app/actions/source-extraction";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { SourceChip } from "@/components/source-chip";
import { getSourceDetail } from "@/db/queries";
import { getRecentSourceExtractions } from "@/db/queries";
import { requireUser } from "@/lib/auth/session";
import {
  getFigmaMetadataRows,
  getFigmaSourceUrl,
  isFigmaSourceType,
} from "@/lib/source-ingestion/figma-metadata";
import { getSourceExtractionStatus } from "@/lib/source-ingestion/extraction";
import { getSourceTypeLabel } from "@/lib/source-ingestion/source-model";
import {
  featureRoute,
  moduleRoute,
  productRoute,
  sourceExtractionRoute,
} from "@/lib/routes";
import { Button } from "@/components/ui/button";

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ productId: string; sourceId: string }>;
}) {
  const user = await requireUser();
  const { productId, sourceId } = await params;
  const detail = await getSourceDetail(productId, sourceId, user.id);

  if (!detail) {
    notFound();
  }

  const extractionStatus = getSourceExtractionStatus();
  const recentExtractions = await getRecentSourceExtractions(
    productId,
    sourceId,
    user.id,
  );
  const startExtraction = startSourceExtractionAction.bind(null, productId, sourceId);
  const figmaMetadataRows = isFigmaSourceType(detail.source.sourceType)
    ? getFigmaMetadataRows(detail.source.metadata)
    : [];
  const figmaUrl = isFigmaSourceType(detail.source.sourceType)
    ? getFigmaSourceUrl(detail.source)
    : null;
  const connectedComponents = isFigmaSourceType(detail.source.sourceType)
    ? detail.knowledge.filter((knowledge) => knowledge.knowledgeType === "component")
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Source Evidence"
        title={detail.source.name}
        description="Sources preserve raw evidence and provenance. Linked knowledge remains a separate human-verifiable Product Memory object."
        actions={[]}
      />

      <nav className="text-sm text-[var(--muted)]" aria-label="Breadcrumb">
        <Link className="font-medium text-[var(--accent-strong)]" href={productRoute(productId)}>
          {detail.product.name}
        </Link>{" "}
        / Sources / {detail.source.name}
      </nav>

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
            <SectionHeader title="Source metadata" />
            <dl className="grid gap-3 p-4 text-sm">
              <MetaRow label="Type" value={getSourceTypeLabel(detail.source.sourceType)} />
              <MetaRow label="Product" value={detail.product.name} />
              <MetaRow
                label="Module"
                value={
                  detail.module ? (
                    <Link
                      className="font-medium text-[var(--accent-strong)]"
                      href={moduleRoute(productId, detail.module.id)}
                    >
                      {detail.module.name}
                    </Link>
                  ) : (
                    "Product-level"
                  )
                }
              />
              <MetaRow
                label="Feature"
                value={
                  detail.feature && detail.module ? (
                    <Link
                      className="font-medium text-[var(--accent-strong)]"
                      href={featureRoute(productId, detail.module.id, detail.feature.id)}
                    >
                      {detail.feature.name}
                    </Link>
                  ) : (
                    "No feature attachment"
                  )
                }
              />
              <MetaRow
                label="URL"
                value={
                  detail.source.url ? (
                    <a
                      className="break-all font-medium text-[var(--accent-strong)]"
                      href={detail.source.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {detail.source.url}
                    </a>
                  ) : (
                    "No URL"
                  )
                }
              />
              <MetaRow
                label="Created"
                value={detail.source.createdAt.toLocaleDateString()}
              />
            </dl>
          </section>

          <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
            <SectionHeader title="Extraction status" />
            <div className="space-y-3 p-4">
              <span className="inline-flex rounded-md border border-[#fde68a] bg-[#fef3c7] px-2 py-1 text-xs font-medium text-[#92400e]">
                {extractionStatus.label}
              </span>
              <p className="text-sm leading-6 text-[var(--muted)]">
                {extractionStatus.description}
              </p>
              <form action={startExtraction}>
                <Button type="submit">Extract Product Knowledge</Button>
              </form>
              {recentExtractions.length ? (
                <div className="space-y-2 border-t border-[var(--border)] pt-3">
                  <h2 className="text-xs font-semibold uppercase text-[var(--muted)]">
                    Recent review runs
                  </h2>
                  {recentExtractions.map((extraction) => (
                    <Link
                      className="block rounded-md border border-[var(--border)] bg-white p-2 text-sm hover:bg-[var(--panel-subtle)]"
                      href={sourceExtractionRoute(productId, sourceId, extraction.id)}
                      key={extraction.id}
                    >
                      {extraction.status} extraction from{" "}
                      {extraction.createdAt.toLocaleDateString()}
                    </Link>
                  ))}
                </div>
              ) : null}
              <pre className="max-h-72 overflow-auto rounded-md border border-[var(--border)] bg-white p-3 text-xs leading-5 text-[var(--muted-strong)]">
                {JSON.stringify(detail.extractionInput, null, 2)}
              </pre>
            </div>
          </section>

          {isFigmaSourceType(detail.source.sourceType) ? (
            <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
              <SectionHeader
                title="Figma reference"
                description="Manual Figma evidence for now. Future ingestion can use these identifiers without changing source records."
              />
              <div className="space-y-4 p-4">
                <dl className="grid gap-3 text-sm">
                  <MetaRow
                    label="URL"
                    value={
                      figmaUrl ? (
                        <a
                          className="break-all font-medium text-[var(--accent-strong)]"
                          href={figmaUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {figmaUrl}
                        </a>
                      ) : (
                        "No Figma URL"
                      )
                    }
                  />
                  {figmaMetadataRows.map((row) => (
                    <MetaRow key={row.key} label={row.label} value={row.value} />
                  ))}
                  <MetaRow
                    label="Feature"
                    value={
                      detail.feature && detail.module ? (
                        <Link
                          className="font-medium text-[var(--accent-strong)]"
                          href={featureRoute(
                            productId,
                            detail.module.id,
                            detail.feature.id,
                          )}
                        >
                          {detail.feature.name}
                        </Link>
                      ) : (
                        "No feature attachment"
                      )
                    }
                  />
                </dl>
                <div className="rounded-md border border-[var(--border)] bg-white p-3">
                  <h2 className="text-sm font-semibold">Connected components</h2>
                  {connectedComponents.length ? (
                    <div className="mt-2 space-y-2">
                      {connectedComponents.map((component) => (
                        <div key={component.id}>
                          <p className="text-sm font-medium">{component.title}</p>
                          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                            {component.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      No component Product Memory is linked to this Figma source yet.
                    </p>
                  )}
                </div>
              </div>
            </section>
          ) : null}

          <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
            <SectionHeader title="Audit trail" />
            {detail.auditTrail.length ? (
              <div className="divide-y divide-[var(--border)]">
                {detail.auditTrail.map((event) => (
                  <div className="p-4" key={event.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-[var(--panel-subtle)] px-2 py-1 text-xs font-medium">
                        {event.eventType.replaceAll("_", " ")}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {event.createdAt.toLocaleString()}
                      </span>
                    </div>
                    <h2 className="mt-2 text-sm font-semibold">{event.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      {event.summary || "No audit summary recorded."}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4">
                <EmptyState
                  title="No audit events yet"
                  description="Source creation and extraction review events will appear here."
                />
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
            <SectionHeader
              title="Raw content"
              description="This is source evidence, not a trusted memory claim."
            />
            <pre className="m-4 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-md border border-[var(--border)] bg-white p-4 text-sm leading-6">
              {detail.source.rawContent || "No raw content recorded."}
            </pre>
          </section>

          <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
            <SectionHeader title="Metadata" />
            <pre className="m-4 overflow-auto rounded-md border border-[var(--border)] bg-white p-4 text-xs leading-5">
              {JSON.stringify(detail.source.metadata, null, 2)}
            </pre>
          </section>

          <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
            <SectionHeader
              title="Connected knowledge"
              description="Claims linked through this source still carry their own authority, confidence, and lifecycle status."
            />
            {detail.knowledge.length ? (
              <div className="divide-y divide-[var(--border)]">
                {detail.knowledge.map((knowledge) => (
                  <div className="p-4" key={knowledge.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <SourceChip label={String(knowledge.knowledgeType).replaceAll("_", " ")} />
                      <span className="text-xs text-[var(--muted)]">
                        {knowledge.authority} authority
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {knowledge.confidence}% confidence
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {knowledge.lifecycleStatus}
                      </span>
                    </div>
                    <h2 className="mt-2 text-sm font-semibold">{knowledge.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      {knowledge.body}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4">
                <EmptyState
                  title="No linked knowledge yet"
                  description="Prompt 7 extraction will draft structured memory from this source for human verification."
                />
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-3">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="min-w-0 font-medium text-[var(--muted-strong)]">{value}</dd>
    </div>
  );
}

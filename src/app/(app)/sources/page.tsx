import Link from "next/link";

import { createSourceAction } from "@/app/actions/source-ingestion";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { SourceChip } from "@/components/source-chip";
import { Button } from "@/components/ui/button";
import { getSourceIngestionWorkspace } from "@/db/queries";
import { requireUser } from "@/lib/auth/session";
import { sourceRoute } from "@/lib/routes";
import {
  getSourceTypeLabel,
  sourceTypeOptions,
} from "@/lib/source-ingestion/source-model";

export default async function SourcesPage() {
  const user = await requireUser();
  const workspace = await getSourceIngestionWorkspace(user.id);
  const defaultProductId = workspace.products[0]?.id ?? "";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Evidence"
        title="Sources"
        description="Ingest fictional source material manually. Sources are evidence records; they do not become trusted Product Memory until linked claims are reviewed."
        actions={[]}
      />

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form
          action={createSourceAction}
          className="rounded-md border border-[var(--border)] bg-[var(--panel)]"
        >
          <SectionHeader
            title="Add source"
            description="Attach source evidence to a product, and optionally to a module or feature."
          />
          <div className="space-y-4 p-4">
            <label className="block">
              <span className="text-sm font-medium">Product</span>
              <select
                className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                defaultValue={defaultProductId}
                name="productId"
                required
              >
                {workspace.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Module</span>
                <select
                  className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                  name="moduleId"
                >
                  <option value="">Product-level source</option>
                  {workspace.products.flatMap((product) =>
                    product.modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {product.name} / {module.name}
                      </option>
                    )),
                  )}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium">Feature</span>
                <select
                  className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                  name="featureId"
                >
                  <option value="">No feature attachment</option>
                  {workspace.products.flatMap((product) =>
                    product.modules.flatMap((module) =>
                      module.features.map((feature) => (
                        <option key={feature.id} value={feature.id}>
                          {product.name} / {module.name} / {feature.name}
                        </option>
                      )),
                    ),
                  )}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Name</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                  name="name"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Source type</span>
                <select
                  className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                  name="sourceType"
                >
                  {sourceTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium">URL</span>
              <input
                className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                name="url"
                placeholder="Optional source locator"
                type="url"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Raw content</span>
              <textarea
                className="mt-1 min-h-44 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm leading-6 outline-none focus:ring-4 focus:ring-[#99f6e4]"
                name="rawContent"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Metadata JSON</span>
              <textarea
                className="mt-1 min-h-24 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 font-mono text-xs leading-5 outline-none focus:ring-4 focus:ring-[#99f6e4]"
                defaultValue={'{"fictional": true}'}
                name="metadata"
              />
            </label>

            <Button disabled={!workspace.products.length} type="submit">
              Save source
            </Button>
          </div>
        </form>

        <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
          <SectionHeader
            title="Recent sources"
            description="Open a source to inspect raw evidence, metadata, linked knowledge, and extraction readiness."
          />
          {workspace.sources.length ? (
            <div className="divide-y divide-[var(--border)]">
              {workspace.sources.map((source) => (
                <Link
                  className="block p-4 transition hover:bg-white"
                  href={sourceRoute(source.productId, source.id)}
                  key={source.id}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <SourceChip label={getSourceTypeLabel(source.sourceType)} />
                    <span className="text-xs text-[var(--muted)]">
                      {source.productName}
                    </span>
                    {source.moduleName ? (
                      <span className="text-xs text-[var(--muted)]">
                        {source.moduleName}
                      </span>
                    ) : null}
                    {source.featureName ? (
                      <span className="text-xs text-[var(--muted)]">
                        {source.featureName}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-sm font-semibold">{source.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                    {source.rawContent || "No raw content recorded."}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <EmptyState
                title="No sources yet"
                description="Add fictional source material before creating source-backed Product Memory."
              />
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

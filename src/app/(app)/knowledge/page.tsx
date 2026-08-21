import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { SourceChip } from "@/components/source-chip";
import { StatusBadge } from "@/components/status-badge";
import {
  getKnowledgeLibrary,
  getProductIntelligenceOptions,
} from "@/db/queries";
import { requireUser } from "@/lib/auth/session";
import {
  authorityOptions,
  knowledgeTypeOptions,
  lifecycleStatusOptions,
} from "@/lib/product-memory/knowledge-model";
import { knowledgeRoute, productRoute } from "@/lib/routes";
import {
  hasActiveKnowledgeFilters,
  parseKnowledgeFilters,
} from "@/lib/workflow/filters";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const filters = parseKnowledgeFilters(params);
  const [options, rows] = await Promise.all([
    getProductIntelligenceOptions(user.id),
    getKnowledgeLibrary(user.id, filters),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Product Memory"
        title="Knowledge"
        description="Filter verified, proposed, historical, and source-backed memory across products and features."
        actions={[]}
      />

      <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
        <SectionHeader title="Filters" />
        <form className="grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-6" method="GET">
          <SelectFilter
            label="Product"
            name="productId"
            options={options.products.map((product) => ({
              value: product.id,
              label: product.name,
            }))}
            value={filters.productId}
          />
          <SelectFilter
            label="Module"
            name="moduleId"
            options={options.modules.map((module) => ({
              value: module.id,
              label: module.name,
            }))}
            value={filters.moduleId}
          />
          <SelectFilter
            label="Feature"
            name="featureId"
            options={options.features.map((feature) => ({
              value: feature.id,
              label: feature.name,
            }))}
            value={filters.featureId}
          />
          <SelectFilter
            label="Type"
            name="knowledgeType"
            options={knowledgeTypeOptions}
            value={filters.knowledgeType}
          />
          <SelectFilter
            label="Lifecycle"
            name="lifecycleStatus"
            options={lifecycleStatusOptions}
            value={filters.lifecycleStatus}
          />
          <SelectFilter
            label="Authority"
            name="authority"
            options={authorityOptions}
            value={filters.authority}
          />
          <div className="flex items-end gap-2 md:col-span-3 xl:col-span-6">
            <button className="inline-flex h-9 items-center rounded-md border border-[var(--accent)] bg-[var(--accent)] px-3 text-sm font-medium text-white">
              Apply filters
            </button>
            {hasActiveKnowledgeFilters(filters) ? (
              <Link
                className="inline-flex h-9 items-center rounded-md border border-[var(--border)] bg-white px-3 text-sm font-medium"
                href="/knowledge"
              >
                Clear
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
        <SectionHeader
          title="Knowledge library"
          description={`${rows.length} item${rows.length === 1 ? "" : "s"} shown`}
        />
        {rows.length ? (
          <div className="divide-y divide-[var(--border)]">
            {rows.map((row) => {
              const item = row.knowledge;
              const href = item.moduleId && item.featureId
                ? knowledgeRoute(
                    item.productId,
                    item.moduleId,
                    item.featureId,
                    item.id,
                  )
                : productRoute(item.productId);

              return (
                <Link
                  className="block p-4 transition hover:bg-white"
                  href={href}
                  key={item.id}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.lifecycleStatus} />
                    <SourceChip label={item.knowledgeType.replaceAll("_", " ")} />
                    <span className="text-xs text-[var(--muted)]">
                      {item.authority} authority
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      {item.confidence}% confidence
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      {row.sourceCount} sources
                    </span>
                  </div>
                  <h2 className="mt-2 text-sm font-semibold">{item.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                    {item.body}
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {row.productName}
                    {row.moduleName ? ` / ${row.moduleName}` : ""}
                    {row.featureName ? ` / ${row.featureName}` : ""}
                  </p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-4">
            <EmptyState
              title="No matching knowledge"
              description="Adjust filters or add Product Memory from a feature workspace."
            />
          </div>
        )}
      </section>
    </div>
  );
}

function SelectFilter({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value?: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <select
        className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
        defaultValue={value ?? ""}
        name={name}
      >
        <option value="">Any</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

import { ArrowRight, Database, FileCheck2, Sparkles } from "lucide-react";
import Link from "next/link";

import { ConfidenceIndicator } from "@/components/confidence-indicator";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import { TimelineRow } from "@/components/timeline-row";
import { PRODUCT_PROMISE } from "@/config/product";
import { dashboardStats, demoProduct, timelineRows } from "@/lib/app-data";

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Product Memory control center"
        description={PRODUCT_PROMISE}
        actions={[{ label: "Create task" }, { label: "Add source" }]}
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-md border border-[var(--border)] bg-[var(--panel)] p-4"
          >
            <p className="text-sm font-medium text-[var(--muted)]">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{stat.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
          <SectionHeader
            title="Recent memory activity"
            description="Contradictions and unverified claims stay visible until reviewed."
          />
          <div>
            {timelineRows.map((row) => (
              <TimelineRow key={row.title} {...row} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-md border border-[var(--border)] bg-[var(--panel)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--muted)]">Current product</p>
                <h2 className="mt-1 text-lg font-semibold">{demoProduct.name}</h2>
              </div>
              <StatusBadge status="current" />
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {demoProduct.description}
            </p>
            <Link
              href={`/products/${demoProduct.slug}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent-strong)]"
            >
              Open product detail
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div className="rounded-md border border-[var(--border)] bg-[var(--panel)] p-4">
            <div className="mb-4 flex items-center gap-2">
              <Database className="h-4 w-4 text-[var(--accent)]" aria-hidden />
              <h2 className="font-semibold">Memory health</h2>
            </div>
            <div className="space-y-4">
              <ConfidenceIndicator label="Authority coverage" value={78} />
              <ConfidenceIndicator label="Source-backed claims" value={84} tone="blue" />
              <ConfidenceIndicator label="Review backlog risk" value={31} tone="amber" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-[var(--border)] bg-[var(--panel)] p-4">
              <FileCheck2 className="h-4 w-4 text-[var(--blue)]" aria-hidden />
              <p className="mt-3 text-sm font-medium">Verify AI drafts</p>
            </div>
            <div className="rounded-md border border-[var(--border)] bg-[var(--panel)] p-4">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" aria-hidden />
              <p className="mt-3 text-sm font-medium">Generate Context Pack</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

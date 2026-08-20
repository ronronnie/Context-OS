import { ActionMenu } from "@/components/action-menu";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RelationshipChip } from "@/components/relationship-chip";
import { SectionHeader } from "@/components/section-header";
import { SourceChip } from "@/components/source-chip";
import { StatusBadge } from "@/components/status-badge";
import type { RouteContent } from "@/types/app";

export function PageScaffold({ config }: { config: RouteContent }) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        actions={[{ label: config.primaryAction }]}
      />

      <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
        <SectionHeader
          title={`${config.title} workspace`}
          description="Structured workspace scaffold for the production MVP."
        />
        <div className="divide-y divide-[var(--border)]">
          {config.sections.map((section) => (
            <article
              key={section.title}
              className="grid gap-4 p-4 lg:grid-cols-[1fr_140px_40px]"
            >
              <div>
                <h2 className="font-medium">{section.title}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  {section.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {section.chips.map((chip) =>
                    chip.toLowerCase().includes("source") ||
                    chip.includes("ADR") ||
                    chip.includes("POL") ? (
                      <SourceChip key={chip} label={chip} />
                    ) : (
                      <RelationshipChip key={chip} label={chip} />
                    ),
                  )}
                </div>
              </div>
              <div>
                <StatusBadge status={section.status} />
              </div>
              <ActionMenu label={`${section.title} actions`} />
            </article>
          ))}
        </div>
      </section>

      <EmptyState
        title={config.emptyTitle}
        description={config.emptyDescription}
        actionLabel="Create structured memory"
      />
    </div>
  );
}

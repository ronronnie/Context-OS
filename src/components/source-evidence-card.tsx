import { SourceChip } from "@/components/source-chip";
import { TrustLabel } from "@/components/trust-label";
import type { Source } from "@/db/schema";
import {
  buildEvidenceDisplay,
  getTrustLabel,
} from "@/lib/evidence/evidence-model";

export function SourceEvidenceCard({
  source,
  fallbackAuthority,
  lifecycleStatus,
}: {
  source: Source;
  fallbackAuthority?: string;
  lifecycleStatus?: string | null;
}) {
  const evidence = buildEvidenceDisplay(source, fallbackAuthority);
  const trustLabel = getTrustLabel({
    authority: evidence.authority,
    lifecycleStatus,
  });

  return (
    <article className="rounded-md border border-[var(--border)] bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <SourceChip label={evidence.sourceType} />
        <TrustLabel label={trustLabel} />
        <span className="text-xs text-[var(--muted)]">
          Created {evidence.createdAt.toLocaleDateString()}
        </span>
      </div>
      <h3 className="mt-2 text-sm font-medium">{evidence.sourceName}</h3>
      {evidence.sourceUrl ? (
        <a
          className="mt-1 block break-all text-xs font-medium text-[var(--accent-strong)]"
          href={evidence.sourceUrl}
          rel="noreferrer"
          target="_blank"
        >
          {evidence.sourceUrl}
        </a>
      ) : null}
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        {evidence.evidenceText}
      </p>
      <dl className="mt-3 grid gap-2 border-t border-[var(--border)] pt-3 text-xs sm:grid-cols-2">
        <EvidenceMeta label="Authority" value={evidence.authority} />
        <EvidenceMeta label="Source ID" value={evidence.sourceId} />
      </dl>
    </article>
  );
}

function EvidenceMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-medium text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 truncate text-[var(--muted-strong)]">{value}</dd>
    </div>
  );
}

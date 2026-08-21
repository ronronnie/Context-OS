import type { Source } from "@/db/schema";

const evidenceExcerptLength = 360;

export type EvidenceDisplay = {
  sourceId: string;
  sourceType: string;
  sourceName: string;
  sourceUrl: string | null;
  evidenceText: string;
  createdAt: Date;
  authority: string;
};

export function buildEvidenceDisplay(
  source: Source,
  fallbackAuthority = "unverified",
): EvidenceDisplay {
  return {
    sourceId: source.id,
    sourceType: source.sourceType,
    sourceName: source.name,
    sourceUrl: source.url,
    evidenceText: getEvidenceText(source),
    createdAt: source.createdAt,
    authority: getSourceAuthority(source.metadata, fallbackAuthority),
  };
}

export function getEvidenceText(source: Pick<Source, "rawContent" | "metadata">) {
  const supportingText = source.metadata["supportingText"];
  if (typeof supportingText === "string" && supportingText.trim()) {
    return truncateEvidence(supportingText);
  }

  const excerpt = source.metadata["excerpt"];
  if (typeof excerpt === "string" && excerpt.trim()) {
    return truncateEvidence(excerpt);
  }

  if (source.rawContent?.trim()) {
    return truncateEvidence(source.rawContent);
  }

  return "No excerpt stored for this source.";
}

export function getSourceAuthority(
  metadata: Record<string, unknown>,
  fallbackAuthority = "unverified",
) {
  const authority = metadata["authority"] ?? metadata["sourceAuthority"];
  return typeof authority === "string" && authority.trim()
    ? authority
    : fallbackAuthority;
}

export function formatSourceEvidenceReference(source: Source) {
  const created = source.createdAt.toLocaleDateString();
  const date = getSourceDate(source.metadata);
  const url = source.url ? `, ${source.url}` : "";
  const sourceDate = date ? `, source date ${date}` : "";

  return `${source.name} (${source.sourceType}, created ${created}${sourceDate}${url})`;
}

export function getTrustLabel(input: {
  lifecycleStatus?: string | null;
  authority?: string | null;
}) {
  if (input.lifecycleStatus === "verified") {
    return input.authority === "canonical" ? "Canonical" : "Verified";
  }
  if (input.lifecycleStatus === "proposed") {
    return "Proposed";
  }
  if (input.lifecycleStatus === "outdated") {
    return "Outdated";
  }
  if (input.lifecycleStatus === "rejected") {
    return "Rejected";
  }
  if (input.authority === "canonical") {
    return "Canonical";
  }

  return "Unverified";
}

function getSourceDate(metadata: Source["metadata"]) {
  const value = metadata["sourceDate"] ?? metadata["rejectedAt"];
  return typeof value === "string" ? value : null;
}

function truncateEvidence(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= evidenceExcerptLength) {
    return normalized;
  }

  return `${normalized.slice(0, evidenceExcerptLength - 1).trim()}...`;
}

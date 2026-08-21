import type { sourceExtractionCandidates } from "@/db/schema/index";
import type { Authority } from "@/lib/product-memory/knowledge-model";

export type ConflictType =
  | "contradiction"
  | "supersedes"
  | "duplicate"
  | "historical_as_current"
  | "authority_mismatch";

export type ExistingKnowledgeForConflict = {
  id: string;
  title: string;
  body: string;
  knowledgeType: string;
  authority: Authority;
  lifecycleStatus: string;
  lastVerifiedAt: Date | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
  featureId?: string | null;
  moduleId?: string | null;
};

export type CandidateForConflict = Pick<
  typeof sourceExtractionCandidates.$inferSelect,
  | "id"
  | "title"
  | "body"
  | "knowledgeType"
  | "suggestedAuthority"
  | "confidence"
  | "appearsHistorical"
  | "possibleConflicts"
>;

export type DetectedKnowledgeConflict = {
  existingKnowledgeItemId: string;
  conflictType: ConflictType;
  summary: string;
  metadata: Record<string, unknown>;
};

export type ConflictResolution =
  | "replace_existing"
  | "keep_both"
  | "mark_existing_outdated"
  | "reject_new";

const authorityRank: Record<Authority, number> = {
  canonical: 5,
  high: 4,
  medium: 3,
  low: 2,
  unverified: 1,
};

export function detectKnowledgeConflicts(
  candidate: CandidateForConflict,
  existingKnowledge: ExistingKnowledgeForConflict[],
) {
  const conflicts: DetectedKnowledgeConflict[] = [];

  for (const existing of existingKnowledge) {
    if (existing.lifecycleStatus !== "verified") {
      continue;
    }

    const overlap = textOverlapScore(candidate, existing);
    const numericChange = detectNumericChange(candidate.body, existing.body);

    if (numericChange && overlap >= 0.18) {
      conflicts.push({
        existingKnowledgeItemId: existing.id,
        conflictType: candidateLooksNewer(candidate.body) ? "supersedes" : "contradiction",
        summary: numericChange.summary,
        metadata: { overlap, ...numericChange },
      });
      continue;
    }

    if (
      candidate.possibleConflicts.length > 0 &&
      overlap >= 0.18
    ) {
      conflicts.push({
        existingKnowledgeItemId: existing.id,
        conflictType: "contradiction",
        summary: candidate.possibleConflicts[0],
        metadata: { overlap },
      });
      continue;
    }

    if (
      candidate.appearsHistorical &&
      isCurrentStateType(candidate.knowledgeType) &&
      overlap >= 0.12
    ) {
      conflicts.push({
        existingKnowledgeItemId: existing.id,
        conflictType: "historical_as_current",
        summary:
          "Candidate appears historical but is shaped like current product memory.",
        metadata: { overlap },
      });
      continue;
    }

    if (
      overlap >= 0.22 &&
      authorityRank[candidate.suggestedAuthority] < authorityRank[existing.authority]
    ) {
      conflicts.push({
        existingKnowledgeItemId: existing.id,
        conflictType: "authority_mismatch",
        summary:
          "Candidate has lower suggested authority than existing verified memory.",
        metadata: {
          overlap,
          existingAuthority: existing.authority,
          candidateAuthority: candidate.suggestedAuthority,
        },
      });
    }

    if (isDuplicate(candidate, existing, overlap)) {
      conflicts.push({
        existingKnowledgeItemId: existing.id,
        conflictType: "duplicate",
        summary: "Candidate appears to duplicate existing verified memory.",
        metadata: { overlap },
      });
      continue;
    }
  }

  return conflicts;
}

export function canApproveCandidateWithConflicts(
  unresolvedConflictCount: number,
) {
  return unresolvedConflictCount === 0;
}

export function getConflictResolutionEffect(resolution: ConflictResolution) {
  const effects = {
    replace_existing: {
      approveNew: true,
      markExistingOutdated: true,
      relationshipType: "supersedes",
      preservesExistingHistory: true,
    },
    keep_both: {
      approveNew: true,
      markExistingOutdated: false,
      relationshipType: "related_to",
      preservesExistingHistory: true,
    },
    mark_existing_outdated: {
      approveNew: true,
      markExistingOutdated: true,
      relationshipType: "supersedes",
      preservesExistingHistory: true,
    },
    reject_new: {
      approveNew: false,
      markExistingOutdated: false,
      relationshipType: null,
      preservesExistingHistory: true,
    },
  } satisfies Record<ConflictResolution, {
    approveNew: boolean;
    markExistingOutdated: boolean;
    relationshipType: string | null;
    preservesExistingHistory: boolean;
  }>;

  return effects[resolution];
}

export function historicalKnowledgeRemainsQueryable(lifecycleStatus: string) {
  return ["verified", "outdated", "rejected"].includes(lifecycleStatus);
}

function isDuplicate(
  candidate: CandidateForConflict,
  existing: ExistingKnowledgeForConflict,
  overlap: number,
) {
  return (
    normalize(candidate.title) === normalize(existing.title) ||
    (candidate.knowledgeType === existing.knowledgeType && overlap >= 0.72)
  );
}

function detectNumericChange(candidateBody: string, existingBody: string) {
  const candidateNumbers = extractNumbers(candidateBody);
  const existingNumbers = extractNumbers(existingBody);

  for (const candidateNumber of candidateNumbers) {
    for (const existingNumber of existingNumbers) {
      if (candidateNumber !== existingNumber) {
        return {
          existingNumber,
          candidateNumber,
          summary: `Candidate says ${candidateNumber}; existing memory says ${existingNumber}.`,
        };
      }
    }
  }

  return null;
}

function extractNumbers(value: string) {
  return Array.from(value.matchAll(/\b\d+(?:\.\d+)?\b/g)).map((match) =>
    Number(match[0]),
  );
}

function candidateLooksNewer(value: string) {
  return /\b(now|currently|new|updated|supports|changed|increased|decreased)\b/i.test(
    value,
  );
}

function isCurrentStateType(type: string) {
  return ["current_behaviour", "product_rule", "business_rule"].includes(type);
}

function textOverlapScore(
  candidate: CandidateForConflict,
  existing: ExistingKnowledgeForConflict,
) {
  const candidateTokens = new Set(tokenize(`${candidate.title} ${candidate.body}`));
  const existingTokens = new Set(tokenize(`${existing.title} ${existing.body}`));

  if (!candidateTokens.size || !existingTokens.size) {
    return 0;
  }

  const shared = Array.from(candidateTokens).filter((token) =>
    existingTokens.has(token),
  ).length;

  return shared / Math.min(candidateTokens.size, existingTokens.size);
}

function tokenize(value: string) {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const stopWords = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "only",
  "can",
  "cannot",
  "not",
  "are",
  "was",
  "were",
  "has",
  "have",
]);

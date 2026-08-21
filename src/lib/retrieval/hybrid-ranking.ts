import type { KnowledgeItem } from "@/db/schema";

export type RetrievalCandidate = {
  knowledgeItem: KnowledgeItem;
  semanticScore: number;
  primaryFeatureId?: string;
  primaryModuleId?: string;
  relatedFeatureIds?: string[];
  relationshipPath?: string;
  now?: Date;
};

export type RetrievalDiagnostics = {
  semanticScore: number;
  authorityAdjustment: number;
  relationshipAdjustment: number;
  lifecycleAdjustment: number;
  proximityAdjustment: number;
  intentAdjustment: number;
  recencyAdjustment: number;
  finalScore: number;
  reasonIncluded: string;
};

export type RankedRetrievalResult = {
  knowledgeItem: KnowledgeItem;
  semanticScore: number;
  finalScore: number;
  reasonForInclusion: string;
  relationshipPath: string | null;
  diagnostics?: RetrievalDiagnostics;
};

export function rankRetrievedKnowledgeCandidates(
  taskDescription: string,
  candidates: RetrievalCandidate[],
  includeDiagnostics = process.env.NODE_ENV === "development",
) {
  return candidates
    .map((candidate) => rankCandidate(taskDescription, candidate, includeDiagnostics))
    .sort((a, b) => b.finalScore - a.finalScore);
}

function rankCandidate(
  taskDescription: string,
  candidate: RetrievalCandidate,
  includeDiagnostics: boolean,
): RankedRetrievalResult {
  const knowledge = candidate.knowledgeItem;
  const authorityAdjustment = getAuthorityAdjustment(knowledge.authority);
  const relationshipAdjustment = candidate.relationshipPath ? 0.12 : 0;
  const lifecycleAdjustment = getLifecycleAdjustment(
    knowledge.lifecycleStatus,
    knowledge.knowledgeType,
    taskDescription,
  );
  const proximityAdjustment = getProximityAdjustment(candidate);
  const intentAdjustment = getIntentAdjustment(taskDescription, knowledge);
  const recencyAdjustment = getRecencyAdjustment(knowledge.lastVerifiedAt, candidate.now);
  const finalScore = clampScore(
    candidate.semanticScore +
      authorityAdjustment +
      relationshipAdjustment +
      lifecycleAdjustment +
      proximityAdjustment +
      intentAdjustment +
      recencyAdjustment,
  );
  const reasonIncluded = buildReason(taskDescription, knowledge, candidate);
  const diagnostics = {
    semanticScore: candidate.semanticScore,
    authorityAdjustment,
    relationshipAdjustment,
    lifecycleAdjustment,
    proximityAdjustment,
    intentAdjustment,
    recencyAdjustment,
    finalScore,
    reasonIncluded,
  };

  return {
    knowledgeItem: knowledge,
    semanticScore: roundScore(candidate.semanticScore),
    finalScore: roundScore(finalScore),
    reasonForInclusion: reasonIncluded,
    relationshipPath: candidate.relationshipPath ?? null,
    diagnostics: includeDiagnostics ? diagnostics : undefined,
  };
}

function getAuthorityAdjustment(authority: KnowledgeItem["authority"]) {
  switch (authority) {
    case "canonical":
      return 0.15;
    case "high":
      return 0.1;
    case "medium":
      return 0.04;
    case "low":
      return -0.04;
    case "unverified":
      return -0.1;
  }
}

function getLifecycleAdjustment(
  lifecycleStatus: KnowledgeItem["lifecycleStatus"],
  knowledgeType: KnowledgeItem["knowledgeType"],
  taskDescription: string,
) {
  if (lifecycleStatus === "verified") {
    return 0.14;
  }
  if (lifecycleStatus === "outdated") {
    return taskLooksHistorical(taskDescription) ? 0.04 : -0.05;
  }
  if (lifecycleStatus === "rejected" && knowledgeType === "rejected_approach") {
    return taskLooksHistorical(taskDescription) ? 0.08 : 0.04;
  }

  return -0.14;
}

function getProximityAdjustment(candidate: RetrievalCandidate) {
  const featureId = candidate.knowledgeItem.featureId;
  if (!candidate.primaryFeatureId || !featureId) {
    return 0;
  }
  if (featureId === candidate.primaryFeatureId) {
    return 0.18;
  }
  if (candidate.relatedFeatureIds?.includes(featureId)) {
    return 0.12;
  }
  if (
    candidate.primaryModuleId &&
    candidate.knowledgeItem.moduleId === candidate.primaryModuleId
  ) {
    return 0.06;
  }

  return 0;
}

function getIntentAdjustment(taskDescription: string, knowledge: KnowledgeItem) {
  const task = normalize(taskDescription);
  const memory = normalize(`${knowledge.title} ${knowledge.body}`);
  const overlap = getTokenOverlap(task, memory);
  let adjustment = Math.min(overlap * 0.015, 0.12);

  if (task.includes("approval") && knowledge.knowledgeType === "permission") {
    adjustment += 0.08;
  }
  if (
    (task.includes("bulk") || task.includes("limit")) &&
    knowledge.knowledgeType === "technical_constraint"
  ) {
    adjustment += 0.08;
  }
  if (
    (task.includes("design") || task.includes("pattern") || task.includes("bulk")) &&
    (knowledge.knowledgeType === "ux_pattern" ||
      knowledge.knowledgeType === "component")
  ) {
    adjustment += 0.07;
  }
  if (taskLooksHistorical(task) && knowledge.knowledgeType === "rejected_approach") {
    adjustment += 0.09;
  }

  return Math.min(adjustment, 0.2);
}

function getRecencyAdjustment(lastVerifiedAt: Date | null, now = new Date()) {
  if (!lastVerifiedAt) {
    return 0;
  }

  const ageMs = now.getTime() - lastVerifiedAt.getTime();
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;

  return ageMs >= 0 && ageMs <= oneYearMs ? 0.03 : 0;
}

function buildReason(
  taskDescription: string,
  knowledge: KnowledgeItem,
  candidate: RetrievalCandidate,
) {
  if (knowledge.knowledgeType === "technical_constraint") {
    return "Relevant technical constraint for the requested product change.";
  }
  if (knowledge.knowledgeType === "permission") {
    return "Relevant permission rule for the requested workflow.";
  }
  if (knowledge.knowledgeType === "component") {
    return "Relevant component pattern connected to the requested work.";
  }
  if (knowledge.knowledgeType === "rejected_approach") {
    return "Rejected historical approach that may affect the proposed change.";
  }
  if (candidate.relationshipPath) {
    return `Included through Product Graph relationship: ${candidate.relationshipPath}.`;
  }
  if (taskDescription.toLowerCase().includes("design")) {
    return "Relevant Product Memory for the requested design task.";
  }

  return "Relevant Product Memory for the requested task.";
}

function getTokenOverlap(a: string, b: string) {
  const aTokens = new Set(tokenize(a));
  const bTokens = new Set(tokenize(b));
  let overlap = 0;

  for (const token of aTokens) {
    if (bTokens.has(token)) {
      overlap += 1;
    }
  }

  return overlap;
}

function taskLooksHistorical(value: string) {
  const normalized = normalize(value);
  return [
    "change",
    "changing",
    "replace",
    "rejected",
    "avoid",
    "history",
    "previous",
    "existing",
    "toolbar",
  ].some((token) => normalized.includes(token));
}

function tokenize(value: string) {
  return normalize(value)
    .split(/\W+/)
    .filter((token) => token.length > 2);
}

function normalize(value: string) {
  return value.toLowerCase();
}

function clampScore(value: number) {
  return Math.max(0, Math.min(1, value));
}

function roundScore(value: number) {
  return Math.round(value * 1000) / 1000;
}

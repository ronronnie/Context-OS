import {
  compileContextPack,
  getContextPackMetadata,
} from "@/lib/context-packs/compiler";
import {
  seedFeatureRelationships,
  seedFeatures,
  seedKnowledge,
  seedKnowledgeRelationships,
  seedModules,
  seedProduct,
  seedSources,
} from "@/db/seed-data";
import type { Feature, KnowledgeItem, Module, Product, Source } from "@/db/schema";
import {
  rankRetrievedKnowledgeCandidates,
  type RankedRetrievalResult,
  type RetrievalCandidate,
} from "@/lib/retrieval/hybrid-ranking";

const productId = "nextzen-demo-eval";
const userId = "nextzen-evaluator";
const now = new Date("2026-08-21T00:00:00.000Z");

export type EvaluationCase = {
  id: string;
  title: string;
  taskDescription: string;
  taskIntent: "design" | "build" | "research" | "audit";
  primaryFeatureKey?: string;
  expectedIncludedTitles: string[];
  expectedExcludedTitles: string[];
  requiredSourceKeys: string[];
  expectedWarnings: Array<"outdated" | "conflict" | "rejected">;
};

export type EvaluationResult = {
  case: EvaluationCase;
  selectedTitles: string[];
  missingExpectedTitles: string[];
  unexpectedIncludedTitles: string[];
  missingRequiredSourceKeys: string[];
  expectedItemRecall: number;
  unexpectedItemCount: number;
  sourceEvidenceCoverage: number;
  surfacedWarnings: string[];
  outdatedConflictSurfacingPass: boolean;
  tenantIsolationPass: boolean;
  contextPack: string;
};

export type EvaluationSummary = {
  results: EvaluationResult[];
  passed: boolean;
  averageExpectedItemRecall: number;
  totalUnexpectedItemCount: number;
  averageSourceEvidenceCoverage: number;
  tenantIsolationPass: boolean;
};

export const nextzenEvaluationCases: EvaluationCase[] = [
  {
    id: "bulk-progress-report-approval",
    title: "Add bulk approval to Progress Report Review",
    taskDescription:
      "Design a bulk approval workflow for Progress Report Review. Preserve approval permissions, correction gates, API limits, existing bulk action patterns, and known rejected toolbar approaches.",
    taskIntent: "design",
    primaryFeatureKey: "review-progress-report",
    expectedIncludedTitles: [
      "Progress Report Review reuses Application Review patterns",
      "Application Review bulk action pattern",
      "BulkActionBar is canonical bulk component",
      "ConfirmationModal is required for approvals",
      "Bulk mutation limit is 100 records",
      "Rejected persistent toolbar approach",
    ],
    expectedExcludedTitles: [
      "Payment readiness is not an approval status",
      "Amendments pause payment readiness",
    ],
    requiredSourceKeys: [
      "bulk-review-design-critique-note",
      "bulk-operations-engineering-constraint-note",
      "design-system-bulk-pattern-note",
    ],
    expectedWarnings: ["rejected", "conflict"],
  },
  {
    id: "report-correction-request-flow",
    title: "Redesign report correction request flow",
    taskDescription:
      "Redesign Request Corrections so reviewers can target report sections, preserve prior correction history, and explain what grantees must change.",
    taskIntent: "design",
    primaryFeatureKey: "request-corrections",
    expectedIncludedTitles: [
      "Request Corrections reopens targeted sections",
      "Correction requests must include reviewer note",
      "Progress report review keeps evidence visible",
      "Compliance restrictions block invalid approvals",
    ],
    expectedExcludedTitles: [
      "Bulk mutation limit is 100 records",
      "Rejected persistent toolbar approach",
    ],
    requiredSourceKeys: ["progress-reporting-requirements-note"],
    expectedWarnings: [],
  },
  {
    id: "confirmation-modal-pattern",
    title: "Change confirmation modal pattern",
    taskDescription:
      "Change the approval ConfirmationModal pattern and assess which product rules, components, and bulk workflows are affected.",
    taskIntent: "design",
    primaryFeatureKey: "confirmation-modal",
    expectedIncludedTitles: [
      "ConfirmationModal is required for approvals",
      "ConfirmationModal names impacted records",
      "Standardized confirmation modal copy",
      "Approval permissions are role-limited",
      "Bulk approval needs skipped-record explanation",
    ],
    expectedExcludedTitles: [
      "Payment readiness is not an approval status",
      "Amendments pause payment readiness",
    ],
    requiredSourceKeys: [
      "design-system-bulk-pattern-note",
      "nextzen-release-2026-06-note",
    ],
    expectedWarnings: [],
  },
  {
    id: "increase-bulk-operation-limit",
    title: "Increase bulk operation limit",
    taskDescription:
      "Evaluate increasing the bulk operation limit above 100 records and identify current constraints, old limits, and affected workflows.",
    taskIntent: "audit",
    primaryFeatureKey: "bulk-review",
    expectedIncludedTitles: [
      "Bulk mutation limit is 100 records",
      "Old bulk API limit was 50 records",
      "Bulk operation limit increased to 100 records",
      "Reviewer assignment uses same bulk limit",
      "Bulk review returns per-record errors",
    ],
    expectedExcludedTitles: [
      "Payment readiness is not an approval status",
    ],
    requiredSourceKeys: [
      "bulk-operations-engineering-constraint-note",
      "nextzen-release-2026-06-note",
    ],
    expectedWarnings: ["outdated"],
  },
  {
    id: "compare-application-progress-review",
    title: "Compare Application Review and Progress Report Review",
    taskDescription:
      "Compare Application Review bulk workflows with Progress Report Review and identify reusable patterns, constraints, and differences.",
    taskIntent: "research",
    primaryFeatureKey: "review-progress-report",
    expectedIncludedTitles: [
      "Progress Report Review reuses Application Review patterns",
      "Application Review bulk action pattern",
      "Application List supports row selection",
      "Mixed selections preserve eligible actions",
      "Progress report review keeps evidence visible",
    ],
    expectedExcludedTitles: [
      "Payment readiness is not an approval status",
    ],
    requiredSourceKeys: [
      "bulk-review-design-critique-note",
      "reviewer-research-summary",
      "progress-reporting-requirements-note",
    ],
    expectedWarnings: [],
  },
  {
    id: "outdated-bulk-api-knowledge",
    title: "Identify outdated bulk API knowledge",
    taskDescription:
      "Audit bulk API knowledge and identify what old limit was replaced by the current limit.",
    taskIntent: "audit",
    primaryFeatureKey: "bulk-review",
    expectedIncludedTitles: [
      "Old bulk API limit was 50 records",
      "Bulk mutation limit is 100 records",
      "Bulk operation limit increased to 100 records",
    ],
    expectedExcludedTitles: [
      "Payment readiness is not an approval status",
    ],
    requiredSourceKeys: [
      "bulk-operations-engineering-constraint-note",
      "nextzen-release-2026-06-note",
    ],
    expectedWarnings: ["outdated"],
  },
  {
    id: "avoid-persistent-bulk-toolbar",
    title: "Ask why persistent bulk toolbar should not be used",
    taskDescription:
      "Explain why a persistent bulk toolbar should not be used and what contextual bulk pattern should replace it.",
    taskIntent: "research",
    primaryFeatureKey: "bulk-review",
    expectedIncludedTitles: [
      "Rejected persistent toolbar approach",
      "Bulk controls stay contextual by decision",
      "Application Review bulk action pattern",
      "BulkActionBar appears after selection",
    ],
    expectedExcludedTitles: [
      "Payment readiness is not an approval status",
    ],
    requiredSourceKeys: [
      "bulk-review-design-critique-note",
      "reviewer-research-summary",
      "design-system-bulk-pattern-note",
    ],
    expectedWarnings: ["rejected", "conflict"],
  },
];

export function runNextzenEvaluation(cases = nextzenEvaluationCases): EvaluationSummary {
  const results = cases.map(evaluateNextzenCase);
  const averageExpectedItemRecall = average(
    results.map((result) => result.expectedItemRecall),
  );
  const averageSourceEvidenceCoverage = average(
    results.map((result) => result.sourceEvidenceCoverage),
  );
  const totalUnexpectedItemCount = results.reduce(
    (sum, result) => sum + result.unexpectedItemCount,
    0,
  );
  const tenantIsolationPass = results.every((result) => result.tenantIsolationPass);

  return {
    results,
    passed: results.every(isPassingResult),
    averageExpectedItemRecall,
    totalUnexpectedItemCount,
    averageSourceEvidenceCoverage,
    tenantIsolationPass,
  };
}

export function evaluateNextzenCase(evaluationCase: EvaluationCase): EvaluationResult {
  const graph = buildEvaluationGraph();
  const primaryFeature = evaluationCase.primaryFeatureKey
    ? graph.featuresByKey.get(evaluationCase.primaryFeatureKey)
    : undefined;
  const relatedFeatureIds = primaryFeature
    ? getRelatedFeatureIds(primaryFeature.id, graph)
    : [];
  const relationshipPaths = getRelationshipPaths(graph.knowledgeByTitle);
  const candidates: RetrievalCandidate[] = [
    ...graph.knowledge.map((knowledge) => ({
      knowledgeItem: knowledge,
      semanticScore: getLexicalScore(
        evaluationCase.taskDescription,
        `${knowledge.title} ${knowledge.body}`,
      ),
      primaryFeatureId: primaryFeature?.id,
      primaryModuleId: primaryFeature?.moduleId,
      relatedFeatureIds,
      relationshipPath: relationshipPaths.get(knowledge.title),
      now,
    })),
    foreignTenantCandidate(evaluationCase.taskDescription),
  ];
  const selected = rankRetrievedKnowledgeCandidates(
    evaluationCase.taskDescription,
    candidates.filter((candidate) => candidate.knowledgeItem.productId === productId),
    true,
  ).slice(0, 12);
  const selectedTitles = selected.map((result) => result.knowledgeItem.title);
  const missingExpectedTitles = evaluationCase.expectedIncludedTitles.filter(
    (title) => !selectedTitles.includes(title),
  );
  const unexpectedIncludedTitles = evaluationCase.expectedExcludedTitles.filter(
    (title) => selectedTitles.includes(title),
  );
  const selectedSourceKeys = getSelectedSourceKeys(selected, graph);
  const missingRequiredSourceKeys = evaluationCase.requiredSourceKeys.filter(
    (sourceKey) => !selectedSourceKeys.has(sourceKey),
  );
  const surfacedWarnings = getSurfacedWarnings(selected);
  const contextPack = compileEvaluationPack(evaluationCase, selected, graph, primaryFeature);

  return {
    case: evaluationCase,
    selectedTitles,
    missingExpectedTitles,
    unexpectedIncludedTitles,
    missingRequiredSourceKeys,
    expectedItemRecall: getRatio(
      evaluationCase.expectedIncludedTitles.length - missingExpectedTitles.length,
      evaluationCase.expectedIncludedTitles.length,
    ),
    unexpectedItemCount: unexpectedIncludedTitles.length,
    sourceEvidenceCoverage: getRatio(
      evaluationCase.requiredSourceKeys.length - missingRequiredSourceKeys.length,
      evaluationCase.requiredSourceKeys.length,
    ),
    surfacedWarnings,
    outdatedConflictSurfacingPass: evaluationCase.expectedWarnings.every((warning) =>
      surfacedWarnings.includes(warning),
    ),
    tenantIsolationPass: selected.every(
      (result) => result.knowledgeItem.productId === productId,
    ),
    contextPack,
  };
}

export function formatEvaluationReport(summary: EvaluationSummary) {
  const lines = [
    "# Nextzen Evaluation Report",
    "",
    `Overall: ${summary.passed ? "PASS" : "FAIL"}`,
    `Average expected item recall: ${formatPercent(summary.averageExpectedItemRecall)}`,
    `Average source evidence coverage: ${formatPercent(summary.averageSourceEvidenceCoverage)}`,
    `Unexpected excluded item hits: ${summary.totalUnexpectedItemCount}`,
    `Tenant isolation: ${summary.tenantIsolationPass ? "PASS" : "FAIL"}`,
    "",
  ];

  for (const result of summary.results) {
    lines.push(`## ${result.case.title}`);
    lines.push(`Status: ${isPassingResult(result) ? "PASS" : "FAIL"}`);
    lines.push(`Expected item recall: ${formatPercent(result.expectedItemRecall)}`);
    lines.push(`Source evidence coverage: ${formatPercent(result.sourceEvidenceCoverage)}`);
    lines.push(`Unexpected excluded items: ${result.unexpectedItemCount}`);
    lines.push(`Warnings surfaced: ${result.surfacedWarnings.join(", ") || "none"}`);
    lines.push(`Tenant isolation: ${result.tenantIsolationPass ? "PASS" : "FAIL"}`);
    if (result.missingExpectedTitles.length) {
      lines.push(`Missing expected memory: ${result.missingExpectedTitles.join("; ")}`);
    }
    if (result.unexpectedIncludedTitles.length) {
      lines.push(`Unexpected included memory: ${result.unexpectedIncludedTitles.join("; ")}`);
    }
    if (result.missingRequiredSourceKeys.length) {
      lines.push(`Missing source evidence: ${result.missingRequiredSourceKeys.join("; ")}`);
    }
    lines.push(`Selected memory: ${result.selectedTitles.join("; ")}`);
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

export function isPassingResult(result: EvaluationResult) {
  return (
    result.expectedItemRecall >= 0.75 &&
    result.unexpectedItemCount === 0 &&
    result.sourceEvidenceCoverage >= 0.8 &&
    result.outdatedConflictSurfacingPass &&
    result.tenantIsolationPass
  );
}

function buildEvaluationGraph() {
  const modulesByKey = new Map<string, Module>();
  const featuresByKey = new Map<string, Feature>();
  const sourceByKey = new Map<string, Source>();
  const knowledgeByTitle = new Map<string, KnowledgeItem>();
  const sourcesByKnowledgeTitle = new Map<string, Source[]>();

  for (const productModule of seedModules) {
    modulesByKey.set(productModule.key, {
      id: productModule.key,
      productId,
      name: productModule.name,
      description: productModule.description,
      position: productModule.position,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const feature of seedFeatures) {
    const productModule = modulesByKey.get(feature.moduleKey);
    if (!productModule) {
      throw new Error(`Missing module for feature ${feature.key}`);
    }
    featuresByKey.set(feature.key, {
      id: feature.key,
      productId,
      moduleId: productModule.id,
      name: feature.name,
      description: feature.description,
      status: feature.status,
      position: feature.position,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const source of seedSources) {
    const productModule = modulesByKey.get(source.moduleKey);
    const feature = featuresByKey.get(source.featureKey);
    if (!productModule || !feature) {
      throw new Error(`Missing source graph attachment for ${source.key}`);
    }
    sourceByKey.set(source.key, {
      id: source.key,
      productId,
      moduleId: productModule.id,
      featureId: feature.id,
      sourceType: source.sourceType,
      name: source.name,
      url: null,
      rawContent: source.rawContent,
      metadata: source.metadata,
      createdAt: new Date(`${source.metadata.sourceDate}T00:00:00.000Z`),
      createdBy: userId,
    });
  }

  const knowledge = seedKnowledge.map((item) => {
    const productModule = modulesByKey.get(item.moduleKey);
    const feature = featuresByKey.get(item.featureKey);
    if (!productModule || !feature) {
      throw new Error(`Missing knowledge graph attachment for ${item.title}`);
    }

    const knowledgeItem: KnowledgeItem = {
      id: slug(item.title),
      productId,
      moduleId: productModule.id,
      featureId: feature.id,
      title: item.title,
      body: item.body,
      knowledgeType: item.knowledgeType,
      authority: item.authority,
      confidence: item.confidence,
      lifecycleStatus: item.lifecycleStatus,
      validFrom: item.validFrom ? new Date(`${item.validFrom}T00:00:00.000Z`) : null,
      validUntil: item.validUntil ? new Date(`${item.validUntil}T00:00:00.000Z`) : null,
      lastVerifiedAt: item.lifecycleStatus === "verified" ? now : null,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };
    const sources = item.sourceKeys.map((sourceKey) => {
      const source = sourceByKey.get(sourceKey);
      if (!source) {
        throw new Error(`Missing source ${sourceKey} for ${item.title}`);
      }
      return source;
    });

    knowledgeByTitle.set(item.title, knowledgeItem);
    sourcesByKnowledgeTitle.set(item.title, sources);
    return knowledgeItem;
  });

  return {
    product: {
      id: productId,
      name: seedProduct.name,
      description: seedProduct.description,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    } satisfies Product,
    modulesByKey,
    featuresByKey,
    sourceByKey,
    knowledge,
    knowledgeByTitle,
    sourcesByKnowledgeTitle,
  };
}

function getRelationshipPaths(knowledgeByTitle: Map<string, KnowledgeItem>) {
  const relationshipPaths = new Map<string, string>();

  for (const relationship of seedKnowledgeRelationships) {
    if (!knowledgeByTitle.has(relationship.fromTitle) || !knowledgeByTitle.has(relationship.toTitle)) {
      continue;
    }
    const label = `${relationship.relationshipType}: ${relationship.reason}`;
    relationshipPaths.set(relationship.fromTitle, label);
    relationshipPaths.set(relationship.toTitle, label);
  }

  return relationshipPaths;
}

function getRelatedFeatureIds(primaryFeatureId: string, graph: ReturnType<typeof buildEvaluationGraph>) {
  const relatedFeatureIds = seedFeatureRelationships.flatMap((relationship) => {
    const from = graph.featuresByKey.get(relationship.fromFeatureKey);
    const to = graph.featuresByKey.get(relationship.toFeatureKey);
    if (!from || !to) {
      return [];
    }
    if (from.id === primaryFeatureId) {
      return [to.id];
    }
    if (to.id === primaryFeatureId) {
      return [from.id];
    }
    return [];
  });

  return Array.from(new Set(relatedFeatureIds));
}

function compileEvaluationPack(
  evaluationCase: EvaluationCase,
  selected: RankedRetrievalResult[],
  graph: ReturnType<typeof buildEvaluationGraph>,
  feature?: Feature,
) {
  const productModule = feature
    ? Array.from(graph.modulesByKey.values()).find((item) => item.id === feature.moduleId) ?? null
    : null;
  const results = selected.map((result) => ({
    ...result,
    sources: graph.sourcesByKnowledgeTitle.get(result.knowledgeItem.title) ?? [],
  }));

  const input = {
    task: {
      title: evaluationCase.title,
      description: evaluationCase.taskDescription,
      taskIntent: evaluationCase.taskIntent,
    },
    product: graph.product,
    module: productModule,
    feature: feature ?? null,
    results,
  };
  getContextPackMetadata(input);

  return compileContextPack(input);
}

function getSelectedSourceKeys(
  selected: RankedRetrievalResult[],
  graph: ReturnType<typeof buildEvaluationGraph>,
) {
  const sourceKeys = new Set<string>();

  for (const result of selected) {
    for (const source of graph.sourcesByKnowledgeTitle.get(result.knowledgeItem.title) ?? []) {
      sourceKeys.add(source.id);
    }
  }

  return sourceKeys;
}

function getSurfacedWarnings(selected: RankedRetrievalResult[]) {
  const warnings = new Set<string>();

  for (const result of selected) {
    if (result.knowledgeItem.lifecycleStatus === "outdated") {
      warnings.add("outdated");
    }
    if (result.knowledgeItem.lifecycleStatus === "rejected") {
      warnings.add("rejected");
    }
    if (String(result.relationshipPath ?? "").includes("contradict")) {
      warnings.add("conflict");
    }
  }

  return Array.from(warnings);
}

function getLexicalScore(taskDescription: string, memory: string) {
  const taskTokens = new Set(tokenize(taskDescription));
  const memoryTokens = new Set(tokenize(memory));
  let overlap = 0;

  for (const token of taskTokens) {
    if (memoryTokens.has(token)) {
      overlap += 1;
    }
  }

  return Math.min(0.88, 0.34 + overlap * 0.055);
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/\W+/)
    .filter((token) => token.length > 2);
}

function foreignTenantCandidate(taskDescription: string): RetrievalCandidate {
  return {
    knowledgeItem: {
      id: "foreign-tenant-memory",
      productId: "other-product",
      moduleId: "other-module",
      featureId: "other-feature",
      title: "Foreign tenant approval policy",
      body: "Another customer's private approval policy must never be retrieved.",
      knowledgeType: "permission",
      authority: "canonical",
      confidence: 100,
      lifecycleStatus: "verified",
      validFrom: null,
      validUntil: null,
      lastVerifiedAt: now,
      createdBy: "other-user",
      createdAt: now,
      updatedAt: now,
    },
    semanticScore: getLexicalScore(taskDescription, "approval policy"),
    now,
  };
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getRatio(value: number, total: number) {
  if (!total) {
    return 1;
  }

  return value / total;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

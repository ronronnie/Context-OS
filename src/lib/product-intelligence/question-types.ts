import { z } from "zod";

export const intelligenceQuestionTypes = [
  {
    value: "change_impact",
    label: "What will be affected if I change this feature?",
    retrievalIntent: "Identify affected features, constraints, dependencies, and risks before a feature change.",
  },
  {
    value: "same_problem",
    label: "Where else do we solve this same problem?",
    retrievalIntent: "Find similar product patterns, reused components, and related feature solutions.",
  },
  {
    value: "pattern_rationale",
    label: "Why do we use this pattern?",
    retrievalIntent: "Explain the rationale, decisions, rejected approaches, and source-backed evidence behind a pattern.",
  },
  {
    value: "modification_considerations",
    label: "What should I consider before modifying this feature?",
    retrievalIntent: "Find rules, risks, constraints, permissions, issues, and open questions for modification planning.",
  },
  {
    value: "recent_decisions",
    label: "What decisions around this area have we made recently?",
    retrievalIntent: "Find recent decisions, rejected approaches, and time-aware history for this product area.",
  },
  {
    value: "outdated_or_conflicting",
    label: "Which knowledge appears outdated or conflicting?",
    retrievalIntent: "Find outdated, rejected, contradictory, low-authority, or conflict-prone Product Memory.",
  },
  {
    value: "reused_components_patterns",
    label: "What components or patterns are reused here?",
    retrievalIntent: "Find reused components, UX patterns, feature relationships, and knowledge relationships.",
  },
] as const;

export type IntelligenceQuestionType =
  (typeof intelligenceQuestionTypes)[number]["value"];

export const intelligenceQuestionTypeSchema = z.enum(
  intelligenceQuestionTypes.map((type) => type.value) as [
    IntelligenceQuestionType,
    ...IntelligenceQuestionType[],
  ],
);

const intelligenceQueryFormSchema = z.object({
  productId: z.string().uuid("Choose a valid product."),
  moduleId: z.string().uuid().optional(),
  featureId: z.string().uuid().optional(),
  questionType: intelligenceQuestionTypeSchema,
  detail: z.string().trim().max(2000).default(""),
});

export type ProductIntelligenceQueryInput = z.infer<
  typeof intelligenceQueryFormSchema
>;

export function parseIntelligenceQuerySearchParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
) {
  const value = params instanceof URLSearchParams
    ? {
        productId: params.get("productId"),
        moduleId: params.get("moduleId") || undefined,
        featureId: params.get("featureId") || undefined,
        questionType: params.get("questionType"),
        detail: params.get("detail") ?? "",
      }
    : {
        productId: stringValue(params.productId),
        moduleId: stringValue(params.moduleId) || undefined,
        featureId: stringValue(params.featureId) || undefined,
        questionType: stringValue(params.questionType),
        detail: stringValue(params.detail) ?? "",
      };

  return intelligenceQueryFormSchema.parse(value);
}

export function getQuestionTypeConfig(type: IntelligenceQuestionType) {
  return intelligenceQuestionTypes.find((question) => question.value === type);
}

export function buildIntelligenceTaskDescription(input: {
  questionType: IntelligenceQuestionType;
  questionLabel: string;
  productName: string;
  moduleName?: string | null;
  featureName?: string | null;
  detail?: string;
}) {
  return [
    input.questionLabel,
    `Product: ${input.productName}`,
    input.moduleName ? `Module: ${input.moduleName}` : null,
    input.featureName ? `Feature: ${input.featureName}` : null,
    input.detail ? `Additional detail: ${input.detail}` : null,
  ].filter(Boolean).join("\n");
}

export function buildIntelligenceRetrievalRequest(input: {
  productId: string;
  userId: string;
  taskDescription: string;
  featureId?: string;
}) {
  return {
    productId: input.productId,
    userId: input.userId,
    taskDescription: input.taskDescription,
    primaryFeatureId: input.featureId,
    limit: 10,
    includeDiagnostics: process.env.NODE_ENV === "development",
  };
}

function stringValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

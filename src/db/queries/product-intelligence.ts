import { and, asc, eq, inArray, or } from "drizzle-orm";

import { generateProductIntelligenceAnswer } from "@/ai";
import type { AIProvider } from "@/ai/provider";
import { db as defaultDb, type AppDb } from "@/db";
import { requireUserId } from "@/db/queries/authorization";
import { assertProductOwnership } from "@/db/queries/products";
import { retrieveProductContext } from "@/db/queries/retrieval";
import {
  featureRelationships,
  features,
  knowledgeItems,
  knowledgeRelationships,
  knowledgeSources,
  modules,
  products,
  sources,
} from "@/db/schema/index";
import {
  buildIntelligenceTaskDescription,
  buildIntelligenceRetrievalRequest,
  getQuestionTypeConfig,
  type ProductIntelligenceQueryInput,
} from "@/lib/product-intelligence/question-types";

export async function getProductIntelligenceOptions(
  userId: string,
  db: AppDb = defaultDb,
) {
  const authorizedUserId = requireUserId(userId);
  const userProducts = await db
    .select()
    .from(products)
    .where(eq(products.createdBy, authorizedUserId))
    .orderBy(asc(products.name));
  const productIds = userProducts.map((product) => product.id);
  const [productModules, productFeatures] = productIds.length
    ? await Promise.all([
        db
          .select()
          .from(modules)
          .where(inArray(modules.productId, productIds))
          .orderBy(asc(modules.position), asc(modules.name)),
        db
          .select()
          .from(features)
          .where(inArray(features.productId, productIds))
          .orderBy(asc(features.name)),
      ])
    : [[], []];

  return {
    products: userProducts,
    modules: productModules,
    features: productFeatures,
  };
}

export async function runProductIntelligenceQuery(
  input: ProductIntelligenceQueryInput,
  userId: string,
  db: AppDb = defaultDb,
  provider?: AIProvider,
) {
  const product = await assertProductOwnership(input.productId, userId, db);
  const { module, feature } = await getValidatedScope(input, db);
  const question = getQuestionTypeConfig(input.questionType);

  if (!question) {
    throw new Error("Unsupported intelligence question type.");
  }

  const taskDescription = buildIntelligenceTaskDescription({
    questionType: input.questionType,
    questionLabel: question.label,
    productName: product.name,
    moduleName: module?.name,
    featureName: feature?.name,
    detail: input.detail,
  });
  const retrieval = await retrieveProductContext(
    buildIntelligenceRetrievalRequest({
      productId: input.productId,
      userId,
      taskDescription: `${question.retrievalIntent}\n${taskDescription}`,
      featureId: input.featureId,
    }),
    db,
    provider,
  );
  const memoryIds = retrieval.results.map((result) => result.knowledgeItem.id);
  const evidence = await getSourcesForMemory(memoryIds, db);
  const evidenceMap = evidence.reduce((map, row) => {
    const list = map.get(row.knowledgeItemId) ?? [];
    list.push(row.source);
    map.set(row.knowledgeItemId, list);
    return map;
  }, new Map<string, Array<(typeof evidence)[number]["source"]>>());
  const graphRelationships = await getGraphRelationshipsForIntelligence(
    input.productId,
    input.featureId,
    memoryIds,
    db,
  );
  const memory = retrieval.results.map((result) => ({
    id: result.knowledgeItem.id,
    title: result.knowledgeItem.title,
    body: result.knowledgeItem.body,
    knowledgeType: result.knowledgeItem.knowledgeType,
    authority: result.knowledgeItem.authority,
    lifecycleStatus: result.knowledgeItem.lifecycleStatus,
    confidence: result.knowledgeItem.confidence,
    relevanceScore: Math.round(result.finalScore * 100),
    reasonForInclusion: result.reasonForInclusion,
    relationshipPath: result.relationshipPath ?? undefined,
    sourceEvidence: (evidenceMap.get(result.knowledgeItem.id) ?? []).map(
      (source) => ({
        id: source.id,
        name: source.name,
        sourceType: source.sourceType,
        url: source.url,
      }),
    ),
  }));

  if (!memory.length) {
    return {
      query: input,
      product,
      module,
      feature,
      memory,
      graphRelationships,
      answer: {
        directAnswer:
          "No source-backed Product Memory was retrieved for this intelligence query.",
        supportingMemory: [],
        relationshipPath: [],
        risks: [
          "Any product claim would be unsupported until relevant memory or source evidence is added.",
        ],
        openQuestions: [
          "Which source should define the current state for this product area?",
        ],
        confidence: 0,
        unsupportedClaims: [
          "The query does not have enough retrieved Product Memory for synthesis.",
        ],
      },
    };
  }

  const answer = await generateProductIntelligenceAnswer(
    {
      question: {
        type: input.questionType,
        label: question.label,
        detail: input.detail,
      },
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
      },
      module: module
        ? {
            id: module.id,
            name: module.name,
            description: module.description,
          }
        : null,
      feature: feature
        ? {
            id: feature.id,
            name: feature.name,
            description: feature.description,
          }
        : null,
      memory,
      graphRelationships,
    },
    provider,
  );

  return {
    query: input,
    product,
    module,
    feature,
    memory,
    graphRelationships,
    answer,
  };
}

async function getValidatedScope(
  input: ProductIntelligenceQueryInput,
  db: AppDb,
) {
  const [module] = input.moduleId
    ? await db
        .select()
        .from(modules)
        .where(
          and(
            eq(modules.id, input.moduleId),
            eq(modules.productId, input.productId),
          ),
        )
        .limit(1)
    : [null];

  if (input.moduleId && !module) {
    throw new Error("Selected module is not accessible for this product.");
  }

  const [feature] = input.featureId
    ? await db
        .select()
        .from(features)
        .where(
          and(
            eq(features.id, input.featureId),
            eq(features.productId, input.productId),
          ),
        )
        .limit(1)
    : [null];

  if (input.featureId && !feature) {
    throw new Error("Selected feature is not accessible for this product.");
  }

  if (module && feature && feature.moduleId !== module.id) {
    throw new Error("Selected feature must belong to the selected module.");
  }

  return {
    module,
    feature,
  };
}

async function getSourcesForMemory(knowledgeIds: string[], db: AppDb) {
  if (!knowledgeIds.length) {
    return [];
  }

  return db
    .select({
      knowledgeItemId: knowledgeSources.knowledgeItemId,
      source: sources,
    })
    .from(knowledgeSources)
    .innerJoin(sources, eq(knowledgeSources.sourceId, sources.id))
    .where(inArray(knowledgeSources.knowledgeItemId, knowledgeIds));
}

async function getGraphRelationshipsForIntelligence(
  productId: string,
  featureId: string | undefined,
  knowledgeIds: string[],
  db: AppDb,
) {
  const featureEdges = featureId
    ? await db
        .select({
          relationshipType: featureRelationships.relationshipType,
          reason: featureRelationships.reason,
          fromFeatureId: featureRelationships.fromFeatureId,
          toFeatureId: featureRelationships.toFeatureId,
          fromFeatureName: features.name,
        })
        .from(featureRelationships)
        .innerJoin(features, eq(featureRelationships.fromFeatureId, features.id))
        .where(
          and(
            eq(featureRelationships.productId, productId),
            or(
              eq(featureRelationships.fromFeatureId, featureId),
              eq(featureRelationships.toFeatureId, featureId),
            ),
          ),
        )
    : [];
  const relatedFeatureIds = Array.from(new Set(
    featureEdges.flatMap((edge) => [edge.fromFeatureId, edge.toFeatureId]),
  ));
  const relatedFeatures = relatedFeatureIds.length
    ? await db
        .select()
        .from(features)
        .where(inArray(features.id, relatedFeatureIds))
    : [];
  const featureNameById = new Map(
    relatedFeatures.map((feature) => [feature.id, feature.name]),
  );
  const knowledgeEdges = knowledgeIds.length
    ? await db
        .select({
          relationshipType: knowledgeRelationships.relationshipType,
          reason: knowledgeRelationships.reason,
          fromKnowledgeId: knowledgeRelationships.fromKnowledgeId,
          toKnowledgeId: knowledgeRelationships.toKnowledgeId,
          fromKnowledgeTitle: knowledgeItems.title,
        })
        .from(knowledgeRelationships)
        .innerJoin(
          knowledgeItems,
          eq(knowledgeRelationships.fromKnowledgeId, knowledgeItems.id),
        )
        .where(
          and(
            eq(knowledgeRelationships.productId, productId),
            or(
              inArray(knowledgeRelationships.fromKnowledgeId, knowledgeIds),
              inArray(knowledgeRelationships.toKnowledgeId, knowledgeIds),
            ),
          ),
        )
    : [];
  const relatedKnowledgeIds = Array.from(new Set(
    knowledgeEdges.flatMap((edge) => [edge.fromKnowledgeId, edge.toKnowledgeId]),
  ));
  const relatedKnowledge = relatedKnowledgeIds.length
    ? await db
        .select()
        .from(knowledgeItems)
        .where(inArray(knowledgeItems.id, relatedKnowledgeIds))
    : [];
  const knowledgeTitleById = new Map(
    relatedKnowledge.map((item) => [item.id, item.title]),
  );

  return [
    ...featureEdges.map((edge) => ({
      kind: "feature" as const,
      relationshipType: edge.relationshipType,
      from: featureNameById.get(edge.fromFeatureId) ?? edge.fromFeatureId,
      to: featureNameById.get(edge.toFeatureId) ?? edge.toFeatureId,
      reason: edge.reason,
    })),
    ...knowledgeEdges.map((edge) => ({
      kind: "knowledge" as const,
      relationshipType: edge.relationshipType,
      from: knowledgeTitleById.get(edge.fromKnowledgeId) ?? edge.fromKnowledgeId,
      to: knowledgeTitleById.get(edge.toKnowledgeId) ?? edge.toKnowledgeId,
      reason: edge.reason,
    })),
  ];
}

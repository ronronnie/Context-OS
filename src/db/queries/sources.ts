import { and, asc, desc, eq } from "drizzle-orm";

import { db as defaultDb, type AppDb } from "@/db";
import { getFeaturesForModule } from "@/db/queries/features";
import { getModulesForProduct } from "@/db/queries/modules";
import { assertProductOwnership, getProductsForUser } from "@/db/queries/products";
import {
  features,
  knowledgeItems,
  knowledgeSources,
  modules,
  sources,
} from "@/db/schema/index";
import { buildSourceExtractionInput } from "@/lib/source-ingestion/extraction";
import type { SourceType } from "@/lib/source-ingestion/source-model";

export async function getSourcesForProduct(
  productId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(productId, userId, db);

  return db
    .select()
    .from(sources)
    .where(eq(sources.productId, productId))
    .orderBy(asc(sources.name));
}

export async function getSourceIngestionWorkspace(
  userId: string,
  db: AppDb = defaultDb,
) {
  const userProducts = await getProductsForUser(userId, db);

  const graph = await Promise.all(
    userProducts.map(async (product) => {
      const productModules = await getModulesForProduct(product.id, userId, db);
      const modulesWithFeatures = await Promise.all(
        productModules.map(async (module) => ({
          ...module,
          features: await getFeaturesForModule(module.id, product.id, userId, db),
        })),
      );
      const productSources = await getSourcesForProduct(product.id, userId, db);

      return {
        ...product,
        modules: modulesWithFeatures,
        sources: productSources,
      };
    }),
  );

  return {
    products: graph,
    sources: graph.flatMap((product) =>
      product.sources.map((source) => ({
        ...source,
        productName: product.name,
        moduleName:
          product.modules.find((module) => module.id === source.moduleId)?.name ?? null,
        featureName:
          product.modules
            .flatMap((module) => module.features)
            .find((feature) => feature.id === source.featureId)?.name ?? null,
      })),
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  };
}

export async function createSource(
  input: {
    productId: string;
    moduleId: string | null;
    featureId: string | null;
    name: string;
    sourceType: SourceType;
    url: string | null;
    rawContent: string;
    metadata: Record<string, unknown>;
  },
  userId: string,
  db: AppDb = defaultDb,
) {
  await assertProductOwnership(input.productId, userId, db);
  await assertSourceGraphAttachment(input, db);

  const rows = await db
    .insert(sources)
    .values({
      productId: input.productId,
      moduleId: input.moduleId,
      featureId: input.featureId,
      sourceType: input.sourceType,
      name: input.name,
      url: input.url,
      rawContent: input.rawContent,
      metadata: input.metadata,
      createdBy: userId,
    })
    .returning();

  return rows[0];
}

export async function getSourceDetail(
  productId: string,
  sourceId: string,
  userId: string,
  db: AppDb = defaultDb,
) {
  const product = await assertProductOwnership(productId, userId, db);
  const [source] = await db
    .select()
    .from(sources)
    .where(and(eq(sources.id, sourceId), eq(sources.productId, productId)))
    .limit(1);

  if (!source) {
    return null;
  }

  const [attachedModule] = source.moduleId
    ? await db
        .select()
        .from(modules)
        .where(and(eq(modules.id, source.moduleId), eq(modules.productId, productId)))
        .limit(1)
    : [];
  const [attachedFeature] = source.featureId
    ? await db
        .select()
        .from(features)
        .where(and(eq(features.id, source.featureId), eq(features.productId, productId)))
        .limit(1)
    : [];
  const linkedKnowledge = await db
    .select({ knowledge: knowledgeItems })
    .from(knowledgeSources)
    .innerJoin(
      knowledgeItems,
      eq(knowledgeSources.knowledgeItemId, knowledgeItems.id),
    )
    .where(eq(knowledgeSources.sourceId, source.id))
    .orderBy(desc(knowledgeItems.updatedAt));

  return {
    product,
    source,
    module: attachedModule ?? null,
    feature: attachedFeature ?? null,
    knowledge: linkedKnowledge.map((row) => row.knowledge),
    extractionInput: buildSourceExtractionInput(source),
  };
}

async function assertSourceGraphAttachment(
  input: {
    productId: string;
    moduleId: string | null;
    featureId: string | null;
  },
  db: AppDb,
) {
  if (input.moduleId) {
    const productModules = await db
      .select({ id: modules.id })
      .from(modules)
      .where(and(eq(modules.id, input.moduleId), eq(modules.productId, input.productId)))
      .limit(1);

    if (!productModules.length) {
      throw new Error("Module is not part of the selected product.");
    }
  }

  if (!input.featureId) {
    return;
  }

  const productFeatures = await db
    .select({ id: features.id, moduleId: features.moduleId })
    .from(features)
    .where(
      and(eq(features.id, input.featureId), eq(features.productId, input.productId)),
    )
    .limit(1);

  const feature = productFeatures[0];
  if (!feature) {
    throw new Error("Feature is not part of the selected product.");
  }

  if (input.moduleId && feature.moduleId !== input.moduleId) {
    throw new Error("Feature is not part of the selected module.");
  }
}

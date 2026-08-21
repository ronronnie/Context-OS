import * as nextEnv from "@next/env";

import {
  contextPackItems,
  contextPacks,
  featureRelationships,
  features,
  knowledgeItems,
  knowledgeRelationships,
  knowledgeSources,
  modules,
  products,
  sources,
  tasks,
  user,
} from "@/db/schema/index";
import type { AppDb } from "@/db";
import {
  seedFeatures,
  seedFeatureRelationships,
  seedDemoTask,
  seedKnowledge,
  seedKnowledgeRelationships,
  seedModules,
  seedProduct,
  seedSources,
  seedUser,
} from "@/db/seed-data";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

async function main() {
  const { db } = await import("@/db");

  await db
    .insert(user)
    .values({
      id: seedUser.id,
      name: seedUser.name,
      email: seedUser.email,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing();

  const [product] = await db
    .insert(products)
    .values({
      ...seedProduct,
      createdBy: seedUser.id,
    })
    .onConflictDoUpdate({
      target: [products.createdBy, products.name],
      set: {
        description: seedProduct.description,
        updatedAt: new Date(),
      },
    })
    .returning();

  const moduleByKey = new Map<string, string>();
  for (const moduleSeed of seedModules) {
    const [module] = await db
      .insert(modules)
      .values({
        productId: product.id,
        name: moduleSeed.name,
        description: moduleSeed.description,
        position: moduleSeed.position,
      })
      .onConflictDoUpdate({
        target: [modules.productId, modules.name],
        set: {
          description: moduleSeed.description,
          position: moduleSeed.position,
          updatedAt: new Date(),
        },
      })
      .returning();
    moduleByKey.set(moduleSeed.key, module.id);
  }

  const featureByKey = new Map<string, string>();
  for (const featureSeed of seedFeatures) {
    const moduleId = moduleByKey.get(featureSeed.moduleKey);
    if (!moduleId) throw new Error(`Missing module for ${featureSeed.name}`);

    const [feature] = await db
      .insert(features)
      .values({
        productId: product.id,
        moduleId,
        name: featureSeed.name,
        description: featureSeed.description,
        status: featureSeed.status,
        position: featureSeed.position,
      })
      .onConflictDoUpdate({
        target: [features.productId, features.moduleId, features.name],
        set: {
          description: featureSeed.description,
          status: featureSeed.status,
          position: featureSeed.position,
          updatedAt: new Date(),
        },
      })
      .returning();
    featureByKey.set(featureSeed.key, feature.id);
  }

  const sourceByKey = new Map<string, string>();
  for (const sourceSeed of seedSources) {
    const sourceModuleKey = sourceSeed.moduleKey;
    const sourceFeatureKey = "featureKey" in sourceSeed ? sourceSeed.featureKey : null;
    const moduleId = moduleByKey.get(sourceModuleKey);
    const featureId = sourceFeatureKey ? featureByKey.get(sourceFeatureKey) : null;

    if (!moduleId) {
      throw new Error(`Missing source module for ${sourceSeed.name}`);
    }
    if (sourceFeatureKey && !featureId) {
      throw new Error(`Missing source feature for ${sourceSeed.name}`);
    }

    const [source] = await db
      .insert(sources)
      .values({
        productId: product.id,
        moduleId,
        featureId,
        sourceType: sourceSeed.sourceType,
        name: sourceSeed.name,
        rawContent: sourceSeed.rawContent,
        metadata: sourceSeed.metadata,
        createdBy: seedUser.id,
      })
      .onConflictDoUpdate({
        target: [sources.productId, sources.name],
        set: {
          moduleId,
          featureId,
          sourceType: sourceSeed.sourceType,
          rawContent: sourceSeed.rawContent,
          metadata: sourceSeed.metadata,
        },
      })
      .returning();
    sourceByKey.set(sourceSeed.key, source.id);
  }

  const knowledgeByTitle = new Map<string, string>();
  for (const knowledgeSeed of seedKnowledge) {
    const moduleId = moduleByKey.get(knowledgeSeed.moduleKey);
    const featureId = featureByKey.get(knowledgeSeed.featureKey);
    if (!moduleId || !featureId) throw new Error(`Missing graph node for ${knowledgeSeed.title}`);

    const [knowledge] = await db
      .insert(knowledgeItems)
      .values({
        productId: product.id,
        moduleId,
        featureId,
        title: knowledgeSeed.title,
        body: knowledgeSeed.body,
        knowledgeType: knowledgeSeed.knowledgeType,
        authority: knowledgeSeed.authority,
        confidence: knowledgeSeed.confidence,
        lifecycleStatus: knowledgeSeed.lifecycleStatus,
        validFrom: knowledgeSeed.validFrom ? new Date(knowledgeSeed.validFrom) : null,
        validUntil: knowledgeSeed.validUntil ? new Date(knowledgeSeed.validUntil) : null,
        lastVerifiedAt:
          knowledgeSeed.lifecycleStatus === "verified" || knowledgeSeed.lifecycleStatus === "outdated"
            ? new Date()
            : null,
        createdBy: seedUser.id,
      })
      .onConflictDoUpdate({
        target: [knowledgeItems.productId, knowledgeItems.title],
        set: {
          body: knowledgeSeed.body,
          knowledgeType: knowledgeSeed.knowledgeType,
          authority: knowledgeSeed.authority,
          confidence: knowledgeSeed.confidence,
          lifecycleStatus: knowledgeSeed.lifecycleStatus,
          validFrom: knowledgeSeed.validFrom ? new Date(knowledgeSeed.validFrom) : null,
          validUntil: knowledgeSeed.validUntil ? new Date(knowledgeSeed.validUntil) : null,
          lastVerifiedAt:
            knowledgeSeed.lifecycleStatus === "verified" || knowledgeSeed.lifecycleStatus === "outdated"
              ? new Date()
              : null,
          updatedAt: new Date(),
        },
      })
      .returning();

    knowledgeByTitle.set(knowledgeSeed.title, knowledge.id);

    for (const sourceKey of knowledgeSeed.sourceKeys) {
      const sourceId = sourceByKey.get(sourceKey);
      if (!sourceId) throw new Error(`Missing source ${sourceKey}`);

      await db.insert(knowledgeSources).values({
        knowledgeItemId: knowledge.id,
        sourceId,
      }).onConflictDoNothing();
    }
  }

  for (const relationshipSeed of seedKnowledgeRelationships) {
    await createKnowledgeRelationship(
      db,
      product.id,
      knowledgeByTitle,
      relationshipSeed.fromTitle,
      relationshipSeed.toTitle,
      relationshipSeed.relationshipType,
      relationshipSeed.reason,
    );
  }

  for (const relationshipSeed of seedFeatureRelationships) {
    const fromFeatureId = featureByKey.get(relationshipSeed.fromFeatureKey);
    const toFeatureId = featureByKey.get(relationshipSeed.toFeatureKey);
    if (!fromFeatureId || !toFeatureId) continue;

    await db.insert(featureRelationships).values({
      productId: product.id,
      fromFeatureId,
      toFeatureId,
      relationshipType: relationshipSeed.relationshipType,
      reason: relationshipSeed.reason,
      createdBy: seedUser.id,
    }).onConflictDoUpdate({
      target: [
        featureRelationships.fromFeatureId,
        featureRelationships.toFeatureId,
        featureRelationships.relationshipType,
      ],
      set: {
        reason: relationshipSeed.reason,
        createdBy: seedUser.id,
        updatedAt: new Date(),
      },
    });
  }

  const progressReviewFeatureId = featureByKey.get(seedDemoTask.primaryFeatureKey);

  const [task] = await db
    .insert(tasks)
    .values({
      productId: product.id,
      primaryFeatureId: progressReviewFeatureId,
      title: seedDemoTask.title,
      description: seedDemoTask.description,
      status: seedDemoTask.status,
      createdBy: seedUser.id,
    })
    .onConflictDoUpdate({
      target: [tasks.productId, tasks.title],
      set: {
        primaryFeatureId: progressReviewFeatureId,
        description: seedDemoTask.description,
        status: seedDemoTask.status,
        updatedAt: new Date(),
      },
    })
    .returning();

  const [pack] = await db
    .insert(contextPacks)
    .values({
      productId: product.id,
      taskId: task.id,
      version: 1,
      generatedContent: seedDemoTask.contextPackContent,
      metadata: {
        destination: "codex",
        fictional: true,
        seededStory: "bulk-progress-report-approval",
        taskIntent: "design",
      },
      createdBy: seedUser.id,
    })
    .onConflictDoUpdate({
      target: [contextPacks.taskId, contextPacks.version],
      set: {
        generatedContent: seedDemoTask.contextPackContent,
        metadata: {
          destination: "codex",
          fictional: true,
          seededStory: "bulk-progress-report-approval",
          taskIntent: "design",
        },
        createdBy: seedUser.id,
      },
    })
    .returning();

  for (const title of seedDemoTask.contextPackKnowledgeTitles) {
    const id = knowledgeByTitle.get(title);
    if (!id) {
      throw new Error(`Missing seeded Context Pack memory ${title}`);
    }

    await db.insert(contextPackItems).values({
      contextPackId: pack.id,
      knowledgeItemId: id,
      relevanceScore: 90,
      reasonForInclusion: "Seeded as directly relevant to the demo approval task.",
    }).onConflictDoNothing();
  }

  console.log(`Seeded ${seedProduct.name} for ${seedUser.email}`);
}

async function createKnowledgeRelationship(
  db: AppDb,
  productId: string,
  knowledgeByTitle: Map<string, string>,
  fromTitle: string,
  toTitle: string,
  relationshipType: string,
  reason: string,
) {
  const fromKnowledgeId = knowledgeByTitle.get(fromTitle);
  const toKnowledgeId = knowledgeByTitle.get(toTitle);
  if (!fromKnowledgeId || !toKnowledgeId) return;

  await db.insert(knowledgeRelationships).values({
    productId,
    fromKnowledgeId,
    toKnowledgeId,
    relationshipType,
    reason,
    createdBy: seedUser.id,
  }).onConflictDoUpdate({
    target: [
      knowledgeRelationships.fromKnowledgeId,
      knowledgeRelationships.toKnowledgeId,
      knowledgeRelationships.relationshipType,
    ],
    set: {
      reason,
      createdBy: seedUser.id,
      updatedAt: new Date(),
    },
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { db } from "@/db";
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
import {
  seedFeatures,
  seedFeatureRelationships,
  seedKnowledge,
  seedKnowledgeRelationships,
  seedModules,
  seedProduct,
  seedSources,
  seedUser,
} from "@/db/seed-data";

async function main() {
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
        lastVerifiedAt:
          knowledgeSeed.lifecycleStatus === "verified" ? new Date() : null,
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

  const progressReviewFeatureId = featureByKey.get("review-progress-report");

  const [task] = await db
    .insert(tasks)
    .values({
      productId: product.id,
      primaryFeatureId: progressReviewFeatureId,
      title: "Design bulk approval for progress reports",
      description:
        "Generate a source-backed Context Pack before changing approval workflows.",
      status: "ready",
      createdBy: seedUser.id,
    })
    .onConflictDoUpdate({
      target: [tasks.productId, tasks.title],
      set: {
        description:
          "Generate a source-backed Context Pack before changing approval workflows.",
        status: "ready",
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
      generatedContent:
        "Use verified approval permissions, unresolved correction constraints, bulk selection patterns, and rejected toolbar history before designing bulk approval.",
      metadata: { destination: "codex", fictional: true },
      createdBy: seedUser.id,
    })
    .onConflictDoUpdate({
      target: [contextPacks.taskId, contextPacks.version],
      set: {
        generatedContent:
          "Use verified approval permissions, unresolved correction constraints, bulk selection patterns, and rejected toolbar history before designing bulk approval.",
        metadata: { destination: "codex", fictional: true },
        createdBy: seedUser.id,
      },
    })
    .returning();

  for (const id of Array.from(knowledgeByTitle.values()).slice(0, 5)) {
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

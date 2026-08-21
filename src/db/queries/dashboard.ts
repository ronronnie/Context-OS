import { and, count, desc, eq } from "drizzle-orm";

import { db as defaultDb, type AppDb } from "@/db";
import {
  contextPacks,
  features,
  knowledgeConflicts,
  knowledgeItems,
  modules,
  products,
  sources,
  tasks,
} from "@/db/schema/index";

export async function getDashboardWorkspace(userId: string, db: AppDb = defaultDb) {
  const userProducts = await db
    .select()
    .from(products)
    .where(eq(products.createdBy, userId))
    .orderBy(desc(products.updatedAt));
  const selectedProduct = userProducts[0] ?? null;

  if (!selectedProduct) {
    return {
      selectedProduct: null,
      stats: {
        modules: 0,
        features: 0,
        verifiedKnowledge: 0,
        unresolvedConflicts: 0,
      },
      recentSources: [],
      recentTasks: [],
      recentContextPacks: [],
      suggestedNextActions: ["Create a product", "Map modules", "Add source evidence"],
    };
  }

  const [
    moduleRows,
    verifiedRows,
    conflictRows,
    recentSources,
    recentTasks,
    recentContextPacks,
  ] = await Promise.all([
    db
      .select({
        id: modules.id,
        name: modules.name,
        featureCount: count(features.id),
      })
      .from(modules)
      .leftJoin(features, eq(features.moduleId, modules.id))
      .where(eq(modules.productId, selectedProduct.id))
      .groupBy(modules.id)
      .orderBy(modules.position),
    db
      .select({ value: count() })
      .from(knowledgeItems)
      .where(
        and(
          eq(knowledgeItems.productId, selectedProduct.id),
          eq(knowledgeItems.lifecycleStatus, "verified"),
        ),
      ),
    db
      .select({ value: count() })
      .from(knowledgeConflicts)
      .where(
        and(
          eq(knowledgeConflicts.productId, selectedProduct.id),
          eq(knowledgeConflicts.resolution, "pending"),
        ),
      ),
    db
      .select()
      .from(sources)
      .where(eq(sources.productId, selectedProduct.id))
      .orderBy(desc(sources.createdAt))
      .limit(5),
    db
      .select()
      .from(tasks)
      .where(eq(tasks.productId, selectedProduct.id))
      .orderBy(desc(tasks.updatedAt))
      .limit(5),
    db
      .select({ pack: contextPacks, task: tasks })
      .from(contextPacks)
      .innerJoin(tasks, eq(contextPacks.taskId, tasks.id))
      .where(eq(contextPacks.productId, selectedProduct.id))
      .orderBy(desc(contextPacks.createdAt))
      .limit(5),
  ]);

  return {
    selectedProduct,
    stats: {
      modules: moduleRows.length,
      features: moduleRows.reduce((total, row) => total + Number(row.featureCount), 0),
      verifiedKnowledge: verifiedRows[0]?.value ?? 0,
      unresolvedConflicts: conflictRows[0]?.value ?? 0,
    },
    modules: moduleRows,
    recentSources,
    recentTasks,
    recentContextPacks,
    suggestedNextActions: getSuggestedNextActions({
      hasSources: recentSources.length > 0,
      hasTasks: recentTasks.length > 0,
      unresolvedConflicts: conflictRows[0]?.value ?? 0,
    }),
  };
}

function getSuggestedNextActions(input: {
  hasSources: boolean;
  hasTasks: boolean;
  unresolvedConflicts: number;
}) {
  if (input.unresolvedConflicts > 0) {
    return ["Resolve pending conflicts", "Review affected feature timelines"];
  }

  return [
    input.hasSources ? "Extract Product Memory from recent sources" : "Add source evidence",
    input.hasTasks ? "Open the latest Context Pack" : "Create a task",
    "Run Product Intelligence before changing a feature",
  ];
}

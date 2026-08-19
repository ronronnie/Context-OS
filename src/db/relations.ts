import { relations } from "drizzle-orm";

import {
  capturedDecisions,
  contextPackItems,
  contextPacks,
  contextTasks,
  features,
  knowledgeEvidence,
  knowledgeItems,
  knowledgeRelations,
  memoryEmbeddings,
  modules,
  productObjects,
  products,
  sources,
} from "@/db/schema";

export const productRelations = relations(products, ({ many }) => ({
  modules: many(modules),
  productObjects: many(productObjects),
  sources: many(sources),
  knowledgeItems: many(knowledgeItems),
  contextTasks: many(contextTasks),
  capturedDecisions: many(capturedDecisions),
}));

export const moduleRelations = relations(modules, ({ one, many }) => ({
  product: one(products, {
    fields: [modules.productId],
    references: [products.id],
  }),
  features: many(features),
  knowledgeItems: many(knowledgeItems),
}));

export const featureRelations = relations(features, ({ one, many }) => ({
  module: one(modules, {
    fields: [features.moduleId],
    references: [modules.id],
  }),
  productObjects: many(productObjects),
  knowledgeItems: many(knowledgeItems),
}));

export const knowledgeItemRelations = relations(knowledgeItems, ({ one, many }) => ({
  product: one(products, {
    fields: [knowledgeItems.productId],
    references: [products.id],
  }),
  module: one(modules, {
    fields: [knowledgeItems.moduleId],
    references: [modules.id],
  }),
  feature: one(features, {
    fields: [knowledgeItems.featureId],
    references: [features.id],
  }),
  evidence: many(knowledgeEvidence),
  outgoingRelations: many(knowledgeRelations, {
    relationName: "fromKnowledge",
  }),
  incomingRelations: many(knowledgeRelations, {
    relationName: "toKnowledge",
  }),
  embeddings: many(memoryEmbeddings),
}));

export const sourceRelations = relations(sources, ({ one, many }) => ({
  product: one(products, {
    fields: [sources.productId],
    references: [products.id],
  }),
  evidence: many(knowledgeEvidence),
}));

export const knowledgeEvidenceRelations = relations(knowledgeEvidence, ({ one }) => ({
  knowledge: one(knowledgeItems, {
    fields: [knowledgeEvidence.knowledgeId],
    references: [knowledgeItems.id],
  }),
  source: one(sources, {
    fields: [knowledgeEvidence.sourceId],
    references: [sources.id],
  }),
}));

export const knowledgeRelationRelations = relations(knowledgeRelations, ({ one }) => ({
  fromKnowledge: one(knowledgeItems, {
    fields: [knowledgeRelations.fromKnowledgeId],
    references: [knowledgeItems.id],
    relationName: "fromKnowledge",
  }),
  toKnowledge: one(knowledgeItems, {
    fields: [knowledgeRelations.toKnowledgeId],
    references: [knowledgeItems.id],
    relationName: "toKnowledge",
  }),
}));

export const contextTaskRelations = relations(contextTasks, ({ one, many }) => ({
  product: one(products, {
    fields: [contextTasks.productId],
    references: [products.id],
  }),
  packs: many(contextPacks),
}));

export const contextPackRelations = relations(contextPacks, ({ one, many }) => ({
  task: one(contextTasks, {
    fields: [contextPacks.taskId],
    references: [contextTasks.id],
  }),
  items: many(contextPackItems),
  capturedDecisions: many(capturedDecisions),
}));

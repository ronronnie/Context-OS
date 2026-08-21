import { relations } from "drizzle-orm";

import { user } from "@/db/schema/auth";
import {
  contextPackItems,
  contextPacks,
  decisionCaptureCandidates,
  featureRelationships,
  features,
  knowledgeEmbeddings,
  knowledgeItems,
  knowledgeConflicts,
  knowledgeEvents,
  knowledgeRelationships,
  knowledgeSources,
  knowledgeTaskLinks,
  modules,
  productAuditEvents,
  products,
  sourceExtractionCandidates,
  sourceExtractions,
  sources,
  taskOutcomes,
  tasks,
} from "@/db/schema/product-memory";

export const userRelations = relations(user, ({ many }) => ({
  products: many(products),
  knowledgeItems: many(knowledgeItems),
  knowledgeEmbeddings: many(knowledgeEmbeddings),
  sources: many(sources),
  tasks: many(tasks),
  taskOutcomes: many(taskOutcomes),
  auditEvents: many(productAuditEvents),
}));

export const productRelations = relations(products, ({ one, many }) => ({
  owner: one(user, {
    fields: [products.createdBy],
    references: [user.id],
  }),
  modules: many(modules),
  features: many(features),
  knowledgeItems: many(knowledgeItems),
  sources: many(sources),
  sourceExtractions: many(sourceExtractions),
  featureRelationships: many(featureRelationships),
  knowledgeRelationships: many(knowledgeRelationships),
  taskOutcomes: many(taskOutcomes),
  tasks: many(tasks),
  contextPacks: many(contextPacks),
  auditEvents: many(productAuditEvents),
}));

export const moduleRelations = relations(modules, ({ one, many }) => ({
  product: one(products, {
    fields: [modules.productId],
    references: [products.id],
  }),
  features: many(features),
  knowledgeItems: many(knowledgeItems),
  sources: many(sources),
  auditEvents: many(productAuditEvents),
}));

export const featureRelations = relations(features, ({ one, many }) => ({
  product: one(products, {
    fields: [features.productId],
    references: [products.id],
  }),
  module: one(modules, {
    fields: [features.moduleId],
    references: [modules.id],
  }),
  knowledgeItems: many(knowledgeItems),
  sources: many(sources),
  outgoingRelationships: many(featureRelationships, {
    relationName: "fromFeature",
  }),
  incomingRelationships: many(featureRelationships, {
    relationName: "toFeature",
  }),
  auditEvents: many(productAuditEvents),
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
  creator: one(user, {
    fields: [knowledgeItems.createdBy],
    references: [user.id],
  }),
  sourceLinks: many(knowledgeSources),
  embedding: one(knowledgeEmbeddings, {
    fields: [knowledgeItems.id],
    references: [knowledgeEmbeddings.knowledgeItemId],
  }),
  events: many(knowledgeEvents),
  outgoingRelationships: many(knowledgeRelationships, {
    relationName: "fromKnowledge",
  }),
  incomingRelationships: many(knowledgeRelationships, {
    relationName: "toKnowledge",
  }),
  taskLinks: many(knowledgeTaskLinks),
  conflictsAsExisting: many(knowledgeConflicts),
  auditEvents: many(productAuditEvents),
}));

export const knowledgeEventRelations = relations(knowledgeEvents, ({ one }) => ({
  product: one(products, {
    fields: [knowledgeEvents.productId],
    references: [products.id],
  }),
  feature: one(features, {
    fields: [knowledgeEvents.featureId],
    references: [features.id],
  }),
  knowledgeItem: one(knowledgeItems, {
    fields: [knowledgeEvents.knowledgeItemId],
    references: [knowledgeItems.id],
  }),
  creator: one(user, {
    fields: [knowledgeEvents.createdBy],
    references: [user.id],
  }),
}));

export const sourceRelations = relations(sources, ({ one, many }) => ({
  product: one(products, {
    fields: [sources.productId],
    references: [products.id],
  }),
  module: one(modules, {
    fields: [sources.moduleId],
    references: [modules.id],
  }),
  feature: one(features, {
    fields: [sources.featureId],
    references: [features.id],
  }),
  creator: one(user, {
    fields: [sources.createdBy],
    references: [user.id],
  }),
  knowledgeLinks: many(knowledgeSources),
  taskOutcomes: many(taskOutcomes),
  extractions: many(sourceExtractions),
  extractionCandidates: many(sourceExtractionCandidates),
  auditEvents: many(productAuditEvents),
}));

export const sourceExtractionRelations = relations(sourceExtractions, ({ one, many }) => ({
  product: one(products, {
    fields: [sourceExtractions.productId],
    references: [products.id],
  }),
  source: one(sources, {
    fields: [sourceExtractions.sourceId],
    references: [sources.id],
  }),
  creator: one(user, {
    fields: [sourceExtractions.createdBy],
    references: [user.id],
  }),
  candidates: many(sourceExtractionCandidates),
  conflicts: many(knowledgeConflicts),
  auditEvents: many(productAuditEvents),
}));

export const sourceExtractionCandidateRelations = relations(
  sourceExtractionCandidates,
  ({ one, many }) => ({
    extraction: one(sourceExtractions, {
      fields: [sourceExtractionCandidates.extractionId],
      references: [sourceExtractions.id],
    }),
    product: one(products, {
      fields: [sourceExtractionCandidates.productId],
      references: [products.id],
    }),
    source: one(sources, {
      fields: [sourceExtractionCandidates.sourceId],
      references: [sources.id],
    }),
    module: one(modules, {
      fields: [sourceExtractionCandidates.moduleId],
      references: [modules.id],
    }),
    feature: one(features, {
      fields: [sourceExtractionCandidates.featureId],
      references: [features.id],
    }),
    approvedKnowledgeItem: one(knowledgeItems, {
      fields: [sourceExtractionCandidates.approvedKnowledgeItemId],
      references: [knowledgeItems.id],
    }),
    conflicts: many(knowledgeConflicts),
    auditEvents: many(productAuditEvents),
  }),
);

export const knowledgeConflictRelations = relations(knowledgeConflicts, ({ one, many }) => ({
  product: one(products, {
    fields: [knowledgeConflicts.productId],
    references: [products.id],
  }),
  extraction: one(sourceExtractions, {
    fields: [knowledgeConflicts.extractionId],
    references: [sourceExtractions.id],
  }),
  candidate: one(sourceExtractionCandidates, {
    fields: [knowledgeConflicts.candidateId],
    references: [sourceExtractionCandidates.id],
  }),
  existingKnowledgeItem: one(knowledgeItems, {
    fields: [knowledgeConflicts.existingKnowledgeItemId],
    references: [knowledgeItems.id],
  }),
  resolver: one(user, {
    fields: [knowledgeConflicts.resolvedBy],
    references: [user.id],
  }),
  auditEvents: many(productAuditEvents),
}));

export const knowledgeEmbeddingRelations = relations(knowledgeEmbeddings, ({ one }) => ({
  product: one(products, {
    fields: [knowledgeEmbeddings.productId],
    references: [products.id],
  }),
  knowledgeItem: one(knowledgeItems, {
    fields: [knowledgeEmbeddings.knowledgeItemId],
    references: [knowledgeItems.id],
  }),
}));

export const knowledgeSourceRelations = relations(knowledgeSources, ({ one }) => ({
  knowledgeItem: one(knowledgeItems, {
    fields: [knowledgeSources.knowledgeItemId],
    references: [knowledgeItems.id],
  }),
  source: one(sources, {
    fields: [knowledgeSources.sourceId],
    references: [sources.id],
  }),
}));

export const featureRelationshipRelations = relations(featureRelationships, ({ one }) => ({
  product: one(products, {
    fields: [featureRelationships.productId],
    references: [products.id],
  }),
  fromFeature: one(features, {
    fields: [featureRelationships.fromFeatureId],
    references: [features.id],
    relationName: "fromFeature",
  }),
  toFeature: one(features, {
    fields: [featureRelationships.toFeatureId],
    references: [features.id],
    relationName: "toFeature",
  }),
  creator: one(user, {
    fields: [featureRelationships.createdBy],
    references: [user.id],
  }),
}));

export const knowledgeRelationshipRelations = relations(
  knowledgeRelationships,
  ({ one }) => ({
    product: one(products, {
      fields: [knowledgeRelationships.productId],
      references: [products.id],
    }),
    fromKnowledge: one(knowledgeItems, {
      fields: [knowledgeRelationships.fromKnowledgeId],
      references: [knowledgeItems.id],
      relationName: "fromKnowledge",
    }),
    toKnowledge: one(knowledgeItems, {
      fields: [knowledgeRelationships.toKnowledgeId],
      references: [knowledgeItems.id],
      relationName: "toKnowledge",
    }),
    creator: one(user, {
      fields: [knowledgeRelationships.createdBy],
      references: [user.id],
    }),
  }),
);

export const taskRelations = relations(tasks, ({ one, many }) => ({
  product: one(products, {
    fields: [tasks.productId],
    references: [products.id],
  }),
  primaryFeature: one(features, {
    fields: [tasks.primaryFeatureId],
    references: [features.id],
  }),
  creator: one(user, {
    fields: [tasks.createdBy],
    references: [user.id],
  }),
  contextPacks: many(contextPacks),
  taskOutcomes: many(taskOutcomes),
  knowledgeTaskLinks: many(knowledgeTaskLinks),
  auditEvents: many(productAuditEvents),
}));

export const contextPackRelations = relations(contextPacks, ({ one, many }) => ({
  task: one(tasks, {
    fields: [contextPacks.taskId],
    references: [tasks.id],
  }),
  product: one(products, {
    fields: [contextPacks.productId],
    references: [products.id],
  }),
  creator: one(user, {
    fields: [contextPacks.createdBy],
    references: [user.id],
  }),
  taskOutcomes: many(taskOutcomes),
  items: many(contextPackItems),
  auditEvents: many(productAuditEvents),
}));

export const contextPackItemRelations = relations(contextPackItems, ({ one }) => ({
  contextPack: one(contextPacks, {
    fields: [contextPackItems.contextPackId],
    references: [contextPacks.id],
  }),
  knowledgeItem: one(knowledgeItems, {
    fields: [contextPackItems.knowledgeItemId],
    references: [knowledgeItems.id],
  }),
}));

export const taskOutcomeRelations = relations(taskOutcomes, ({ one, many }) => ({
  product: one(products, {
    fields: [taskOutcomes.productId],
    references: [products.id],
  }),
  task: one(tasks, {
    fields: [taskOutcomes.taskId],
    references: [tasks.id],
  }),
  contextPack: one(contextPacks, {
    fields: [taskOutcomes.contextPackId],
    references: [contextPacks.id],
  }),
  module: one(modules, {
    fields: [taskOutcomes.moduleId],
    references: [modules.id],
  }),
  feature: one(features, {
    fields: [taskOutcomes.featureId],
    references: [features.id],
  }),
  source: one(sources, {
    fields: [taskOutcomes.sourceId],
    references: [sources.id],
  }),
  creator: one(user, {
    fields: [taskOutcomes.createdBy],
    references: [user.id],
  }),
  candidates: many(decisionCaptureCandidates),
  knowledgeLinks: many(knowledgeTaskLinks),
  auditEvents: many(productAuditEvents),
}));

export const decisionCaptureCandidateRelations = relations(
  decisionCaptureCandidates,
  ({ one, many }) => ({
    outcome: one(taskOutcomes, {
      fields: [decisionCaptureCandidates.outcomeId],
      references: [taskOutcomes.id],
    }),
    product: one(products, {
      fields: [decisionCaptureCandidates.productId],
      references: [products.id],
    }),
    task: one(tasks, {
      fields: [decisionCaptureCandidates.taskId],
      references: [tasks.id],
    }),
    contextPack: one(contextPacks, {
      fields: [decisionCaptureCandidates.contextPackId],
      references: [contextPacks.id],
    }),
    source: one(sources, {
      fields: [decisionCaptureCandidates.sourceId],
      references: [sources.id],
    }),
    module: one(modules, {
      fields: [decisionCaptureCandidates.moduleId],
      references: [modules.id],
    }),
    feature: one(features, {
      fields: [decisionCaptureCandidates.featureId],
      references: [features.id],
    }),
    approvedKnowledgeItem: one(knowledgeItems, {
      fields: [decisionCaptureCandidates.approvedKnowledgeItemId],
      references: [knowledgeItems.id],
    }),
    auditEvents: many(productAuditEvents),
  }),
);

export const knowledgeTaskLinkRelations = relations(knowledgeTaskLinks, ({ one }) => ({
  product: one(products, {
    fields: [knowledgeTaskLinks.productId],
    references: [products.id],
  }),
  knowledgeItem: one(knowledgeItems, {
    fields: [knowledgeTaskLinks.knowledgeItemId],
    references: [knowledgeItems.id],
  }),
  task: one(tasks, {
    fields: [knowledgeTaskLinks.taskId],
    references: [tasks.id],
  }),
  contextPack: one(contextPacks, {
    fields: [knowledgeTaskLinks.contextPackId],
    references: [contextPacks.id],
  }),
  outcome: one(taskOutcomes, {
    fields: [knowledgeTaskLinks.outcomeId],
    references: [taskOutcomes.id],
  }),
  creator: one(user, {
    fields: [knowledgeTaskLinks.createdBy],
    references: [user.id],
  }),
}));

export const productAuditEventRelations = relations(productAuditEvents, ({ one }) => ({
  product: one(products, {
    fields: [productAuditEvents.productId],
    references: [products.id],
  }),
  module: one(modules, {
    fields: [productAuditEvents.moduleId],
    references: [modules.id],
  }),
  feature: one(features, {
    fields: [productAuditEvents.featureId],
    references: [features.id],
  }),
  source: one(sources, {
    fields: [productAuditEvents.sourceId],
    references: [sources.id],
  }),
  knowledgeItem: one(knowledgeItems, {
    fields: [productAuditEvents.knowledgeItemId],
    references: [knowledgeItems.id],
  }),
  task: one(tasks, {
    fields: [productAuditEvents.taskId],
    references: [tasks.id],
  }),
  contextPack: one(contextPacks, {
    fields: [productAuditEvents.contextPackId],
    references: [contextPacks.id],
  }),
  outcome: one(taskOutcomes, {
    fields: [productAuditEvents.outcomeId],
    references: [taskOutcomes.id],
  }),
  sourceExtraction: one(sourceExtractions, {
    fields: [productAuditEvents.sourceExtractionId],
    references: [sourceExtractions.id],
  }),
  sourceExtractionCandidate: one(sourceExtractionCandidates, {
    fields: [productAuditEvents.sourceExtractionCandidateId],
    references: [sourceExtractionCandidates.id],
  }),
  decisionCaptureCandidate: one(decisionCaptureCandidates, {
    fields: [productAuditEvents.decisionCaptureCandidateId],
    references: [decisionCaptureCandidates.id],
  }),
  conflict: one(knowledgeConflicts, {
    fields: [productAuditEvents.conflictId],
    references: [knowledgeConflicts.id],
  }),
  creator: one(user, {
    fields: [productAuditEvents.createdBy],
    references: [user.id],
  }),
}));

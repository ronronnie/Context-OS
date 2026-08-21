export function productRoute(productId: string) {
  return `/products/${productId}`;
}

export function moduleRoute(productId: string, moduleId: string) {
  return `/products/${productId}/modules/${moduleId}`;
}

export function featureRoute(
  productId: string,
  moduleId: string,
  featureId: string,
) {
  return `/products/${productId}/modules/${moduleId}/features/${featureId}`;
}

export function knowledgeRoute(
  productId: string,
  moduleId: string,
  featureId: string,
  knowledgeId: string,
) {
  return `${featureRoute(productId, moduleId, featureId)}/knowledge/${knowledgeId}`;
}

export function sourceRoute(productId: string, sourceId: string) {
  return `/products/${productId}/sources/${sourceId}`;
}

export function sourceExtractionRoute(
  productId: string,
  sourceId: string,
  extractionId: string,
) {
  return `${sourceRoute(productId, sourceId)}/extractions/${extractionId}`;
}

export function contextPackRoute(productId: string, contextPackId: string) {
  return `/products/${productId}/context-packs/${contextPackId}`;
}

export function taskOutcomeRoute(
  productId: string,
  contextPackId: string,
  outcomeId: string,
) {
  return `${contextPackRoute(productId, contextPackId)}/outcomes/${outcomeId}`;
}

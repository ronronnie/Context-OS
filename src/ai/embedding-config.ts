export const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";
export const DEFAULT_EMBEDDING_DIMENSIONS = 1536 as const;

export const embeddingModelDimensions = {
  "text-embedding-3-small": 1536,
  "text-embedding-3-large": 3072,
} as const;

export function getDefaultEmbeddingDimensions(model = DEFAULT_EMBEDDING_MODEL) {
  return embeddingModelDimensions[
    model as keyof typeof embeddingModelDimensions
  ] ?? DEFAULT_EMBEDDING_DIMENSIONS;
}

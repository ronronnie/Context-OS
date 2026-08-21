"use server";

import { revalidatePath } from "next/cache";

import {
  createFeatureRelationship,
  createKnowledgeRelationship,
  removeRelationship,
} from "@/db/queries";
import { requireUser } from "@/lib/auth/session";
import {
  parseFeatureRelationshipFormData,
  parseKnowledgeRelationshipFormData,
} from "@/lib/product-graph/relationships";
import { featureRoute, knowledgeRoute, productRoute } from "@/lib/routes";

export async function createFeatureRelationshipAction(
  productId: string,
  moduleId: string,
  featureId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const input = parseFeatureRelationshipFormData(formData);

  await createFeatureRelationship(
    {
      productId,
      fromFeatureId: featureId,
      toFeatureId: input.toFeatureId,
      relationshipType: input.relationshipType,
      reason: input.reason,
    },
    user.id,
  );

  revalidatePath(featureRoute(productId, moduleId, featureId));
  revalidatePath(productRoute(productId));
}

export async function createKnowledgeRelationshipAction(
  productId: string,
  moduleId: string,
  featureId: string,
  knowledgeItemId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const input = parseKnowledgeRelationshipFormData(formData);

  await createKnowledgeRelationship(
    {
      productId,
      fromKnowledgeId: knowledgeItemId,
      toKnowledgeId: input.toKnowledgeId,
      relationshipType: input.relationshipType,
      reason: input.reason,
    },
    user.id,
  );

  revalidatePath(knowledgeRoute(productId, moduleId, featureId, knowledgeItemId));
  revalidatePath(productRoute(productId));
}

export async function removeFeatureRelationshipAction(
  productId: string,
  moduleId: string,
  featureId: string,
  relationshipId: string,
  formData?: FormData,
) {
  void formData;
  const user = await requireUser();

  await removeRelationship(
    {
      productId,
      relationshipId,
      relationshipKind: "feature",
    },
    user.id,
  );

  revalidatePath(featureRoute(productId, moduleId, featureId));
  revalidatePath(productRoute(productId));
}

export async function removeKnowledgeRelationshipAction(
  productId: string,
  moduleId: string,
  featureId: string,
  knowledgeItemId: string,
  relationshipId: string,
  formData?: FormData,
) {
  void formData;
  const user = await requireUser();

  await removeRelationship(
    {
      productId,
      relationshipId,
      relationshipKind: "knowledge",
    },
    user.id,
  );

  revalidatePath(knowledgeRoute(productId, moduleId, featureId, knowledgeItemId));
  revalidatePath(productRoute(productId));
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createFeatureKnowledgeItem,
  transitionKnowledgeLifecycle,
  updateFeatureKnowledgeItem,
} from "@/db/queries";
import { requireUser } from "@/lib/auth/session";
import {
  parseKnowledgeFormData,
  parseLifecycleTransitionFormData,
} from "@/lib/product-memory/forms";
import { validateLifecycleTransition } from "@/lib/product-memory/knowledge-model";
import { featureRoute } from "@/lib/routes";

export async function createFeatureKnowledgeAction(
  productId: string,
  moduleId: string,
  featureId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const input = parseKnowledgeFormData(formData);

  validateLifecycleTransition({
    from: "proposed",
    to: input.lifecycleStatus,
    confirmed: input.confirmedRejected,
  });

  await createFeatureKnowledgeItem(
    {
      productId,
      moduleId,
      featureId,
      title: input.title,
      body: input.body,
      knowledgeType: input.knowledgeType,
      authority: input.authority,
      confidence: input.confidence,
      lifecycleStatus: input.lifecycleStatus,
      validFrom: input.validFrom,
      validUntil: input.validUntil,
      lastVerifiedAt: input.lastVerifiedAt,
      sourceIds: input.sourceIds,
    },
    user.id,
  );

  revalidatePath(featureRoute(productId, moduleId, featureId));
}

export async function updateFeatureKnowledgeAction(
  productId: string,
  moduleId: string,
  featureId: string,
  knowledgeItemId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const input = parseKnowledgeFormData(formData);

  await updateFeatureKnowledgeItem(
    knowledgeItemId,
    productId,
    featureId,
    user.id,
    {
      title: input.title,
      body: input.body,
      knowledgeType: input.knowledgeType,
      authority: input.authority,
      confidence: input.confidence,
      lifecycleStatus: input.lifecycleStatus,
      validFrom: input.validFrom,
      validUntil: input.validUntil,
      lastVerifiedAt: input.lastVerifiedAt,
      sourceIds: input.sourceIds,
      confirmedRejected: input.confirmedRejected,
    },
  );

  revalidatePath(featureRoute(productId, moduleId, featureId));
}

export async function transitionKnowledgeLifecycleAction(
  productId: string,
  moduleId: string,
  featureId: string,
  knowledgeItemId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const input = parseLifecycleTransitionFormData(formData);

  await transitionKnowledgeLifecycle(
    knowledgeItemId,
    productId,
    featureId,
    input.targetStatus,
    user.id,
    input.confirmedRejected,
  );

  revalidatePath(featureRoute(productId, moduleId, featureId));
  redirect(`${featureRoute(productId, moduleId, featureId)}/knowledge/${knowledgeItemId}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  approveDecisionCaptureCandidate,
  createTaskOutcomeForReview,
  rejectDecisionCaptureCandidate,
} from "@/db/queries";
import { requireUser } from "@/lib/auth/session";
import {
  parseDecisionCandidateReviewFormData,
  parseTaskOutcomeFormData,
} from "@/lib/decision-capture/model";
import { contextPackRoute, taskOutcomeRoute } from "@/lib/routes";

export async function createTaskOutcomeAction(
  productId: string,
  contextPackId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const input = parseTaskOutcomeFormData(formData);
  const outcome = await createTaskOutcomeForReview(
    productId,
    contextPackId,
    input,
    user.id,
  );

  revalidatePath(contextPackRoute(productId, contextPackId));
  redirect(taskOutcomeRoute(productId, contextPackId, outcome.id));
}

export async function approveDecisionCandidateAction(
  productId: string,
  contextPackId: string,
  outcomeId: string,
  candidateId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const edits = parseDecisionCandidateReviewFormData(formData);

  await approveDecisionCaptureCandidate(
    productId,
    contextPackId,
    outcomeId,
    candidateId,
    edits,
    user.id,
  );

  revalidatePath(taskOutcomeRoute(productId, contextPackId, outcomeId));
  revalidatePath(contextPackRoute(productId, contextPackId));
}

export async function rejectDecisionCandidateAction(
  productId: string,
  contextPackId: string,
  outcomeId: string,
  candidateId: string,
) {
  const user = await requireUser();

  await rejectDecisionCaptureCandidate(
    productId,
    contextPackId,
    outcomeId,
    candidateId,
    user.id,
  );

  revalidatePath(taskOutcomeRoute(productId, contextPackId, outcomeId));
}

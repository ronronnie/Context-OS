"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  approveAllPendingExtractionCandidates,
  approveExtractionCandidate,
  createSourceExtractionForReview,
  rejectExtractionCandidate,
} from "@/db/queries";
import { requireUser } from "@/lib/auth/session";
import { parseCandidateReviewFormData } from "@/lib/source-ingestion/review-forms";
import { sourceExtractionRoute, sourceRoute } from "@/lib/routes";

export async function startSourceExtractionAction(
  productId: string,
  sourceId: string,
) {
  const user = await requireUser();
  const extraction = await createSourceExtractionForReview(
    productId,
    sourceId,
    user.id,
  );

  revalidatePath(sourceRoute(productId, sourceId));
  redirect(sourceExtractionRoute(productId, sourceId, extraction.id));
}

export async function approveExtractionCandidateAction(
  productId: string,
  sourceId: string,
  extractionId: string,
  candidateId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const edits = parseCandidateReviewFormData(formData);

  await approveExtractionCandidate(
    productId,
    sourceId,
    extractionId,
    candidateId,
    edits,
    user.id,
  );

  revalidatePath(sourceExtractionRoute(productId, sourceId, extractionId));
  revalidatePath(sourceRoute(productId, sourceId));
}

export async function approveAllExtractionCandidatesAction(
  productId: string,
  sourceId: string,
  extractionId: string,
) {
  const user = await requireUser();

  await approveAllPendingExtractionCandidates(
    productId,
    sourceId,
    extractionId,
    user.id,
  );

  revalidatePath(sourceExtractionRoute(productId, sourceId, extractionId));
  revalidatePath(sourceRoute(productId, sourceId));
}

export async function rejectExtractionCandidateAction(
  productId: string,
  sourceId: string,
  extractionId: string,
  candidateId: string,
) {
  const user = await requireUser();

  await rejectExtractionCandidate(
    productId,
    sourceId,
    extractionId,
    candidateId,
    user.id,
  );

  revalidatePath(sourceExtractionRoute(productId, sourceId, extractionId));
}

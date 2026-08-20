"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSource } from "@/db/queries";
import { requireUser } from "@/lib/auth/session";
import { parseSourceFormData } from "@/lib/source-ingestion/forms";
import { sourceRoute } from "@/lib/routes";

export async function createSourceAction(formData: FormData) {
  const user = await requireUser();
  const input = parseSourceFormData(formData);
  const source = await createSource(input, user.id);

  revalidatePath("/sources");
  revalidatePath(sourceRoute(source.productId, source.id));
  redirect(sourceRoute(source.productId, source.id));
}

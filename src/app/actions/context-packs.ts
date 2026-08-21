"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createTaskAndGenerateContextPack,
  regenerateContextPackForTask,
} from "@/db/queries";
import { requireUser } from "@/lib/auth/session";
import { parseTaskFormData } from "@/lib/context-packs/forms";
import { contextPackRoute } from "@/lib/routes";

export async function createTaskAndGenerateContextPackAction(formData: FormData) {
  const user = await requireUser();
  const input = parseTaskFormData(formData);
  const { contextPack } = await createTaskAndGenerateContextPack(input, user.id);

  revalidatePath("/tasks");
  revalidatePath("/context-packs");
  redirect(contextPackRoute(contextPack.productId, contextPack.id));
}

export async function regenerateContextPackAction(
  productId: string,
  taskId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const taskIntent = String(formData.get("taskIntent") ?? "design");
  const pack = await regenerateContextPackForTask(
    productId,
    taskId,
    user.id,
    taskIntent === "build" ||
      taskIntent === "review" ||
      taskIntent === "research" ||
      taskIntent === "debug"
      ? taskIntent
      : "design",
  );

  revalidatePath("/tasks");
  revalidatePath("/context-packs");
  redirect(contextPackRoute(productId, pack.id));
}

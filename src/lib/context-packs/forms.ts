import { z } from "zod";

export const taskIntentOptions = [
  { value: "design", label: "Design" },
  { value: "build", label: "Build" },
  { value: "review", label: "Review" },
  { value: "research", label: "Research" },
  { value: "debug", label: "Debug" },
] as const;

export type TaskIntent = (typeof taskIntentOptions)[number]["value"];

const taskFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(120),
  description: z.string().trim().min(1, "Description is required.").max(2000),
  productId: z.string().uuid("Choose a valid product."),
  primaryFeatureId: z.string().uuid().optional(),
  taskIntent: z.enum(taskIntentOptions.map((option) => option.value) as [
    TaskIntent,
    ...TaskIntent[],
  ]),
});

export function parseTaskFormData(formData: FormData) {
  const primaryFeatureId = String(formData.get("primaryFeatureId") ?? "").trim();

  return taskFormSchema.parse({
    title: formData.get("title"),
    description: formData.get("description"),
    productId: formData.get("productId"),
    primaryFeatureId: primaryFeatureId || undefined,
    taskIntent: formData.get("taskIntent") ?? "design",
  });
}

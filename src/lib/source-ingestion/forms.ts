import { z } from "zod";

import { sourceTypes } from "@/lib/source-ingestion/source-model";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || null);

const metadataSchema = z
  .string()
  .trim()
  .optional()
  .transform((value, context) => {
    if (!value) {
      return {};
    }

    try {
      const parsed = JSON.parse(value);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
        context.addIssue({
          code: "custom",
          message: "Metadata must be a JSON object.",
        });
        return z.NEVER;
      }
      return parsed as Record<string, unknown>;
    } catch {
      context.addIssue({
        code: "custom",
        message: "Metadata must be valid JSON.",
      });
      return z.NEVER;
    }
  });

const sourceFormSchema = z.object({
  productId: z.string().trim().min(1, "Product is required."),
  moduleId: optionalText,
  featureId: optionalText,
  name: z.string().trim().min(1, "Name is required."),
  sourceType: z.enum(sourceTypes),
  url: optionalText,
  rawContent: z.string().trim().min(1, "Raw content is required."),
  metadata: metadataSchema,
});

export function parseSourceFormData(formData: FormData) {
  return sourceFormSchema.parse(Object.fromEntries(formData));
}

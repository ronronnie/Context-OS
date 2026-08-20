import { z } from "zod";

const productInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  description: z.string().trim().default(""),
});

const moduleInputSchema = productInputSchema.extend({
  position: z.coerce.number().int().min(0).default(0),
});

const featureStatusSchema = z.enum(["active", "planned", "deprecated", "archived"]);

const featureInputSchema = productInputSchema.extend({
  position: z.coerce.number().int().min(0).default(0),
  status: featureStatusSchema.default("active"),
});

export type ProductArchitectureFeatureStatus = z.infer<typeof featureStatusSchema>;

export function parseProductFormData(formData: FormData) {
  return productInputSchema.parse(Object.fromEntries(formData));
}

export function parseModuleFormData(formData: FormData) {
  return moduleInputSchema.parse(Object.fromEntries(formData));
}

export function parseFeatureFormData(formData: FormData) {
  return featureInputSchema.parse(Object.fromEntries(formData));
}

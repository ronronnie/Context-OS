"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createFeature,
  createModule,
  createProduct,
  updateFeature,
  updateModule,
  updateProduct,
} from "@/db/queries";
import { requireUser } from "@/lib/auth/session";
import {
  parseFeatureFormData,
  parseModuleFormData,
  parseProductFormData,
} from "@/lib/product-architecture/forms";
import { featureRoute, moduleRoute, productRoute } from "@/lib/routes";

export async function createProductAction(formData: FormData) {
  const user = await requireUser();
  const input = parseProductFormData(formData);
  const product = await createProduct(input, user.id);

  revalidatePath("/products");
  redirect(productRoute(product.id));
}

export async function updateProductAction(productId: string, formData: FormData) {
  const user = await requireUser();
  const input = parseProductFormData(formData);
  await updateProduct(productId, input, user.id);

  revalidatePath(productRoute(productId));
}

export async function createModuleAction(productId: string, formData: FormData) {
  const user = await requireUser();
  const input = parseModuleFormData(formData);
  const productModule = await createModule({ ...input, productId }, user.id);

  revalidatePath(productRoute(productId));
  redirect(moduleRoute(productId, productModule.id));
}

export async function updateModuleAction(
  productId: string,
  moduleId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const input = parseModuleFormData(formData);
  await updateModule(moduleId, productId, input, user.id);

  revalidatePath(productRoute(productId));
  revalidatePath(moduleRoute(productId, moduleId));
}

export async function createFeatureAction(
  productId: string,
  moduleId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const input = parseFeatureFormData(formData);
  const feature = await createFeature(
    {
      ...input,
      productId,
      moduleId,
    },
    user.id,
  );

  revalidatePath(moduleRoute(productId, moduleId));
  redirect(featureRoute(productId, moduleId, feature.id));
}

export async function updateFeatureAction(
  productId: string,
  moduleId: string,
  featureId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const input = parseFeatureFormData(formData);
  await updateFeature(featureId, productId, input, user.id);

  revalidatePath(moduleRoute(productId, moduleId));
  revalidatePath(featureRoute(productId, moduleId, featureId));
}

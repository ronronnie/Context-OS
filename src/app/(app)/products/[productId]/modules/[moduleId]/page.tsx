import Link from "next/link";
import { notFound } from "next/navigation";

import {
  createFeatureAction,
  updateModuleAction,
} from "@/app/actions/product-architecture";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  getFeaturesForModule,
  getModule,
  getProduct,
} from "@/db/queries";
import { requireUser } from "@/lib/auth/session";
import { featureRoute, productRoute } from "@/lib/routes";

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ productId: string; moduleId: string }>;
}) {
  const user = await requireUser();
  const { productId, moduleId } = await params;
  const [product, module, moduleFeatures] = await Promise.all([
    getProduct(productId, user.id),
    getModule(moduleId, productId, user.id),
    getFeaturesForModule(moduleId, productId, user.id),
  ]);

  if (!product || !module) {
    notFound();
  }

  const updateModule = updateModuleAction.bind(null, productId, moduleId);
  const createFeature = createFeatureAction.bind(null, productId, moduleId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${product.name} / Module`}
        title={module.name}
        description={module.description || "No module description yet."}
        actions={[]}
      />

      <div className="text-sm text-[var(--muted)]">
        <Link className="font-medium text-[var(--accent-strong)]" href={productRoute(productId)}>
          {product.name}
        </Link>{" "}
        / {module.name}
      </div>

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <form
            action={updateModule}
            className="rounded-md border border-[var(--border)] bg-[var(--panel)]"
          >
            <SectionHeader
              title="Edit module"
              description="Position controls the module order inside this product."
            />
            <div className="space-y-4 p-4">
              <label className="block">
                <span className="text-sm font-medium">Name</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                  defaultValue={module.name}
                  name="name"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Description</span>
                <textarea
                  className="mt-1 min-h-20 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                  defaultValue={module.description}
                  name="description"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Position</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                  defaultValue={module.position}
                  min={0}
                  name="position"
                  type="number"
                />
              </label>
              <Button type="submit">Save module</Button>
            </div>
          </form>

          <form
            action={createFeature}
            className="rounded-md border border-[var(--border)] bg-[var(--panel)]"
          >
            <SectionHeader
              title="Create feature"
              description="Features are the main unit for task-specific Product Memory."
            />
            <div className="space-y-4 p-4">
              <label className="block">
                <span className="text-sm font-medium">Name</span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                  name="name"
                  required
                  placeholder="Bulk Review"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Description</span>
                <textarea
                  className="mt-1 min-h-20 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                  name="description"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium">Status</span>
                  <select
                    className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                    defaultValue="active"
                    name="status"
                  >
                    <option value="active">Active</option>
                    <option value="planned">Planned</option>
                    <option value="deprecated">Deprecated</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Position</span>
                  <input
                    className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                    defaultValue={moduleFeatures.length + 1}
                    min={0}
                    name="position"
                    type="number"
                  />
                </label>
              </div>
              <Button type="submit">Create feature</Button>
            </div>
          </form>
        </div>

        <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
          <SectionHeader
            title="Features"
            description="Open a feature to inspect its Product Memory workspace."
          />
          {moduleFeatures.length ? (
            <div className="divide-y divide-[var(--border)]">
              {moduleFeatures.map((feature) => (
                <Link
                  className="grid gap-3 p-4 transition hover:bg-[var(--panel-subtle)] md:grid-cols-[48px_1fr_120px]"
                  href={featureRoute(productId, moduleId, feature.id)}
                  key={feature.id}
                >
                  <span className="text-sm text-[var(--muted)]">
                    #{feature.position}
                  </span>
                  <div>
                    <h2 className="font-medium">{feature.name}</h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      {feature.description || "No feature description yet."}
                    </p>
                  </div>
                  <StatusBadge status={feature.status} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <EmptyState
                title="No features in this module"
                description="Create the first feature before adding feature-level knowledge, sources, tasks, or Context Packs."
              />
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

import Link from "next/link";

import { createProductAction } from "@/app/actions/product-architecture";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { PRODUCT_NAME } from "@/config/product";
import { getProductsForUser } from "@/db/queries";
import { requireUser } from "@/lib/auth/session";
import { productRoute } from "@/lib/routes";

export default async function ProductsPage() {
  const user = await requireUser();
  const products = await getProductsForUser(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Product Architecture"
        title="Products"
        description={`Create and manage the mature products whose modules, features, sources, and verified memory form ${PRODUCT_NAME}.`}
        actions={[]}
      />

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form
          action={createProductAction}
          className="rounded-md border border-[var(--border)] bg-[var(--panel)]"
        >
          <SectionHeader
            title="Create product"
            description="Start with a product owner boundary before adding modules or features."
          />
          <div className="space-y-4 p-4">
            <label className="block">
              <span className="text-sm font-medium">Name</span>
              <input
                className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                name="name"
                required
                placeholder="Nextzen Demo"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Description</span>
              <textarea
                className="mt-1 min-h-24 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                name="description"
                placeholder="What product context should AI understand?"
              />
            </label>
            <Button type="submit">Create product</Button>
          </div>
        </form>

        <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
          <SectionHeader
            title="Product list"
            description="Products are isolated by authenticated owner."
          />
          {products.length ? (
            <div className="divide-y divide-[var(--border)]">
              {products.map((product) => (
                <Link
                  className="block p-4 transition hover:bg-[var(--panel-subtle)]"
                  href={productRoute(product.id)}
                  key={product.id}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="font-medium">{product.name}</h2>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                        {product.description || "No description yet."}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--muted)]">
                      Updated {product.updatedAt.toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <EmptyState
                title="No products yet"
                description="Create the first product before mapping modules, features, sources, and knowledge."
              />
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

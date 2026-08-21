import Link from "next/link";

import { createTaskAndGenerateContextPackAction } from "@/app/actions/context-packs";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { getTaskCreationOptions, getTasksForUser } from "@/db/queries";
import { requireUser } from "@/lib/auth/session";
import { taskIntentOptions } from "@/lib/context-packs/forms";
import { contextPackRoute } from "@/lib/routes";

export default async function TasksPage() {
  const user = await requireUser();
  const [options, taskRows] = await Promise.all([
    getTaskCreationOptions(user.id),
    getTasksForUser(user.id),
  ]);
  const productById = new Map(options.products.map((product) => [product.id, product]));
  const latestTaskRows = Array.from(
    taskRows.reduce((rows, row) => {
      if (!rows.has(row.task.id)) {
        rows.set(row.task.id, row);
      }

      return rows;
    }, new Map<string, (typeof taskRows)[number]>()),
  ).map(([, row]) => row);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tasks"
        title="Create task and generate Context Pack"
        description="Turn a specific product request into source-backed AI context."
        actions={[]}
      />

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form
          action={createTaskAndGenerateContextPackAction}
          className="rounded-md border border-[var(--border)] bg-[var(--panel)]"
        >
          <SectionHeader
            title="New task"
            description="Describe the work and Context OS will retrieve Product Memory for it."
          />
          <div className="space-y-4 p-4">
            <label className="block">
              <span className="text-sm font-medium">Title</span>
              <input
                className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                name="title"
                placeholder="Add bulk approval"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Description</span>
              <textarea
                className="mt-1 min-h-28 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                name="description"
                placeholder="I want to add bulk approval to Progress Report Review."
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Product</span>
              <select
                className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                name="productId"
                required
              >
                <option value="">Choose product</option>
                {options.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Primary feature</span>
              <select
                className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                name="primaryFeatureId"
              >
                <option value="">No primary feature</option>
                {options.features.map((feature) => (
                  <option key={feature.id} value={feature.id}>
                    {productById.get(feature.productId)?.name ?? "Product"} / {feature.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Task intent</span>
              <select
                className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-[#99f6e4]"
                defaultValue="design"
                name="taskIntent"
              >
                {taskIntentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <Button disabled={!options.products.length} type="submit">
              Generate Context Pack
            </Button>
          </div>
        </form>

        <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
          <SectionHeader
            title="Task history"
            description="Each generated Context Pack remains available as historical output."
          />
          {latestTaskRows.length ? (
            <div className="divide-y divide-[var(--border)]">
              {latestTaskRows.map((row) => (
                <article className="p-4" key={row.task.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <TaskStatusBadge status={row.task.status} />
                    <span className="text-xs text-[var(--muted)]">
                      {row.product.name}
                    </span>
                    {row.feature ? (
                      <span className="text-xs text-[var(--muted)]">
                        {row.feature.name}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-sm font-semibold">{row.task.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                    {row.task.description}
                  </p>
                  {row.latestPack ? (
                    <Link
                      className="mt-3 inline-flex text-sm font-medium text-[var(--accent-strong)]"
                      href={contextPackRoute(row.latestPack.productId, row.latestPack.id)}
                    >
                      Open Context Pack v{row.latestPack.version}
                    </Link>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <EmptyState
                title="No tasks yet"
                description="Create the first task to generate a Context Pack."
              />
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

function TaskStatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex min-h-6 items-center rounded-md border border-[#99f6e4] bg-[#ccfbf1] px-2 py-0.5 text-xs font-medium text-[#134e4a]">
      {status.replaceAll("_", " ")}
    </span>
  );
}

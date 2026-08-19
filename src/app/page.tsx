import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Database,
  FileCheck2,
  Layers3,
  Link2,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ContextPackBuilder } from "@/components/context-pack-builder";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRODUCT_NAME } from "@/config/product";
import {
  demoContextPacks,
  demoKnowledge,
  demoModules,
  demoProduct,
  demoSources,
} from "@/lib/demo-data";

const memoryCounts = [
  { label: "Modules", value: demoModules.length, icon: Layers3 },
  {
    label: "Verified memory",
    value: demoKnowledge.filter((item) => item.status === "verified").length,
    icon: ShieldCheck,
  },
  { label: "Sources", value: demoSources.length, icon: FileCheck2 },
  { label: "Context Packs", value: demoContextPacks.length, icon: BookOpenCheck },
];

const loopSteps = [
  "Create product",
  "Map modules and features",
  "Add sources",
  "Extract structured memory",
  "Human verifies claims",
  "Generate task context",
  "Export pack",
  "Capture decisions back",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-[var(--line)] bg-[#12312f] px-5 py-5 text-white lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#99f6e4] text-[#12312f]">
              <BrainCircuit className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-sm text-teal-100">Working name</p>
              <h1 className="text-xl font-semibold tracking-normal">{PRODUCT_NAME}</h1>
            </div>
          </div>

          <nav className="mt-8 space-y-1" aria-label="Workspace">
            {[
              ["Product Memory", Database],
              ["Product Graph", Network],
              ["Sources", Link2],
              ["Context Packs", Sparkles],
            ].map(([label, Icon]) => (
              <a
                key={label as string}
                href={`#${String(label).toLowerCase().replaceAll(" ", "-")}`}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-teal-50 transition hover:bg-white/10"
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label as string}
              </a>
            ))}
          </nav>

          <div className="mt-10 rounded-md border border-white/15 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-teal-100">
              Core promise
            </p>
            <p className="mt-3 text-sm leading-6 text-white">
              Give AI the product memory it needs before it works on an existing
              feature.
            </p>
          </div>
        </aside>

        <section className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6">
            <header className="flex flex-col gap-4 border-b border-[var(--line)] pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="default">Demo product</Badge>
                  <Badge variant="outline">Fictional data only</Badge>
                  <Badge variant="outline">Verification required</Badge>
                </div>
                <h2 className="mt-3 text-3xl font-semibold tracking-normal text-[#171717] sm:text-4xl">
                  {demoProduct.name} product memory
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-muted)] sm:text-base">
                  A feature-aware workspace for mapping mature product context,
                  preserving evidence, surfacing contradictions, and exporting
                  task-specific Context Packs to AI tools.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--ink-muted)]">
                <Clock3 className="h-4 w-4 text-[var(--accent)]" aria-hidden />
                Updated today from verified demo sources
              </div>
            </header>

            <section
              id="product-memory"
              className="grid grid-cols-2 gap-3 md:grid-cols-4"
              aria-label="Product memory metrics"
            >
              {memoryCounts.map(({ label, value, icon: Icon }) => (
                <Card key={label}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-2xl font-semibold">{value}</p>
                      <p className="mt-1 text-sm text-[var(--ink-muted)]">{label}</p>
                    </div>
                    <Icon className="h-5 w-5 text-[var(--accent)]" aria-hidden />
                  </CardContent>
                </Card>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
              <div className="space-y-6">
                <Card id="product-graph">
                  <CardHeader>
                    <div>
                      <p className="text-sm font-medium text-[var(--accent-strong)]">
                        Product Graph
                      </p>
                      <CardTitle>Modules, features, flows, and live memory</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {demoModules.map((module) => (
                      <div
                        key={module.id}
                        className="rounded-md border border-[var(--line)] bg-[var(--panel-muted)] p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-base font-semibold">{module.name}</h3>
                            <p className="mt-1 text-sm leading-6 text-[var(--ink-muted)]">
                              {module.description}
                            </p>
                          </div>
                          <Badge variant={module.risk === "high" ? "warning" : "outline"}>
                            {module.risk} change risk
                          </Badge>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {module.features.map((feature) => (
                            <div
                              key={feature.id}
                              className="rounded-md border border-[var(--line)] bg-white p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium">{feature.name}</p>
                                  <p className="mt-1 text-sm leading-5 text-[var(--ink-muted)]">
                                    {feature.currentState}
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    feature.status === "current" ? "success" : "warning"
                                  }
                                >
                                  {feature.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card id="sources">
                  <CardHeader>
                    <div>
                      <p className="text-sm font-medium text-[var(--accent-strong)]">
                        Evidence and Authority
                      </p>
                      <CardTitle>Source-backed claims remain inspectable</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 lg:grid-cols-3">
                      {demoSources.map((source) => (
                        <div
                          key={source.id}
                          className="rounded-md border border-[var(--line)] bg-[var(--panel-muted)] p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <Badge variant="outline">{source.type}</Badge>
                            <span className="text-xs text-[var(--ink-muted)]">
                              {source.date}
                            </span>
                          </div>
                          <h3 className="mt-3 text-sm font-semibold leading-5">
                            {source.title}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                            Authority: {source.authority}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div>
                      <p className="text-sm font-medium text-[var(--accent-strong)]">
                        MVP Loop
                      </p>
                      <CardTitle>Every exported pack creates a memory update path</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      {loopSteps.map((step, index) => (
                        <div
                          key={step}
                          className="flex items-center gap-3 rounded-md border border-[var(--line)] bg-white p-3"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#ccfbf1] text-sm font-semibold text-[#134e4a]">
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium">{step}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <ContextPackBuilder />

                <Card>
                  <CardHeader>
                    <div>
                      <p className="text-sm font-medium text-[var(--accent-strong)]">
                        Verification Queue
                      </p>
                      <CardTitle>Human review before trusted memory</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {demoKnowledge.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-md border border-[var(--line)] bg-white p-3"
                      >
                        <div className="flex items-start gap-3">
                          {item.status === "verified" ? (
                            <CheckCircle2
                              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]"
                              aria-hidden
                            />
                          ) : (
                            <AlertTriangle
                              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]"
                              aria-hidden
                            />
                          )}
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant={
                                  item.status === "verified" ? "success" : "warning"
                                }
                              >
                                {item.status}
                              </Badge>
                              <Badge variant="outline">{item.type}</Badge>
                            </div>
                            <p className="mt-2 text-sm leading-6">{item.claim}</p>
                            <p className="mt-2 text-xs text-[var(--ink-muted)]">
                              Evidence: {item.sources.join(", ")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>

            <section
              id="context-packs"
              className="grid gap-4 border-t border-[var(--line)] py-5 md:grid-cols-3"
            >
              {demoContextPacks.map((pack) => (
                <Card key={pack.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="default">{pack.destination}</Badge>
                      <Search className="h-4 w-4 text-[var(--accent)]" aria-hidden />
                    </div>
                    <h3 className="mt-3 font-semibold">{pack.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                      {pack.summary}
                    </p>
                    <a
                      className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent-strong)]"
                      href="#generate-pack"
                    >
                      Generate similar pack
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </a>
                  </CardContent>
                </Card>
              ))}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

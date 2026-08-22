import {
  Boxes,
  BrainCircuit,
  Database,
  FileText,
  FolderKanban,
  Home,
  Layers3,
  ListChecks,
  Settings,
  Sparkles,
} from "lucide-react";

import { PRODUCT_NAME } from "@/config/product";
import type { NavItem, RouteContent } from "@/types/app";

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Products", href: "/products", icon: FolderKanban },
  { label: "Modules", href: "/modules", icon: Boxes },
  { label: "Features", href: "/features", icon: Layers3 },
  { label: "Sources", href: "/sources", icon: FileText },
  { label: "Knowledge", href: "/knowledge", icon: Database },
  { label: "Tasks", href: "/tasks", icon: ListChecks },
  { label: "Context Packs", href: "/context-packs", icon: Sparkles },
  { label: "Intelligence", href: "/intelligence", icon: BrainCircuit },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const demoProduct = {
  name: "Nextzen Ops",
  slug: "nextzen-ops",
  description: `Fictional mature internal operations product used for ${PRODUCT_NAME} MVP workflows.`,
};

export const moduleSummaries = [
  {
    name: "Approvals",
    description:
      "Review queues, exception approvals, bulk actions, manager notes, and escalation paths.",
    authority: 86,
    freshness: 72,
  },
  {
    name: "Policy Engine",
    description:
      "Rules, permissions, limits, explainability surfaces, and compliance constraints.",
    authority: 81,
    freshness: 77,
  },
  {
    name: "Audit Trail",
    description:
      "Immutable decision history, event provenance, exports, and historical reconstruction.",
    authority: 91,
    freshness: 68,
  },
];

export const dashboardStats = [
  { label: "Products", value: "1", detail: "Fictional demo workspace" },
  { label: "Mapped modules", value: "3", detail: "Approvals, Policy, Audit" },
  { label: "Verified memory", value: "42", detail: "Ready for retrieval" },
  { label: "Needs review", value: "9", detail: "Human verification required" },
];

export const timelineRows = [
  {
    title: "Bulk approval constraint extracted",
    description:
      "AI draft captured a low-risk-only constraint from product policy notes.",
    time: "Today",
    status: "needs_review" as const,
  },
  {
    title: "Audit immutability decision verified",
    description:
      "Accepted architecture decision linked to source evidence and Product Graph objects.",
    time: "Yesterday",
    status: "verified" as const,
  },
  {
    title: "Context Pack exported",
    description:
      "Task pack for expense exception redesign included current state, constraints, and rejected options.",
    time: "2 days ago",
    status: "exported" as const,
  },
];

export const routeContent: Record<string, RouteContent> = {
  products: {
    eyebrow: "Workspace",
    title: "Products",
    description:
      "Manage mature software products whose modules, features, decisions, sources, and history form Product Memory.",
    primaryAction: "Create product",
    emptyTitle: "No additional products yet",
    emptyDescription:
      "Start with one fictional product until the memory loop is reliable. Real employer data should not be ingested into the MVP dataset.",
    sections: [
      {
        title: demoProduct.name,
        description: demoProduct.description,
        status: "current",
        chips: ["3 modules", "42 verified memories", "9 review items"],
      },
    ],
  },
  modules: {
    eyebrow: "Product Graph",
    title: "Modules",
    description:
      "Map stable product areas so retrieval can understand where a task lives and which neighboring systems it touches.",
    primaryAction: "Add module",
    emptyTitle: "No unmapped module gaps",
    emptyDescription:
      "Modules should remain explicit relational entities, not loose tags hidden in document chunks.",
    sections: moduleSummaries.map((module) => ({
      title: module.name,
      description: module.description,
      status: "current",
      chips: [`Authority ${module.authority}%`, `Freshness ${module.freshness}%`],
    })),
  },
  features: {
    eyebrow: "Product Graph",
    title: "Features",
    description:
      "Track what exists today, how features changed over time, which patterns are canonical, and what is allowed to change.",
    primaryAction: "Add feature",
    emptyTitle: "Feature mapping needs more detail",
    emptyDescription:
      "The next implementation phase should connect features to modules, screens, flows, components, APIs, roles, and permissions.",
    sections: [
      {
        title: "Expense exception review",
        description:
          "Single-item review with policy evidence, manager notes, and immutable decision events.",
        status: "verified",
        chips: ["Approvals", "Audit Trail", "Policy evidence"],
      },
      {
        title: "Bulk approval actions",
        description:
          "Planned workflow for low-risk exception batches with audit-safe constraints.",
        status: "needs_review",
        chips: ["Approvals", "Permissions", "Context Pack candidate"],
      },
    ],
  },
  sources: {
    eyebrow: "Evidence",
    title: "Sources",
    description:
      "Store source material with authority, freshness, date, locator, and evidence links for every important claim.",
    primaryAction: "Add source",
    emptyTitle: "No source import running",
    emptyDescription:
      "Manual fictional sources are enough for the MVP. Figma is a later integration after the core loop works.",
    sections: [
      {
        title: "ADR-014: Keep approval history immutable",
        description:
          "Accepted architecture decision used as high-authority evidence for audit memory.",
        status: "verified",
        chips: ["ADR", "2025-11-04", "Authority high"],
      },
      {
        title: "Expense exception delegation policy",
        description:
          "Current product rule for override permissions and high-risk exception handling.",
        status: "current",
        chips: ["Policy", "2026-05-12", "Current rule"],
      },
    ],
  },
  knowledge: {
    eyebrow: "Product Memory",
    title: "Knowledge",
    description:
      "Review structured memory objects covering current state, decisions, history, relationships, constraints, and evidence.",
    primaryAction: "Extract memory",
    emptyTitle: "No trusted memory without review",
    emptyDescription:
      "AI-extracted claims stay in review until a human verifies them and evidence is attached.",
    sections: [
      {
        title: "Bulk approval is low-risk only",
        description:
          "High-risk expense exceptions require item-level justification and cannot be silently batched.",
        status: "verified",
        chips: ["Constraint", "Sources: POL-77, ADR-014"],
      },
      {
        title: "Second confirmation above 25 employees",
        description:
          "Possible finance-admin rule captured from policy notes. Needs human confirmation before trusted retrieval.",
        status: "needs_review",
        chips: ["Constraint", "Needs verification"],
      },
    ],
  },
  tasks: {
    eyebrow: "Retrieval",
    title: "Tasks",
    description:
      "Capture user intent such as designing a feature, changing a flow, or auditing a decision before generating a Context Pack.",
    primaryAction: "Create task",
    emptyTitle: "No active tasks",
    emptyDescription:
      "A task should identify relevant modules, features, constraints, historical decisions, and source evidence before AI work begins.",
    sections: [
      {
        title: "Design bulk approval for expense exceptions",
        description:
          "Task should retrieve approval, policy, audit, permission, and rejected automation memory.",
        status: "current",
        chips: ["Codex", "5 memories matched", "Ready to pack"],
      },
    ],
  },
  contextPacks: {
    eyebrow: "Export",
    title: "Context Packs",
    description:
      "Generate task-specific source-backed packets that can be copied into Codex, Claude, ChatGPT, or similar tools.",
    primaryAction: "Generate pack",
    emptyTitle: "No pack selected",
    emptyDescription:
      "Context Packs are not chat threads. They are compiled product memory with evidence and explicit follow-up capture.",
    sections: [
      {
        title: "Bulk expense approval redesign",
        description:
          "Current state, constraints, related modules, source IDs, contradictions, and capture-back prompts.",
        status: "exported",
        chips: ["Codex", "Markdown", "Source-backed"],
      },
    ],
  },
  settings: {
    eyebrow: PRODUCT_NAME,
    title: "Settings",
    description:
      "Configure product naming, auth placeholders, AI provider settings, retrieval defaults, and integration boundaries.",
    primaryAction: "Review environment",
    emptyTitle: "No integrations enabled",
    emptyDescription:
      "Neon and the AI provider are configured by environment variables. Do not commit secrets.",
    sections: [
      {
        title: "AI provider abstraction",
        description:
          "Business logic should call the provider interface rather than binding directly to OpenAI, Anthropic, or any single vendor.",
        status: "current",
        chips: ["Model env vars", "Embedding env vars", "Provider-neutral"],
      },
    ],
  },
};

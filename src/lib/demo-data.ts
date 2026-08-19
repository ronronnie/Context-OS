export type MemoryStatus = "draft" | "needs_review" | "verified" | "superseded";
export type KnowledgeType =
  | "current_state"
  | "decision"
  | "history"
  | "constraint"
  | "relationship"
  | "pattern";

export type DemoKnowledgeItem = {
  id: string;
  type: KnowledgeType;
  status: MemoryStatus;
  claim: string;
  module: string;
  feature: string;
  authority: number;
  recency: number;
  sources: string[];
  tags: string[];
};

export const demoProduct = {
  id: "nextzen-ops",
  name: "Nextzen Ops",
  description:
    "A fictional internal operations product for approvals, exceptions, spend controls, and support workflows.",
};

export const demoModules = [
  {
    id: "approvals",
    name: "Approvals",
    description:
      "Admin and manager workflows for reviewing policy exceptions, bulk actions, and escalation paths.",
    risk: "high",
    features: [
      {
        id: "expense-exceptions",
        name: "Expense exception review",
        status: "current",
        currentState:
          "Single-item review exists with inline policy evidence and manager override notes.",
      },
      {
        id: "bulk-actions",
        name: "Bulk approval actions",
        status: "planned",
        currentState:
          "Bulk actions are approved for low-risk exceptions only and require audit export.",
      },
    ],
  },
  {
    id: "policy",
    name: "Policy Engine",
    description:
      "Rules, constraints, and explainability surfaces for spend, roles, limits, and compliance checks.",
    risk: "medium",
    features: [
      {
        id: "rule-explanations",
        name: "Rule explanations",
        status: "current",
        currentState:
          "Every exception shows the triggered policy, threshold, owner, and source rule.",
      },
      {
        id: "role-overrides",
        name: "Role-based overrides",
        status: "current",
        currentState:
          "Finance admins can override; team managers can approve only within assigned cost centers.",
      },
    ],
  },
  {
    id: "audit",
    name: "Audit Trail",
    description:
      "Time-aware evidence of who changed what, why, and which product rules applied at the time.",
    risk: "high",
    features: [
      {
        id: "decision-log",
        name: "Decision log",
        status: "current",
        currentState:
          "Approval, rejection, override, and comment events are immutable after submission.",
      },
      {
        id: "export",
        name: "Regulatory export",
        status: "current",
        currentState:
          "CSV and PDF exports include actor, timestamp, policy reason, and source records.",
      },
    ],
  },
];

export const demoSources = [
  {
    id: "ADR-014",
    type: "ADR",
    title: "ADR-014: Keep approval history immutable",
    date: "2025-11-04",
    authority: "Accepted architecture decision",
  },
  {
    id: "UX-221",
    type: "Research",
    title: "Manager review usability findings",
    date: "2026-02-18",
    authority: "Current research synthesis",
  },
  {
    id: "POL-77",
    type: "Policy",
    title: "Expense exception delegation policy",
    date: "2026-05-12",
    authority: "Current product rule",
  },
];

export const demoKnowledge: DemoKnowledgeItem[] = [
  {
    id: "mem-001",
    type: "constraint",
    status: "verified",
    claim:
      "Bulk approval can only apply to low-risk exceptions because high-risk exceptions require item-level justification.",
    module: "Approvals",
    feature: "Bulk approval actions",
    authority: 0.96,
    recency: 0.94,
    sources: ["POL-77", "ADR-014"],
    tags: ["bulk", "approval", "exception", "risk", "policy"],
  },
  {
    id: "mem-002",
    type: "decision",
    status: "verified",
    claim:
      "Approval history is immutable after submission so audit exports can reconstruct the exact rule state at decision time.",
    module: "Audit Trail",
    feature: "Decision log",
    authority: 0.98,
    recency: 0.81,
    sources: ["ADR-014"],
    tags: ["audit", "history", "immutable", "decision", "export"],
  },
  {
    id: "mem-003",
    type: "current_state",
    status: "verified",
    claim:
      "The existing single-item review pattern places policy evidence directly beside the approve and reject controls.",
    module: "Approvals",
    feature: "Expense exception review",
    authority: 0.9,
    recency: 0.9,
    sources: ["UX-221"],
    tags: ["approval", "review", "policy", "evidence", "pattern"],
  },
  {
    id: "mem-004",
    type: "constraint",
    status: "needs_review",
    claim:
      "Finance admins may need a second confirmation step when a bulk action affects more than 25 employees.",
    module: "Policy Engine",
    feature: "Role-based overrides",
    authority: 0.72,
    recency: 0.86,
    sources: ["POL-77"],
    tags: ["finance", "bulk", "confirmation", "permission", "policy"],
  },
  {
    id: "mem-005",
    type: "relationship",
    status: "verified",
    claim:
      "Bulk approval touches approvals, policy explanations, role permissions, notification copy, and audit exports.",
    module: "Approvals",
    feature: "Bulk approval actions",
    authority: 0.88,
    recency: 0.82,
    sources: ["ADR-014", "UX-221", "POL-77"],
    tags: ["bulk", "approval", "policy", "permissions", "audit", "notifications"],
  },
  {
    id: "mem-006",
    type: "history",
    status: "verified",
    claim:
      "A 2025 proposal to auto-approve recurring exceptions was rejected because managers still needed visibility into policy drift.",
    module: "Approvals",
    feature: "Expense exception review",
    authority: 0.86,
    recency: 0.7,
    sources: ["ADR-014"],
    tags: ["rejected", "auto-approve", "manager", "policy", "history"],
  },
];

export const demoContextPacks = [
  {
    id: "pack-001",
    title: "Bulk expense approval redesign",
    destination: "Codex",
    summary:
      "Relevant constraints, existing patterns, affected modules, and audit requirements for implementing bulk approval safely.",
  },
  {
    id: "pack-002",
    title: "Policy explanation copy refresh",
    destination: "Claude",
    summary:
      "Current rule explanation pattern, user research findings, and decision history for revising manager-facing copy.",
  },
  {
    id: "pack-003",
    title: "Audit export edge cases",
    destination: "ChatGPT",
    summary:
      "Immutable event requirements, source evidence, and rejected automation decisions for export QA planning.",
  },
];

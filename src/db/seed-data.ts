export const seedUser = {
  id: "seed-user-nextzen",
  name: "Nextzen Demo Owner",
  email: "demo@context-os.local",
};

export const seedProduct = {
  name: "Nextzen Demo",
  description:
    "Fictional product-memory dataset for progress reporting and application review workflows.",
};

export const seedModules = [
  {
    key: "progress-reporting",
    name: "Progress Reporting",
    description:
      "Program progress report creation, submission, review, and approval workflows.",
    position: 1,
  },
  {
    key: "application-review",
    name: "Application Review",
    description:
      "Reviewer-facing application list, selection, eligibility, and bulk decision workflows.",
    position: 2,
  },
] as const;

export const seedFeatures = [
  {
    key: "create-progress-report",
    moduleKey: "progress-reporting",
    name: "Create Progress Report",
    description: "Draft a progress report with required correction checks.",
    status: "active",
    position: 1,
  },
  {
    key: "submit-progress-report",
    moduleKey: "progress-reporting",
    name: "Submit Progress Report",
    description: "Submit a complete progress report for reviewer assessment.",
    status: "active",
    position: 2,
  },
  {
    key: "review-progress-report",
    moduleKey: "progress-reporting",
    name: "Review Progress Report",
    description: "Review submitted reports and request required corrections.",
    status: "active",
    position: 3,
  },
  {
    key: "approve-progress-report",
    moduleKey: "progress-reporting",
    name: "Approve Progress Report",
    description: "Approve eligible progress reports with permission checks.",
    status: "active",
    position: 4,
  },
  {
    key: "application-list",
    moduleKey: "application-review",
    name: "Application List",
    description: "List applications and expose bulk action eligibility.",
    status: "active",
    position: 1,
  },
  {
    key: "bulk-review",
    moduleKey: "application-review",
    name: "Bulk Review",
    description: "Apply reviewer decisions to selected eligible applications.",
    status: "active",
    position: 2,
  },
] as const;

export const seedSources = [
  {
    key: "progress-report-approval-requirement",
    sourceType: "prd",
    moduleKey: "progress-reporting",
    featureKey: "approve-progress-report",
    name: "Progress report approval requirement",
    rawContent:
      "Only Program Administrators and assigned Reviewers can approve reports. Reports containing unresolved required corrections cannot be approved.",
    metadata: {
      authority: "canonical",
      fictional: true,
      sourceDate: "2026-04-18",
    },
  },
  {
    key: "bulk-review-design-note",
    sourceType: "figma_notes",
    moduleKey: "application-review",
    featureKey: "bulk-review",
    name: "Bulk review design note",
    rawContent:
      "Bulk actions appear only after at least one eligible record is selected. The review team preferred a contextual action bar because it keeps the application list scannable until a reviewer starts selecting records.",
    metadata: {
      authority: "high",
      fictional: true,
      designFile: "Nextzen Application Review v4",
    },
  },
  {
    key: "confirmation-modal-design-system",
    sourceType: "design_system_doc",
    moduleKey: "application-review",
    name: "ConfirmationModal design system note",
    rawContent:
      "ConfirmationModal is the required component before irreversible workflow changes. It must state the action, impacted records, and whether the action can be undone.",
    metadata: {
      authority: "canonical",
      fictional: true,
      component: "ConfirmationModal",
    },
  },
  {
    key: "bulk-workflow-api-constraint",
    sourceType: "code_note",
    moduleKey: "application-review",
    featureKey: "bulk-review",
    name: "Bulk workflow API constraint note",
    rawContent:
      "The bulk mutation endpoint rejects batches above 100 records. The response returns per-record errors rather than a single failure reason so reviewers can resolve eligibility problems without losing the full selection.",
    metadata: {
      authority: "high",
      fictional: true,
      api: "POST /api/application-review/bulk-mutations",
    },
  },
  {
    key: "old-bulk-toolbar-exploration",
    sourceType: "research_note",
    moduleKey: "application-review",
    featureKey: "bulk-review",
    name: "Old rejected bulk toolbar exploration",
    rawContent:
      "A permanently visible bulk toolbar was rejected because it consumed table space when no selection existed. BulkActionBar is already used by Application Review.",
    metadata: {
      authority: "medium",
      fictional: true,
      rejectedAt: "2025-09-12",
    },
  },
] as const;

export const seedKnowledge = [
  {
    title: "Approval permissions are role-limited",
    body: "Only Program Administrators and assigned Reviewers can approve reports.",
    knowledgeType: "permission",
    authority: "canonical",
    confidence: 96,
    lifecycleStatus: "verified",
    featureKey: "approve-progress-report",
    moduleKey: "progress-reporting",
    sourceKeys: ["progress-report-approval-requirement"],
  },
  {
    title: "Unresolved corrections block approval",
    body: "Reports containing unresolved required corrections cannot be approved.",
    knowledgeType: "business_rule",
    authority: "canonical",
    confidence: 94,
    lifecycleStatus: "verified",
    featureKey: "approve-progress-report",
    moduleKey: "progress-reporting",
    sourceKeys: [
      "progress-report-approval-requirement",
    ],
  },
  {
    title: "Bulk mutation limit is 100 records",
    body: "Bulk mutations currently accept no more than 100 records.",
    knowledgeType: "technical_constraint",
    authority: "high",
    confidence: 88,
    lifecycleStatus: "verified",
    featureKey: "bulk-review",
    moduleKey: "application-review",
    sourceKeys: ["bulk-workflow-api-constraint"],
  },
  {
    title: "Bulk actions require eligible selection",
    body: "Bulk actions appear only after at least one eligible record is selected.",
    knowledgeType: "ux_pattern",
    authority: "high",
    confidence: 92,
    lifecycleStatus: "verified",
    featureKey: "bulk-review",
    moduleKey: "application-review",
    sourceKeys: ["bulk-review-design-note"],
  },
  {
    title: "ConfirmationModal precedes irreversible workflow changes",
    body: "ConfirmationModal is the standard pattern before irreversible workflow changes.",
    knowledgeType: "ux_pattern",
    authority: "canonical",
    confidence: 90,
    lifecycleStatus: "verified",
    featureKey: "bulk-review",
    moduleKey: "application-review",
    sourceKeys: ["confirmation-modal-design-system"],
  },
  {
    title: "Permanent bulk toolbar was rejected",
    body: "A permanently visible bulk toolbar was rejected because it consumed table space when no selection existed.",
    knowledgeType: "rejected_approach",
    authority: "high",
    confidence: 90,
    lifecycleStatus: "rejected",
    featureKey: "bulk-review",
    moduleKey: "application-review",
    sourceKeys: ["old-bulk-toolbar-exploration"],
  },
  {
    title: "BulkActionBar exists in Application Review",
    body: "BulkActionBar is already used by Application Review.",
    knowledgeType: "component",
    authority: "high",
    confidence: 87,
    lifecycleStatus: "verified",
    featureKey: "bulk-review",
    moduleKey: "application-review",
    sourceKeys: ["old-bulk-toolbar-exploration", "bulk-review-design-note"],
  },
  {
    title: "Progress Report Review reuses Application Review patterns",
    body: "Progress Report Review reuses patterns from Application Review.",
    knowledgeType: "decision",
    authority: "medium",
    confidence: 82,
    lifecycleStatus: "verified",
    featureKey: "review-progress-report",
    moduleKey: "progress-reporting",
    sourceKeys: [
      "old-bulk-toolbar-exploration",
      "bulk-review-design-note",
      "confirmation-modal-design-system",
    ],
  },
] as const;

export const seedFeatureRelationships = [
  {
    fromFeatureKey: "review-progress-report",
    toFeatureKey: "bulk-review",
    relationshipType: "reuses_pattern_from",
    reason:
      "Progress Report Review reuses the Application Review bulk action pattern.",
  },
] as const;

export const seedKnowledgeRelationships = [
  {
    fromTitle: "BulkActionBar exists in Application Review",
    toTitle: "Bulk actions require eligible selection",
    relationshipType: "supports",
    reason: "BulkActionBar supports bulk review workflows after selection starts.",
  },
  {
    fromTitle: "ConfirmationModal precedes irreversible workflow changes",
    toTitle: "Approval permissions are role-limited",
    relationshipType: "constrains",
    reason: "ConfirmationModal constrains approval interactions before committing changes.",
  },
  {
    fromTitle: "Permanent bulk toolbar was rejected",
    toTitle: "Bulk actions require eligible selection",
    relationshipType: "contradicts",
    reason:
      "The rejected persistent toolbar contradicts proposals to keep bulk controls always visible.",
  },
  {
    fromTitle: "Bulk mutation limit is 100 records",
    toTitle: "Progress Report Review reuses Application Review patterns",
    relationshipType: "constrains",
    reason: "The 100-record API limit constrains any bulk approval design.",
  },
  {
    fromTitle: "Progress Report Review reuses Application Review patterns",
    toTitle: "BulkActionBar exists in Application Review",
    relationshipType: "explains",
    reason: "The reuse decision explains why BulkActionBar is relevant.",
  },
] as const;

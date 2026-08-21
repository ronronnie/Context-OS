export const seedUser = {
  id: "seed-user-nextzen",
  name: "Nextzen Demo Owner",
  email: "demo@context-os.local",
};

export const seedProduct = {
  name: "Nextzen Demo",
  description:
    "A fictional grants and program management platform used to demonstrate source-backed Product Memory, retrieval, Context Packs, and decision capture.",
};

export const seedModules = [
  {
    key: "progress-reporting",
    name: "Progress Reporting",
    description:
      "Grantee report drafting, submission, review, approval, and correction workflows.",
    position: 1,
  },
  {
    key: "application-review",
    name: "Application Review",
    description:
      "Reviewer-facing application queues, reviewer assignment, eligibility checks, and bulk decisions.",
    position: 2,
  },
  {
    key: "award-management",
    name: "Award Management",
    description:
      "Award dashboards, amendments, payment readiness, and downstream program operations.",
    position: 3,
  },
  {
    key: "design-system",
    name: "Design System",
    description:
      "Reusable Nextzen interface components and interaction patterns used across mature product workflows.",
    position: 4,
  },
] as const;

export const seedFeatures = [
  {
    key: "create-progress-report",
    moduleKey: "progress-reporting",
    name: "Create Progress Report",
    description: "Create draft narrative, metrics, budget, and attachment sections.",
    status: "active",
    position: 1,
  },
  {
    key: "submit-progress-report",
    moduleKey: "progress-reporting",
    name: "Submit Progress Report",
    description: "Submit a complete report for program review after validation passes.",
    status: "active",
    position: 2,
  },
  {
    key: "review-progress-report",
    moduleKey: "progress-reporting",
    name: "Review Progress Report",
    description: "Review submitted reports, compare evidence, and record review findings.",
    status: "active",
    position: 3,
  },
  {
    key: "approve-progress-report",
    moduleKey: "progress-reporting",
    name: "Approve Progress Report",
    description: "Approve eligible reports and advance them toward award payment checks.",
    status: "active",
    position: 4,
  },
  {
    key: "request-corrections",
    moduleKey: "progress-reporting",
    name: "Request Corrections",
    description: "Send report sections back to grantees with required correction notes.",
    status: "active",
    position: 5,
  },
  {
    key: "application-list",
    moduleKey: "application-review",
    name: "Application List",
    description: "Filter, sort, scan, and select application records for review work.",
    status: "active",
    position: 1,
  },
  {
    key: "bulk-review",
    moduleKey: "application-review",
    name: "Bulk Review",
    description: "Apply review actions to selected eligible applications.",
    status: "active",
    position: 2,
  },
  {
    key: "assign-reviewers",
    moduleKey: "application-review",
    name: "Assign Reviewers",
    description: "Assign reviewers to applications individually or in eligible batches.",
    status: "active",
    position: 3,
  },
  {
    key: "approve-application",
    moduleKey: "application-review",
    name: "Approve Application",
    description: "Record final application approval decisions with required audit context.",
    status: "active",
    position: 4,
  },
  {
    key: "award-dashboard",
    moduleKey: "award-management",
    name: "Award Dashboard",
    description: "Track award status, reporting obligations, amendment state, and payment readiness.",
    status: "active",
    position: 1,
  },
  {
    key: "amendments",
    moduleKey: "award-management",
    name: "Amendments",
    description: "Manage budget, timeline, and scope amendment requests for active awards.",
    status: "active",
    position: 2,
  },
  {
    key: "payments",
    moduleKey: "award-management",
    name: "Payments",
    description: "Prepare and release payments after required reports and approval gates are complete.",
    status: "active",
    position: 3,
  },
  {
    key: "bulk-action-bar",
    moduleKey: "design-system",
    name: "BulkActionBar",
    description: "Contextual toolbar component for actions on selected table rows.",
    status: "active",
    position: 1,
  },
  {
    key: "confirmation-modal",
    moduleKey: "design-system",
    name: "ConfirmationModal",
    description: "Confirmation pattern for irreversible or high-impact workflow actions.",
    status: "active",
    position: 2,
  },
  {
    key: "status-badge",
    moduleKey: "design-system",
    name: "StatusBadge",
    description: "Compact status component for record state and lifecycle labels.",
    status: "active",
    position: 3,
  },
  {
    key: "data-table",
    moduleKey: "design-system",
    name: "DataTable",
    description: "Reusable table foundation for scanning, filtering, sorting, and row selection.",
    status: "active",
    position: 4,
  },
  {
    key: "toast",
    moduleKey: "design-system",
    name: "Toast",
    description: "Transient feedback component for completed actions and recoverable errors.",
    status: "active",
    position: 5,
  },
] as const;

export const seedSources = [
  {
    key: "progress-reporting-requirements-note",
    sourceType: "prd",
    moduleKey: "progress-reporting",
    featureKey: "approve-progress-report",
    name: "Progress reporting requirements note",
    rawContent:
      "Progress reports move from Draft to Submitted after required sections validate. Assigned Reviewers and Program Administrators can approve reports after review. Reports with unresolved required corrections, missing financial totals, or compliance holds cannot be approved. The approval action writes an immutable audit event and can unlock payment readiness checks.",
    metadata: {
      authority: "canonical",
      fictional: true,
      sourceDate: "2026-04-18",
      sourceKind: "requirements note",
    },
  },
  {
    key: "bulk-review-design-critique-note",
    sourceType: "figma_notes",
    moduleKey: "application-review",
    featureKey: "bulk-review",
    name: "Bulk review design critique note",
    rawContent:
      "Bulk actions appear only after at least one eligible record is selected. The design critique rejected a permanently visible toolbar because it consumed table space when no selection existed. Mixed selections should keep eligible actions enabled while explaining why ineligible rows are skipped. The team chose BulkActionBar with a clear selected count, inline eligibility summary, and ConfirmationModal before irreversible approval actions.",
    metadata: {
      authority: "high",
      fictional: true,
      sourceDate: "2025-09-12",
      designFile: "Nextzen Application Review v4",
      sourceKind: "design critique note",
    },
  },
  {
    key: "bulk-operations-engineering-constraint-note",
    sourceType: "code_note",
    moduleKey: "application-review",
    featureKey: "bulk-review",
    name: "Bulk operations engineering constraint note",
    rawContent:
      "The first bulk mutation endpoint was limited to 50 records. In release 2026.6 the limit increased to 100 records after queue backpressure was added. Bulk endpoints return per-record errors instead of failing the full request so reviewers can resolve eligibility issues without rebuilding the selection. The same limit applies to bulk review, reviewer assignment, and any future progress-report bulk approval workflow.",
    metadata: {
      authority: "high",
      fictional: true,
      sourceDate: "2026-06-04",
      api: "POST /api/bulk-mutations",
      sourceKind: "engineering constraint note",
    },
  },
  {
    key: "reviewer-research-summary",
    sourceType: "research_note",
    moduleKey: "application-review",
    featureKey: "bulk-review",
    name: "Reviewer research summary",
    rawContent:
      "Reviewers scan long queues and prefer controls that stay out of the way until they intentionally select rows. During mixed-selection tests, reviewers expected skipped records to remain selected with clear per-record explanations. Screen reader users needed the selection count and bulk action availability announced after each selection change.",
    metadata: {
      authority: "medium",
      fictional: true,
      sourceDate: "2026-01-20",
      participants: 8,
      sourceKind: "research summary",
    },
  },
  {
    key: "nextzen-release-2026-06-note",
    sourceType: "release_note",
    moduleKey: "award-management",
    featureKey: "award-dashboard",
    name: "Nextzen 2026.6 release note",
    rawContent:
      "Release 2026.6 increased the bulk operation limit from 50 to 100 records, standardized ConfirmationModal copy for approval actions, added polite live-region announcements to BulkActionBar selection counts, and exposed payment readiness on the Award Dashboard after progress report approval.",
    metadata: {
      authority: "canonical",
      fictional: true,
      sourceDate: "2026-06-15",
      sourceKind: "release note",
    },
  },
  {
    key: "design-system-bulk-pattern-note",
    sourceType: "design_system_doc",
    moduleKey: "design-system",
    featureKey: "bulk-action-bar",
    name: "Design system bulk pattern note",
    rawContent:
      "BulkActionBar is the canonical pattern for table bulk actions. It appears after selection, shows selected count, exposes only actions available to at least one selected record, and works with DataTable row selection. ConfirmationModal is required before irreversible approvals and must name the action, impacted record count, skipped record count, and whether the action can be undone. StatusBadge labels must use product terminology and Toast messages must summarize completed, skipped, and failed records.",
    metadata: {
      authority: "canonical",
      fictional: true,
      sourceDate: "2026-05-28",
      sourceKind: "design system note",
    },
  },
] as const;

export const seedKnowledge = [
  memory("Progress Report approval behavior", "Submitted progress reports can be approved only after reviewer checks pass and no required correction remains unresolved.", "current_behaviour", "canonical", 96, "verified", "approve-progress-report", "progress-reporting", ["progress-reporting-requirements-note"]),
  memory("Approval permissions are role-limited", "Only Program Administrators and assigned Reviewers can approve progress reports.", "permission", "canonical", 96, "verified", "approve-progress-report", "progress-reporting", ["progress-reporting-requirements-note"]),
  memory("Compliance restrictions block invalid approvals", "Progress reports with unresolved required corrections, missing financial totals, or compliance holds cannot be approved.", "business_rule", "canonical", 94, "verified", "approve-progress-report", "progress-reporting", ["progress-reporting-requirements-note"]),
  memory("Approval writes immutable audit event", "Approving a progress report writes an immutable audit event that downstream workflows can reference.", "product_rule", "canonical", 92, "verified", "approve-progress-report", "progress-reporting", ["progress-reporting-requirements-note"]),
  memory("Progress report approval unlocks payment readiness", "Progress report approval can unlock payment readiness checks on the Award Dashboard.", "business_rule", "high", 88, "verified", "approve-progress-report", "progress-reporting", ["progress-reporting-requirements-note", "nextzen-release-2026-06-note"]),
  memory("Draft reports require section validation", "Create Progress Report validates required narrative, metrics, budget, and attachment sections before submission.", "current_behaviour", "high", 86, "verified", "create-progress-report", "progress-reporting", ["progress-reporting-requirements-note"]),
  memory("Submit Progress Report changes lifecycle state", "Submit Progress Report moves a report from Draft to Submitted after required sections validate.", "current_behaviour", "canonical", 91, "verified", "submit-progress-report", "progress-reporting", ["progress-reporting-requirements-note"]),
  memory("Request Corrections reopens targeted sections", "Request Corrections sends selected report sections back to the grantee instead of reopening the full report.", "current_behaviour", "medium", 82, "verified", "request-corrections", "progress-reporting", ["progress-reporting-requirements-note"]),
  memory("Correction requests must include reviewer note", "Each requested correction needs a reviewer note explaining what must change before resubmission.", "product_rule", "high", 86, "verified", "request-corrections", "progress-reporting", ["progress-reporting-requirements-note"]),
  memory("Progress Report Review reuses Application Review patterns", "Progress Report Review should reuse Application Review bulk action patterns when adding multi-record review workflows.", "decision", "high", 87, "verified", "review-progress-report", "progress-reporting", ["bulk-review-design-critique-note", "design-system-bulk-pattern-note"]),
  memory("Progress report review keeps evidence visible", "Review Progress Report keeps source evidence and prior correction history visible while a reviewer evaluates approval readiness.", "ux_pattern", "medium", 83, "verified", "review-progress-report", "progress-reporting", ["progress-reporting-requirements-note"]),
  memory("Bulk approval needs skipped-record explanation", "A future progress-report bulk approval workflow should explain which selected reports were skipped and why.", "open_question", "medium", 78, "proposed", "approve-progress-report", "progress-reporting", ["bulk-review-design-critique-note", "reviewer-research-summary"]),

  memory("Application List supports row selection", "Application List uses DataTable row selection to start bulk review and assignment workflows.", "current_behaviour", "high", 89, "verified", "application-list", "application-review", ["bulk-review-design-critique-note", "design-system-bulk-pattern-note"]),
  memory("Application Review bulk action pattern", "Bulk actions appear after at least one eligible record is selected and stay hidden when the list has no selection.", "ux_pattern", "high", 93, "verified", "bulk-review", "application-review", ["bulk-review-design-critique-note", "reviewer-research-summary"]),
  memory("Mixed selections preserve eligible actions", "Mixed selections keep eligible actions available while showing which selected rows are ineligible.", "ux_pattern", "high", 88, "verified", "bulk-review", "application-review", ["bulk-review-design-critique-note", "reviewer-research-summary"]),
  memory("Mixed-selection issue remains visible", "Mixed-selection bulk actions can confuse reviewers if skipped records are not shown next to successful records.", "known_issue", "medium", 82, "verified", "bulk-review", "application-review", ["reviewer-research-summary"]),
  memory("Bulk review returns per-record errors", "Bulk review returns per-record errors instead of failing the whole request.", "technical_constraint", "high", 90, "verified", "bulk-review", "application-review", ["bulk-operations-engineering-constraint-note"]),
  memory("Bulk mutation limit is 100 records", "Bulk mutations currently accept no more than 100 records.", "technical_constraint", "high", 92, "verified", "bulk-review", "application-review", ["bulk-operations-engineering-constraint-note", "nextzen-release-2026-06-note"]),
  memory("Old bulk API limit was 50 records", "The first bulk mutation endpoint allowed only 50 records before the 2026.6 increase.", "technical_constraint", "medium", 86, "outdated", "bulk-review", "application-review", ["bulk-operations-engineering-constraint-note"], { validFrom: "2025-04-01", validUntil: "2026-06-04" }),
  memory("Bulk operation limit increased to 100 records", "Release 2026.6 increased the bulk operation limit from 50 to 100 records after queue backpressure was added.", "decision", "canonical", 91, "verified", "bulk-review", "application-review", ["bulk-operations-engineering-constraint-note", "nextzen-release-2026-06-note"], { validFrom: "2026-06-04" }),
  memory("Reviewer assignment uses same bulk limit", "Assign Reviewers uses the same 100-record bulk operation limit as Bulk Review.", "technical_constraint", "high", 86, "verified", "assign-reviewers", "application-review", ["bulk-operations-engineering-constraint-note"]),
  memory("Assign Reviewers requires manager permission", "Only Review Managers can assign reviewers in bulk.", "permission", "high", 84, "verified", "assign-reviewers", "application-review", ["progress-reporting-requirements-note", "bulk-operations-engineering-constraint-note"]),
  memory("Approve Application requires audit context", "Approve Application records final decision context for audit review.", "business_rule", "high", 84, "verified", "approve-application", "application-review", ["progress-reporting-requirements-note", "design-system-bulk-pattern-note"]),
  memory("Rejected persistent toolbar approach", "A permanently visible bulk toolbar was rejected because it consumed table space when no selection existed.", "rejected_approach", "high", 91, "rejected", "bulk-review", "application-review", ["bulk-review-design-critique-note", "reviewer-research-summary"], { validUntil: "2025-09-12" }),
  memory("Bulk controls stay contextual by decision", "The team chose a contextual BulkActionBar instead of persistent controls for bulk workflows.", "decision", "high", 89, "verified", "bulk-review", "application-review", ["bulk-review-design-critique-note", "design-system-bulk-pattern-note"]),

  memory("Award Dashboard shows payment readiness", "Award Dashboard exposes payment readiness after required report approval gates are satisfied.", "current_behaviour", "canonical", 90, "verified", "award-dashboard", "award-management", ["nextzen-release-2026-06-note", "progress-reporting-requirements-note"]),
  memory("Payments wait for approved progress reports", "Payments cannot be released until required progress reports are approved.", "business_rule", "canonical", 91, "verified", "payments", "award-management", ["progress-reporting-requirements-note", "nextzen-release-2026-06-note"]),
  memory("Amendments pause payment readiness", "Open amendments pause payment readiness until amendment review is resolved.", "business_rule", "medium", 80, "verified", "amendments", "award-management", ["nextzen-release-2026-06-note"]),
  memory("Award Dashboard uses StatusBadge terminology", "Award Dashboard uses StatusBadge labels for report, amendment, and payment readiness states.", "ux_pattern", "high", 84, "verified", "award-dashboard", "award-management", ["design-system-bulk-pattern-note", "nextzen-release-2026-06-note"]),
  memory("Payment readiness is not an approval status", "Payment readiness is a downstream operational state, not the same term as report approval.", "terminology", "high", 86, "verified", "payments", "award-management", ["nextzen-release-2026-06-note"]),

  memory("BulkActionBar is canonical bulk component", "BulkActionBar is the canonical component for table bulk actions in Nextzen.", "component", "canonical", 96, "verified", "bulk-action-bar", "design-system", ["design-system-bulk-pattern-note"]),
  memory("BulkActionBar appears after selection", "BulkActionBar appears only after row selection starts and shows the selected count.", "ux_pattern", "canonical", 94, "verified", "bulk-action-bar", "design-system", ["design-system-bulk-pattern-note", "bulk-review-design-critique-note"]),
  memory("BulkActionBar announces selection changes", "BulkActionBar uses polite live-region announcements for selected count and action availability changes.", "ux_pattern", "canonical", 90, "verified", "bulk-action-bar", "design-system", ["reviewer-research-summary", "nextzen-release-2026-06-note"]),
  memory("Accessibility improvement added to BulkActionBar", "Release 2026.6 added polite live-region announcements to BulkActionBar selection counts.", "decision", "canonical", 90, "verified", "bulk-action-bar", "design-system", ["reviewer-research-summary", "nextzen-release-2026-06-note"], { validFrom: "2026-06-15" }),
  memory("ConfirmationModal is required for approvals", "ConfirmationModal is required before irreversible approval actions.", "component", "canonical", 95, "verified", "confirmation-modal", "design-system", ["design-system-bulk-pattern-note", "nextzen-release-2026-06-note"]),
  memory("Standardized confirmation modal copy", "ConfirmationModal copy for approval actions was standardized in release 2026.6.", "decision", "canonical", 89, "verified", "confirmation-modal", "design-system", ["design-system-bulk-pattern-note", "nextzen-release-2026-06-note"], { validFrom: "2026-06-15" }),
  memory("ConfirmationModal names impacted records", "ConfirmationModal must name the action, impacted record count, skipped record count, and reversibility.", "product_rule", "canonical", 94, "verified", "confirmation-modal", "design-system", ["design-system-bulk-pattern-note"]),
  memory("DataTable owns row selection state", "DataTable owns row selection state used by BulkActionBar.", "component", "canonical", 90, "verified", "data-table", "design-system", ["design-system-bulk-pattern-note"]),
  memory("StatusBadge labels use product terminology", "StatusBadge labels must use product terminology instead of internal enum names.", "ux_pattern", "canonical", 88, "verified", "status-badge", "design-system", ["design-system-bulk-pattern-note"]),
  memory("Toast summarizes bulk outcomes", "Toast messages summarize completed, skipped, and failed records after bulk actions.", "ux_pattern", "canonical", 88, "verified", "toast", "design-system", ["design-system-bulk-pattern-note"]),
  memory("Bulk action means selected table operation", "In Nextzen, bulk action means an operation performed on selected DataTable rows.", "terminology", "canonical", 90, "verified", "bulk-action-bar", "design-system", ["design-system-bulk-pattern-note"]),
] as const;

export const seedFeatureRelationships = [
  {
    fromFeatureKey: "review-progress-report",
    toFeatureKey: "bulk-review",
    relationshipType: "reuses_pattern_from",
    reason:
      "Progress Report Review reuses the Application Review bulk action pattern.",
  },
  {
    fromFeatureKey: "approve-progress-report",
    toFeatureKey: "bulk-review",
    relationshipType: "impacts",
    reason:
      "Adding progress-report bulk approval impacts the same bulk operation constraints used by Bulk Review.",
  },
  {
    fromFeatureKey: "bulk-review",
    toFeatureKey: "bulk-action-bar",
    relationshipType: "reuses_pattern_from",
    reason:
      "Bulk Review uses BulkActionBar for selected-row actions.",
  },
  {
    fromFeatureKey: "approve-progress-report",
    toFeatureKey: "bulk-action-bar",
    relationshipType: "reuses_pattern_from",
    reason:
      "Future bulk report approval should reuse BulkActionBar.",
  },
  {
    fromFeatureKey: "approve-application",
    toFeatureKey: "confirmation-modal",
    relationshipType: "reuses_pattern_from",
    reason:
      "Application approvals use ConfirmationModal before irreversible decisions.",
  },
  {
    fromFeatureKey: "approve-progress-report",
    toFeatureKey: "confirmation-modal",
    relationshipType: "reuses_pattern_from",
    reason:
      "Progress report approval should use ConfirmationModal for irreversible approval actions.",
  },
  {
    fromFeatureKey: "award-dashboard",
    toFeatureKey: "status-badge",
    relationshipType: "reuses_pattern_from",
    reason:
      "Award Dashboard uses StatusBadge to show operational readiness states.",
  },
] as const;

export const seedKnowledgeRelationships = [
  relation("Progress Report Review reuses Application Review patterns", "Application Review bulk action pattern", "explains", "The reuse decision explains why application bulk patterns are relevant to report review."),
  relation("BulkActionBar is canonical bulk component", "Application Review bulk action pattern", "supports", "BulkActionBar implements the selected-row bulk action pattern."),
  relation("BulkActionBar is canonical bulk component", "Progress Report Review reuses Application Review patterns", "supports", "The same component is the likely reuse target for progress report bulk approval."),
  relation("ConfirmationModal is required for approvals", "Approval permissions are role-limited", "constrains", "Approval interactions must confirm role-limited irreversible changes."),
  relation("ConfirmationModal names impacted records", "Bulk approval needs skipped-record explanation", "supports", "The modal rule directly supports skipped-record explanation in bulk approval."),
  relation("Bulk mutation limit is 100 records", "Application Review bulk action pattern", "constrains", "The 100-record API limit constrains all bulk operations."),
  relation("Bulk mutation limit is 100 records", "Progress Report Review reuses Application Review patterns", "constrains", "Progress report bulk approval should inherit the bulk operation limit."),
  relation("Old bulk API limit was 50 records", "Bulk mutation limit is 100 records", "supersedes", "The 100-record limit replaced the old 50-record limit."),
  relation("Rejected persistent toolbar approach", "Bulk controls stay contextual by decision", "contradicts", "The rejected toolbar contradicts always-visible bulk controls."),
  relation("Rejected persistent toolbar approach", "Application Review bulk action pattern", "contradicts", "The rejected approach conflicts with the selected contextual action pattern."),
  relation("Mixed-selection issue remains visible", "Mixed selections preserve eligible actions", "supports", "The known issue explains why mixed-selection messaging matters."),
  relation("Accessibility improvement added to BulkActionBar", "BulkActionBar announces selection changes", "supports", "The release decision supports the current accessibility pattern."),
] as const;

export const seedDemoTask = {
  title: "Add bulk approval to Progress Report Review.",
  description:
    "Use Product Memory to design a bulk approval workflow for Progress Report Review without violating approval permissions, correction gates, API limits, or established bulk action patterns.",
  status: "ready",
  primaryFeatureKey: "review-progress-report",
  contextPackContent:
    "Use verified progress report approval behavior, approval permissions, compliance restrictions, the 100-record API limitation, Application Review bulk action patterns, BulkActionBar, ConfirmationModal, and the rejected persistent toolbar history before designing bulk approval for Progress Report Review.",
  contextPackKnowledgeTitles: [
    "Progress Report approval behavior",
    "Approval permissions are role-limited",
    "Compliance restrictions block invalid approvals",
    "Bulk mutation limit is 100 records",
    "Application Review bulk action pattern",
    "BulkActionBar is canonical bulk component",
    "ConfirmationModal is required for approvals",
    "Rejected persistent toolbar approach",
  ],
} as const;

function memory(
  title: string,
  body: string,
  knowledgeType:
    | "current_behaviour"
    | "product_rule"
    | "business_rule"
    | "ux_pattern"
    | "technical_constraint"
    | "permission"
    | "decision"
    | "rejected_approach"
    | "known_issue"
    | "open_question"
    | "component"
    | "terminology",
  authority: "canonical" | "high" | "medium" | "low" | "unverified",
  confidence: number,
  lifecycleStatus: "proposed" | "verified" | "outdated" | "rejected",
  featureKey: string,
  moduleKey: string,
  sourceKeys: string[],
  history: {
    validFrom?: string;
    validUntil?: string;
  } = {},
) {
  return {
    title,
    body,
    knowledgeType,
    authority,
    confidence,
    lifecycleStatus,
    featureKey,
    moduleKey,
    sourceKeys,
    ...history,
  };
}

function relation(
  fromTitle: string,
  toTitle: string,
  relationshipType: string,
  reason: string,
) {
  return {
    fromTitle,
    toTitle,
    relationshipType,
    reason,
  };
}

# Figma Integration Plan

Context OS should eventually understand Figma because designers need current screens, components, flows, and design decisions in the same Product Memory graph as product rules, technical constraints, and historical decisions.

For the MVP, Context OS will not build custom Figma ingestion, OAuth, or an MCP client/server. Manual `figma_link` and `figma_notes` sources are enough to prove the core loop: source-backed memory, human verification, retrieval, Context Packs, and decision capture.

## Why Figma Later

Figma is important for mature product teams because much of the current product state lives in design artifacts:

- Screens and flows show how features behave today.
- Components reveal canonical interaction and layout patterns.
- File, page, frame, and node references preserve where a claim came from.
- Design comments and annotations often explain why a decision was made.
- Component usage can connect a feature to a design-system pattern.

The MVP should stay focused on Product Memory quality. Manual Figma links and notes let users attach evidence without adding integration complexity before the memory model is stable.

## Future Integration Path

The likely path is to use either Figma MCP or official Figma APIs after the core loop is reliable.

- Figma MCP can provide selected-node context from a designer's active workflow when available.
- Official Figma APIs can support server-side ingestion of files, pages, frames, components, thumbnails, and comments where permissions allow it.
- Context OS should normalize Figma data into existing `sources`, then let AI create review candidates. Direct ingestion must not create trusted Product Memory without human verification.

## Data To Ingest Later

Future ingestion should focus on source evidence that supports product-memory claims:

- File metadata: file key, file name, last modified date, URL.
- Page metadata: page name and stable page/node reference.
- Frame metadata: frame name, node ID, screen role, flow position.
- Selected-node context: selected frame/component text, visible labels, annotations, variants, and nearby hierarchy.
- Component references: local component name, design-system component key, variant properties, and instances.
- Flow references: entry screen, next/previous screens, modal/drawer states, empty/error/success states.
- Comments or annotations when they explain rationale, constraints, rejected alternatives, or open questions.
- Screenshot/preview assets for inspection, stored as source references or generated previews, not as trusted memory by themselves.

## Reference Fields

Current Source metadata can already store the initial Figma references because `sources.metadata` is JSONB:

```json
{
  "figmaFileKey": "abc123",
  "figmaNodeId": "12:34",
  "figmaUrl": "https://www.figma.com/file/abc123/Nextzen?node-id=12-34",
  "figmaPageName": "Progress Reporting",
  "figmaFrameName": "Review Progress Report - Bulk Actions",
  "componentName": "BulkActionBar"
}
```

No schema migration is required for Prompt 18. If Figma becomes a first-class integration later, add relational tables only when we need durable synced artifacts, for example `figma_files`, `figma_nodes`, `figma_components`, or `source_previews`.

## Product Graph Mapping

Figma evidence should attach to the Product Graph instead of becoming a parallel design repository:

- Product maps to a Figma file or file set.
- Module maps to pages, major product areas, or design-system sections.
- Feature maps to frames, flows, or selected nodes.
- Component Product Memory maps to Figma components and design-system docs.
- Knowledge relationships can connect a design pattern to permissions, constraints, decisions, rejected approaches, or current behavior.

## Screenshot And Preview Handling

Future previews should be treated as evidence:

- Store preview metadata with the source record or a dedicated source-preview table.
- Preserve source URL, file key, node ID, generated-at date, and permission scope.
- Use screenshots to help humans review extracted candidates.
- Do not use screenshots alone as trusted memory without a source-backed claim and human verification.

## Source Authority

Authority should depend on the Figma artifact and its context:

- Current production-aligned design-system components can be `canonical`.
- Current feature frames reviewed by product/design can be `high`.
- Explorations, branches, or critique files should usually be `medium` or `low`.
- Old explorations and rejected flows should be preserved as historical or rejected memory, not overwritten.

Recency matters, but old rejected approaches can still be relevant when a task risks repeating them.

## Permissions And Security

Future integration must avoid pulling private design data into the wrong product workspace:

- Enforce product ownership before reading or writing Figma-derived sources.
- Store only references and extracted evidence needed for Product Memory.
- Respect Figma file permissions and organization boundaries.
- Avoid storing access tokens in source metadata.
- Keep OAuth tokens in secure auth/integration storage if OAuth is introduced later.
- Do not ingest real employer or proprietary data into the demo dataset.
- Log import and extraction events in the product audit trail.

## MVP Placeholder Behavior

For now:

- Users manually create `figma_link` or `figma_notes` sources.
- The source URL field stores the main Figma URL.
- Optional metadata can store `figmaFileKey`, `figmaNodeId`, `figmaUrl`, `figmaPageName`, `figmaFrameName`, and `componentName`.
- Source detail renders those fields when present.
- Related features come from the existing source feature attachment.
- Related components come from linked Product Memory items with type `component`.

This keeps Figma visible in the workflow without turning Context OS into an integration project before the Product Memory loop is proven.

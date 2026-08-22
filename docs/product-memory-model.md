# Product Memory Model

Product Memory is structured, source-backed, time-aware product knowledge. It is not a generic document store. It preserves what exists, why it exists, how it changed, what evidence supports it, and which surrounding product areas it touches.

## Product Structure

The core structure is:

```text
Product -> Module -> Feature
```

- `Product` is the tenant-owned software product.
- `Module` is a major product area within a product.
- `Feature` is a user-facing or system-facing capability inside a module.

Knowledge, sources, tasks, Context Packs, relationships, and audit events attach back to this structure so retrieval can be feature-aware.

## Knowledge Items

Knowledge items are atomic Product Memory claims. They should be specific enough to retrieve and verify independently.

Supported knowledge types:

- `current_behaviour`
- `product_rule`
- `business_rule`
- `ux_pattern`
- `technical_constraint`
- `permission`
- `decision`
- `rejected_approach`
- `known_issue`
- `open_question`
- `research_insight`
- `component`
- `terminology`

Use `current_behaviour` for what exists today, `decision` for accepted direction and rationale, `rejected_approach` for rejected paths that may still matter, and `technical_constraint` or `permission` when the memory limits what future work may change.

## Authority

Authority communicates how strongly the system should trust a memory item during retrieval and Context Pack generation.

Authority values:

- `canonical`
- `high`
- `medium`
- `low`
- `unverified`

Canonical and high-authority memory should normally outrank informal or unverified claims. Old memory can still be relevant when it records rejected decisions, prior constraints, or historical behavior.

Authority does not replace evidence. Important memory still needs source links.

## Confidence

Confidence is an integer score from 0 to 100. It expresses how confident the reviewer or extraction process is that the memory is correctly interpreted.

Use confidence with authority:

- High authority with high confidence: strong context for AI tools.
- High authority with low confidence: likely important but needs review.
- Low authority with high confidence: clearly captured but not strongly authoritative.
- Unverified with any confidence: not trusted Product Memory until reviewed.

## Lifecycle

Lifecycle values describe the trust and currency of a knowledge item.

- `proposed`: captured but not trusted.
- `verified`: approved by a human and usable as trusted Product Memory.
- `outdated`: no longer current but retained as history.
- `rejected`: intentionally rejected or not accepted.

Context OS preserves outdated and rejected memory. Mature products need history, not only current documentation.

## Sources And Evidence

Sources are evidence records. They may be notes, PRDs, tickets, Figma links, research notes, release notes, Slack summaries, code notes, design system docs, meeting notes, or task outcomes.

Knowledge links to sources through `knowledge_sources`.

Good evidence includes:

- Source name and type.
- Creation/source date.
- URL or locator when available.
- Excerpt supporting the claim.
- Module or feature attachment when known.
- Metadata for source-specific fields such as Figma node ids.

Sources alone are not trusted Product Memory. A source can contain raw material, but a human-reviewed knowledge item is the trusted structured claim.

## Relationships

Relationships keep product context explicit.

Feature relationship types:

- `depends_on`
- `similar_to`
- `reuses_pattern_from`
- `blocks`
- `replaces`
- `impacts`
- `shares_component`

Knowledge relationship types:

- `supports`
- `contradicts`
- `supersedes`
- `duplicates`
- `explains`
- `constrains`
- `evidence_for`
- `related_to`

Relationships are product-scoped rows with reasons. They help Context OS retrieve related patterns, constraints, decisions, components, and historical tradeoffs for a task.

## Time-Aware History

Product Memory has time fields:

- `valid_from`
- `valid_until`
- `last_verified_at`
- `created_at`
- `updated_at`

History is first-class. When a current rule changes, the old memory should usually become `outdated`, not disappear. Rejected approaches remain useful when a future task risks reopening a previously rejected design.

## Conflicts

Contradictions are preserved and surfaced. AI extraction and manual review should not silently overwrite memory.

Conflict types:

- `contradiction`
- `supersedes`
- `duplicate`
- `historical_as_current`
- `authority_mismatch`

Conflict resolution options:

- `replace_existing`
- `keep_both`
- `mark_existing_outdated`
- `reject_new`

Conflict resolution should leave an audit trail and preserve old Product Memory unless there is a strong reason to remove it.

## Human Verification

AI-extracted candidates are not trusted automatically. They remain review records until a human approves them.

Approval creates:

- A verified knowledge item.
- A source evidence link.
- Optional relationships to prior memory.
- Optional task, Context Pack, and outcome links.
- Audit events.
- Embedding sync when applicable.

Rejection keeps the candidate as review history but does not write trusted Product Memory.

## Retrieval Implications

Retrieval uses Product Memory structure, not only semantic similarity.

Ranking considers:

- Product ownership boundary.
- Primary feature and module proximity.
- Feature and knowledge graph relationships.
- Authority.
- Lifecycle.
- Recency and verification date.
- Task intent.
- Vector similarity from pgvector.

This is the core difference between Context OS and a generic RAG tool.

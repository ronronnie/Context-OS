# Context OS

Context OS is a living product-memory layer for teams working on mature software products. It structures product knowledge into source-backed, time-aware Product Memory and generates task-specific Context Packs for AI tools such as Codex, Claude, and ChatGPT.

The MVP uses fictional Nextzen Demo data. Do not ingest real employer data or proprietary material.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style local primitives
- Neon Postgres
- Drizzle ORM and migrations
- `@neondatabase/serverless`
- Neon Auth / Managed Better Auth through Better Auth
- pgvector planned inside Neon Postgres for embeddings
- pgvector inside Neon Postgres for semantic retrieval

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Set these in `.env.local`. Do not commit real secrets.

```bash
DATABASE_URL="postgres://user:password@host.neon.tech/context_os?sslmode=require"
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_TRUSTED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
NEON_AUTH_CLIENT_ID=""
NEON_AUTH_CLIENT_SECRET=""
NEON_AUTH_ISSUER=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AI_PROVIDER="openai-compatible"
AI_API_KEY=""
AI_BASE_URL="https://api.openai.com/v1"
AI_TEXT_MODEL="gpt-4.1-mini"
AI_STRUCTURED_MODEL="gpt-4.1-mini"
AI_TIMEOUT_MS="30000"
AI_MAX_RETRIES="1"
AI_EMBEDDING_MODEL="text-embedding-3-small"
AI_EMBEDDING_DIMENSIONS="1536"
```

## Neon Setup

1. Create a Neon project and Postgres database.
2. Copy the pooled or direct connection string into `DATABASE_URL`.
3. Configure `BETTER_AUTH_SECRET` with a long random value.
4. Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the local or deployed app URL.
5. Add any extra local, preview, or production origins to `BETTER_AUTH_TRUSTED_ORIGINS`.
6. Run migrations and seed the fictional dataset.

## Database Commands

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

`db:generate` writes Drizzle migrations under `src/db/migrations`. `db:migrate` applies them to Neon using `DATABASE_URL`. `db:seed` creates fictional Nextzen Demo data for the guided MVP story.

## Database Architecture

Database concerns are separated from UI components:

- `src/db/index.ts` creates the Neon serverless Drizzle client.
- `src/db/schema/` contains auth tables, Product Memory tables, and relations.
- `src/db/migrations/` contains generated SQL migrations.
- `src/db/queries/` contains authorized query and service functions.
- `src/db/seed.ts` seeds fictional development data.

Core Product Memory tables include products, modules, features, knowledge items, knowledge embeddings, sources, knowledge-source links, knowledge relationships, feature relationships, tasks, Context Packs, Context Pack items, task outcomes, decision capture candidates, knowledge-task links, and product audit events.

## Authorization Model

Every product belongs to an authenticated user through `products.created_by`. Query functions take the authenticated user id and verify product ownership before returning modules, features, knowledge, sources, tasks, or Context Packs.

UI components should not query the database directly. Use the service functions in `src/db/queries` so ownership checks are difficult to forget.

## Authentication

Better Auth is configured with the Drizzle adapter and Neon Postgres. The app includes:

- `/sign-up`
- `/sign-in`
- `/api/auth/[...all]`
- sign out from the app shell
- protected authenticated app routes through the `(app)` layout

Do not duplicate authentication data in a separate profile model unless Context OS-specific profile fields are required later.

## Current Implementation Status

- App shell and core routes are in place.
- Persistence dependencies are installed.
- Drizzle schema and migrations are generated.
- Better Auth route, client helpers, and protected app layout are in place.
- Authorized query/service functions exist for products, modules, features, knowledge, tasks, and Context Packs.
- Fictional seed data exists for Nextzen Demo, Progress Reporting, Application Review, source evidence, interconnected knowledge, relationships, and an example Context Pack.
- Tests cover auth guard behavior, ownership filter construction, seed data consistency, extraction review, conflict detection, and graph relationship parsing.
- Product Architecture UI is implemented for Product -> Module -> Feature management.
- Product pages support create/edit, summary counts, modules, recent knowledge, and recent Context Packs.
- Module pages support create/edit/reorder-by-position and feature lists.
- Feature pages support edit/reorder/status changes and act as the feature-level Product Memory workspace.
- Feature Memory management supports manual knowledge creation, editing, source association, lifecycle transitions, detail views, and visible timeline events.
- Product Graph services support feature neighborhoods, knowledge neighborhoods, product graph summaries, manual feature/knowledge relationship creation, and relationship removal with product ownership checks.
- Product, feature, and knowledge detail pages include structured graph views for related features, components, decisions, constraints, and knowledge relationships.
- Knowledge detail pages show full body, source evidence, editable relationships, lifecycle history, valid dates, and created/updated metadata.
- Semantic retrieval uses pgvector in Neon Postgres plus hybrid ranking across feature proximity, Product Graph relationships, authority, lifecycle, recency, and task intent.
- Embedding sync is wired into verified Product Memory creation, verified updates, lifecycle transitions, and approved extraction candidates.
- Task creation now generates versioned Context Packs from retrieved Product Memory, stores included items, and preserves older regenerated outputs.
- Context Pack detail supports Codex, Claude, ChatGPT, and plain Markdown export modes with copy, download, and live preview.
- Context Pack detail supports task outcome capture from Codex, Claude, ChatGPT, or user notes. Outcomes become source records and AI-extracted decision candidates must be reviewed before entering Product Memory.
- Knowledge detail and Context Pack detail now show inspectable source evidence cards with source type, source name, URL, excerpt, created date, authority, and trust labels.
- Product, feature, and source timelines include audit events for source creation, extraction runs, candidate approvals/rejections, knowledge edits, lifecycle changes, conflict resolution, Context Pack generation, and decision capture.
- Product Intelligence provides guided, structured product-aware questions over retrieved Product Memory and graph relationships without becoming a generic chat interface.
- The seeded Nextzen Demo story now covers Progress Reporting, Application Review, Award Management, and Design System with 40+ source-backed memory items, dated history, relationships, and the bulk progress-report approval demo task.
- Dashboard and daily workflow surfaces now use live Product Memory data, including selected product, module/feature counts, verified memory count, unresolved conflicts, recent sources, recent tasks, recent Context Packs, suggested next actions, and route-level loading/error states.
- Knowledge and source libraries include basic filters for type, lifecycle, authority, source type, module, and feature.
- Manual Source Ingestion supports product/module/feature attachment, source type validation, metadata JSON, raw content storage, source detail pages, connected knowledge display, and an extraction handoff shape for the later AI extraction prompt.
- Manual Figma source placeholders are documented in `docs/figma-integration-plan.md`. `figma_link` and `figma_notes` sources can store Figma file, page, frame, node, URL, and component references in source metadata without connecting to Figma yet.
- AI provider abstraction supports server-side text, structured output, and embedding operations with timeout, retry, error handling, malformed response handling, and a Product Memory extraction operation that returns proposed candidates only.
- AI Knowledge Extraction can run from a raw Source, persist atomic candidates for review, and only write approved candidates into verified Product Memory with source evidence attached.
- Conflict detection compares extracted candidates to verified memory, surfaces contradictions, supersessions, duplicates, historical/current mismatches, and authority mismatches, and requires explicit human resolution before conflicted candidates enter Product Memory.
- Decision Capture can extract decisions, product rules, UX patterns, technical constraints, rejected approaches, open questions, known issues, and terminology changes from a task outcome. Approved candidates link back to the outcome source, originating task, Context Pack, affected feature, and optional related prior memory.

## Product Architecture Workflow

After signing in:

1. Open `/products`.
2. Create a product or open an existing product.
3. On the product detail page, edit product metadata and create ordered modules.
4. Open a module to edit module metadata and create ordered features.
5. Open a feature to manage its overview, status, related sources, related features, Product Graph, grouped knowledge, timeline placeholder, tasks, and Context Packs.

Feature statuses are:

- `active`
- `planned`
- `deprecated`
- `archived`

## Nextzen Demo Walkthrough

Run `npm run db:migrate` and `npm run db:seed` after configuring `.env.local`. The seed creates `Nextzen Demo`, a fictional grants and program management platform with four modules:

- Progress Reporting
- Application Review
- Award Management
- Design System

The seeded story is centered on the task `Add bulk approval to Progress Report Review.` It is designed to prove the Context OS loop: feature-aware memory, retrieval, useful Context Pack output, then decision capture back into memory.

Recommended demo path:

1. Open `/products` and inspect `Nextzen Demo`.
2. Open Progress Reporting -> Review Progress Report to see related memory and timeline context.
3. Open Application Review -> Bulk Review to see the existing bulk action pattern.
4. Open Design System -> BulkActionBar and ConfirmationModal to inspect reusable component memory.
5. Open `/context-packs` or `/tasks` and find `Add bulk approval to Progress Report Review.`
6. Confirm the seeded Context Pack includes approval behavior, approval permissions, compliance restrictions, the 100-record API limit, Application Review bulk action pattern, BulkActionBar, ConfirmationModal, and the rejected persistent toolbar.
7. Use `/intelligence` to ask what will be affected if Progress Report Review changes.
8. Paste an AI or design outcome into the Context Pack detail page to capture decisions back into reviewed Product Memory.

The demo includes six fictional source records: requirements note, design critique note, engineering constraint note, research summary, release note, and design system note. It also includes historical memory for the old 50-record API limit, the later 100-record limit, the rejected persistent toolbar, standardized confirmation modal copy, the mixed-selection issue, and the BulkActionBar accessibility improvement.

## Daily Workflow Surface

After sign-in, `/dashboard` shows the selected product, module and feature coverage, verified Product Memory count, unresolved conflicts, recent sources, recent tasks, recent Context Packs, and suggested next actions.

Product detail pages now act as stronger product homes with Product Graph metrics, feature map, top knowledge categories, open questions, conflict alerts, and recent timeline events. Feature detail pages include a tab-style section bar for overview, knowledge, sources, relationships, timeline, tasks, and Context Packs.

Use `/knowledge` to filter Product Memory by product, module, feature, knowledge type, lifecycle status, and authority. Use `/sources` to filter source evidence by product, module, feature, and source type.

## Feature Memory Workflow

Inside a feature workspace:

1. Create Product Memory using the structured form.
2. Choose a knowledge type, authority, confidence, lifecycle status, valid dates, and source evidence.
3. Keep manual knowledge `proposed` unless intentionally marking it verified.
4. Open a knowledge item to inspect full evidence, relationships, lifecycle history, and metadata.
5. Use lifecycle controls for `proposed -> verified`, `verified -> outdated`, `proposed -> rejected`, and `verified -> rejected` with confirmation.

Knowledge is grouped by current behavior, product rules, business rules, UX patterns, technical constraints, permissions, decisions, rejected approaches, known issues, research insights, components, and terminology.

## Source Ingestion Workflow

Open `/sources` after signing in to manually add fictional source evidence. A source requires a product, source type, name, and raw content. It can optionally attach to a module or feature and include URL and metadata JSON.

Supported source types are `note`, `prd`, `jira_ticket`, `figma_link`, `figma_notes`, `research_note`, `release_note`, `slack_summary`, `code_note`, `design_system_doc`, and `meeting_note`.

Each source detail page shows metadata, raw content, graph attachment, connected knowledge items, and an extraction status placeholder. Sources remain evidence records; trusted Product Memory still requires structured knowledge linked to sources and human verification.

For Figma evidence, use `figma_link` for a design URL and `figma_notes` for manually written design context. Optional metadata keys are `figmaFileKey`, `figmaNodeId`, `figmaUrl`, `figmaPageName`, `figmaFrameName`, and `componentName`. Source detail pages render these fields when present and show related feature/component Product Memory links. The future Figma path is documented in `docs/figma-integration-plan.md`; the MVP does not connect to Figma APIs, OAuth, or MCP yet.

## AI Knowledge Extraction Workflow

From a source detail page, click `Extract Product Knowledge` to send the source plus product/module/feature context to the server-side AI provider. The model is instructed to extract discrete product facts rather than summarize the document.

The review screen shows each candidate with title, type, confidence, suggested authority, source evidence, reasoning summary, possible relationships, historical state, and possible conflicts. Candidates can be edited before approval, rejected, or approved all at once.

Only approved candidates become `knowledge_items`, and they are created as verified Product Memory with a `knowledge_sources` evidence link back to the source. Pending and rejected candidates remain extraction review records and do not enter trusted Product Memory.

## Conflict Review Workflow

When extraction creates candidates, Context OS compares them to verified Product Memory in the product, module, feature, and related-feature scope. Potential conflicts are stored as `knowledge_conflicts` with snapshots of the existing memory and the new candidate.

The review screen shows conflict type, evidence, authority, verification dates, affected graph scope, and decision actions:

- `Replace Existing`: approve the new candidate, mark existing memory outdated, and record a `supersedes` relationship.
- `Keep Both`: approve the new candidate while preserving existing verified memory and recording that both were intentionally kept.
- `Mark Existing Outdated`: preserve the old item as outdated history and approve the new candidate.
- `Reject New`: reject the candidate without writing it to Product Memory.

Context OS never deletes old Product Memory during conflict resolution. Outdated historical memory remains queryable with lifecycle metadata.

## Product Graph Workflow

Context OS models product relationships as explicit rows, not document blobs. Feature relationships are stored in `feature_relationships`; knowledge relationships are stored in `knowledge_relationships`. Both are product-scoped, auditable, and include a human-readable reason.

Supported feature relationship types are `depends_on`, `similar_to`, `reuses_pattern_from`, `blocks`, `replaces`, `impacts`, and `shares_component`.

Supported knowledge relationship types are `supports`, `contradicts`, `supersedes`, `duplicates`, `explains`, `constrains`, `evidence_for`, and `related_to`.

The product detail page shows the MVP Product Graph summary. Feature detail pages show related features plus applicable constraints, decisions, rejected approaches, and components. Knowledge detail pages allow users to add or remove relationships between memory items while preserving source-backed history.

The fictional Nextzen Demo seed includes graph edges for Progress Report Review reusing Application Review bulk action patterns, `BulkActionBar`, `ConfirmationModal`, the rejected persistent toolbar, and the 100-record API limit.

## Semantic Retrieval Architecture

Prompt-time retrieval starts with `retrieveProductContext({ productId, userId, taskDescription, primaryFeatureId })`. The service verifies product ownership before generating the task embedding or querying vectors.

Embeddings are stored in `knowledge_embeddings` with:

- `knowledge_item_id`
- `product_id`
- `embedding`
- `embedding_model`
- `embedding_dimensions`
- `content_hash`
- `embedded_at`

The migration enables pgvector with `CREATE EXTENSION IF NOT EXISTS vector;`. The schema uses the centralized default embedding dimensions from `src/ai/embedding-config.ts`. Changing embedding dimensions later should be done as an explicit migration so the Postgres vector column stays compatible with the configured model.

Only trusted Product Memory is embedded automatically. Verified knowledge is embedded when it is created, approved from extraction, marked verified, or meaningfully edited. Trusted `rejected_approach` memory can also be embedded because rejected historical approaches are useful context. Rejected extraction candidates are never embedded because they never become trusted Product Memory.

Retrieval is hybrid. Vector similarity is only the first candidate source. Final ranking also considers primary feature association, module proximity, feature relationships, knowledge relationships, authority, lifecycle status, verification recency, and task intent. Current canonical memory normally ranks above obsolete or low-authority memory, while historical rejected approaches can still rank when they are relevant to changing an existing pattern.

Development diagnostics include semantic score, authority adjustment, relationship adjustment, lifecycle adjustment, proximity adjustment, recency adjustment, final score, and the inclusion reason. These diagnostics are returned by the service in development mode or when explicitly requested, and are not exposed in production UI by default.

## Task And Context Pack Workflow

Open `/tasks` to create a task with title, description, product, optional primary feature, and task intent. Task creation calls `retrieveProductContext()` with the selected product and feature boundary, then compiles a Context Pack.

Generated packs include:

- Task
- Product / Module / Feature
- Current Behavior
- Relevant Product Rules
- Permissions
- UX Patterns
- Technical Constraints
- Related Features
- Relevant Components
- Decisions
- Rejected Approaches
- Known Issues
- Source Evidence
- Open Questions
- Suggested Prompt

Context Packs are saved in `context_packs` and their included Product Memory rows are saved in `context_pack_items` with relevance scores and inclusion reasons. Regeneration creates a new `version` for the same task and keeps prior pack outputs available as historical artifacts.

The Context Pack detail view lives at `/products/[productId]/context-packs/[contextPackId]`. It shows pack metadata, included memory, source evidence, regeneration controls, and a copy-friendly compiled pack body for Codex, Claude, ChatGPT, or similar AI tools.

Context Pack evidence is grouped under included Product Memory claims in the UI. Generated/exported pack text keeps evidence concise by citing source name, source type, created date, optional source date, URL, and excerpt.

## Context Pack Export Modes

Context Packs can be exported in four formats:

- Codex build prompt: implementation-oriented, with feature context, constraints, existing patterns, technical constraints, source-backed decisions, acceptance criteria, instructions to avoid unrelated refactors, and checks to run.
- Claude design prompt: product/design-oriented, with roles, existing UX behavior, design patterns, components, related Figma evidence, product rules, known issues, rejected approaches, open questions, and a suggested design brief.
- ChatGPT analysis prompt: reasoning-oriented, with product background, task, relevant memory, conflicts, decision history, source evidence, questions to answer, and expected output shape.
- Plain Markdown: the stored Context Pack without tool-specific framing.

The export panel on the Context Pack detail page includes a mode selector, copy button, download markdown button, and visible preview. Formatting lives in `src/lib/context-packs/exports.ts` so the same pack can move into multiple AI tools without coupling Context OS to one provider or chat interface.

## Decision Capture Workflow

After exporting a Context Pack and completing work in Codex, Claude, ChatGPT, or separate notes:

1. Open the Context Pack detail page.
2. Paste the work result into `Capture task outcome`.
3. Add a summary, final decision notes, links or references, and affected module/feature.
4. Context OS creates a `task_outcome` source and extracts pending decision candidates.
5. Review each candidate, edit title/body/type/authority/evidence, optionally link it to existing Product Memory, then approve or reject.

Only approved candidates become verified `knowledge_items`. Approval creates the evidence link, task link, Context Pack/outcome link, optional knowledge relationship, embedding sync, and a feature timeline event. Rejected and pending candidates stay as review records and never become trusted Product Memory automatically.

## Product Intelligence Workflow

Open `/intelligence` to run guided product-aware queries. The user chooses a product, optional module, optional feature, a structured question type, and optional detail. Supported question types cover change impact, similar solutions, pattern rationale, modification considerations, recent decisions, outdated or conflicting knowledge, and reused components or patterns.

Product Intelligence uses retrieval and Product Graph relationships before synthesis. The AI provider receives only selected Product Memory, relationship paths, and source evidence. Generated answers show the direct answer, supporting memory ids, relationship path, source evidence, risks, open questions, confidence, and unsupported claims.

Product Intelligence answers are not Product Memory. They are analysis outputs. Any new decision or rule discovered from the work still needs the decision capture review flow before it can become trusted memory.

## Evidence And Audit Trail

Context OS preserves trust by keeping claims inspectable instead of silently flattening them into generated text.

- Knowledge detail pages show linked source evidence with source type, source name, URL, excerpt, created date, authority, and trust labels.
- Context Pack detail pages group evidence under each included memory item so important claims can be inspected without making the pack unreadable.
- The generated Context Pack includes concise evidence references for retrieved memory.
- Audit events are stored in `product_audit_events` with relational links back to the relevant product, module, feature, source, knowledge item, task, Context Pack, outcome, extraction run, candidate, or conflict.
- Product and feature timelines combine lifecycle history with audit trail events. Source detail pages show source-specific audit history.
- Trust labels use `Verified`, `Proposed`, `Outdated`, `Rejected`, `Canonical`, and `Unverified`.

## AI Provider Architecture

AI calls live under `src/ai` and are server-side only. The first provider is `openai-compatible`, configured by environment variables. UI components and Product Memory database services should call domain operations such as `extractProductKnowledge(source, existingFeatureContext)` rather than calling a model provider directly.

The AI layer is split into provider config, provider implementation, prompts, schemas, and operations. Structured outputs are validated with Zod. Malformed JSON, schema mismatches, provider failures, and source-id mismatches fail before anything can be written to Product Memory.

To add another provider later, add a provider implementation that satisfies `AIProvider`, extend the `AI_PROVIDER` config parser, and keep existing domain operations unchanged.

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run eval
npm run build
npm run start
npm run db:generate
npm run db:migrate
npm run db:seed
```

`npm run build` uses the webpack builder because the default Turbopack build can attempt a sandbox-blocked local port bind in this environment.

## QA And Evaluation Harness

Run `npm run eval` to execute deterministic Nextzen Demo evaluation cases for retrieval and Context Pack quality. The harness lives in `src/lib/evaluation/nextzen-evaluation.ts` with a CLI runner at `scripts/evaluate-nextzen.ts`.

The evaluation cases cover:

- Add bulk approval to Progress Report Review
- Redesign report correction request flow
- Change confirmation modal pattern
- Increase bulk operation limit
- Compare Application Review and Progress Report Review
- Identify outdated bulk API knowledge
- Ask why persistent bulk toolbar should not be used

The report prints expected item recall, unexpected excluded item hits, source evidence coverage, outdated/conflict/rejected warning surfacing, tenant isolation, and selected memory for each case. The runner exits nonzero if a case falls below the configured threshold, so it can be used before changing retrieval or Context Pack generation.

## Project Rules

Read `PROJECT_RULES.md` before making product or architecture changes.

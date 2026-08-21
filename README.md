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

`db:generate` writes Drizzle migrations under `src/db/migrations`. `db:migrate` applies them to Neon using `DATABASE_URL`. `db:seed` creates fictional Nextzen Demo data.

## Database Architecture

Database concerns are separated from UI components:

- `src/db/index.ts` creates the Neon serverless Drizzle client.
- `src/db/schema/` contains auth tables, Product Memory tables, and relations.
- `src/db/migrations/` contains generated SQL migrations.
- `src/db/queries/` contains authorized query and service functions.
- `src/db/seed.ts` seeds fictional development data.

Core Product Memory tables include products, modules, features, knowledge items, knowledge embeddings, sources, knowledge-source links, knowledge relationships, feature relationships, tasks, Context Packs, and Context Pack items.

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
- Manual Source Ingestion supports product/module/feature attachment, source type validation, metadata JSON, raw content storage, source detail pages, connected knowledge display, and an extraction handoff shape for the later AI extraction prompt.
- AI provider abstraction supports server-side text, structured output, and embedding operations with timeout, retry, error handling, malformed response handling, and a Product Memory extraction operation that returns proposed candidates only.
- AI Knowledge Extraction can run from a raw Source, persist atomic candidates for review, and only write approved candidates into verified Product Memory with source evidence attached.
- Conflict detection compares extracted candidates to verified memory, surfaces contradictions, supersessions, duplicates, historical/current mismatches, and authority mismatches, and requires explicit human resolution before conflicted candidates enter Product Memory.

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
npm run build
npm run start
npm run db:generate
npm run db:migrate
npm run db:seed
```

`npm run build` uses the webpack builder because the default Turbopack build can attempt a sandbox-blocked local port bind in this environment.

## Project Rules

Read `PROJECT_RULES.md` before making product or architecture changes.

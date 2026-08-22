# Context OS Architecture

Context OS is a product-memory application for mature software products. The application turns product structure, source-backed knowledge, retrieval, Context Pack generation, and decision capture into explicit relational state in Neon Postgres.

## Application Structure

The app uses the Next.js App Router under `src/app`.

- `src/app/layout.tsx` is the root layout.
- `src/app/(auth)` contains sign-in and sign-up screens.
- `src/app/(app)` contains authenticated product-memory routes.
- `src/app/api/auth/[...all]/route.ts` exposes Better Auth handlers.
- `src/app/actions` contains server actions for product architecture, source ingestion, extraction review, feature memory, product graph relationships, Context Packs, and decision capture.
- `src/components` contains reusable UI primitives and product-specific building blocks.

Route groups separate auth UI from the authenticated app shell without adding route path segments. Dynamic product routes use product, module, feature, source, Context Pack, extraction, outcome, and knowledge ids as URL segments.

## Server And Client Boundary

Pages and layouts are Server Components by default. They should load authenticated data on the server, call query/domain services, and pass rendered data into smaller interactive Client Components.

Use Client Components only for browser behavior such as form submission state, copy/download buttons, menus, mode selectors, sign-out, and other direct user interactions. Do not import server-only database, auth, or AI provider modules into Client Components.

Secrets must stay server-side. Only `NEXT_PUBLIC_APP_URL` is intended to be readable by the browser. Database credentials, Better Auth secrets, AI API keys, and model configuration must remain in server runtime code.

## Authenticated App Shell

`src/app/(app)/layout.tsx` calls `requireUser()` before rendering protected routes. Authenticated pages render through `AppShell`, which provides navigation, product context placeholders, and a consistent work-focused frame.

Authentication is handled by Better Auth with the Drizzle adapter:

- Server config: `src/lib/auth/index.ts`
- Client helper: `src/lib/auth/client.ts`
- Session helper: `src/lib/auth/session.ts`
- Origin handling: `src/lib/auth/origins.ts`
- Auth schema: `src/db/schema/auth.ts`

## Domain Layer

Domain behavior lives outside React where possible.

- `src/lib/context-packs` compiles and exports Context Packs.
- `src/lib/product-graph` handles relationship parsing and graph behavior.
- `src/lib/product-memory` contains knowledge forms, lifecycle options, and conflict rules.
- `src/lib/retrieval` contains hybrid ranking behavior.
- `src/lib/source-ingestion` models manual sources, extraction candidates, review forms, and Figma metadata placeholders.
- `src/lib/decision-capture` models outcome-to-memory candidate review.
- `src/lib/evidence` turns source links into inspectable evidence cards.
- `src/lib/evaluation` contains deterministic Nextzen Demo evaluation cases.

React pages should orchestrate these services rather than embedding domain rules directly in UI markup.

## Data Layer

Neon Postgres is the source of truth. Drizzle is the only ORM layer.

- `src/db/index.ts` creates the Neon serverless Drizzle client.
- `src/db/schema/auth.ts` defines Better Auth tables.
- `src/db/schema/product-memory.ts` defines Product Memory, Product Graph, sources, tasks, Context Packs, retrieval, extraction, conflict, decision-capture, and audit tables.
- `src/db/schema/relations.ts` defines Drizzle relations.
- `src/db/queries` contains authorized query and mutation helpers.
- `src/db/migrations` contains generated migrations.
- `src/db/seed.ts` seeds the fictional Nextzen Demo dataset.

The schema is intentionally relational. Product, module, feature, knowledge, source, relationship, task, Context Pack, outcome, candidate, embedding, and audit concepts are represented as explicit tables instead of being collapsed into JSON blobs.

JSONB is used only for flexible metadata, snapshots, retrieval diagnostics, and provider-shaped outputs where fixed columns would add churn.

## Drizzle Migration Flow

Schema changes should be made in `src/db/schema`, then generated with:

```bash
npm run db:generate
```

Apply migrations with:

```bash
npm run db:migrate
```

The project loads `.env.local` for Drizzle config and seed scripts through `@next/env`, so database scripts use the same `DATABASE_URL` as local Next.js runtime.

If `drizzle-kit migrate` hangs against Neon, the same migration files can be applied through the Drizzle Neon HTTP migrator. Keep the migration journal in `drizzle.__drizzle_migrations` accurate.

## Neon Postgres Source Of Truth

Postgres stores:

- Product structure: products, modules, features.
- Product Memory: knowledge items, lifecycle, authority, confidence, valid dates.
- Evidence: sources and knowledge-source links.
- Product Graph: feature relationships and knowledge relationships.
- Workflows: tasks, Context Packs, Context Pack items, outcomes, decision candidates.
- Retrieval state: pgvector embeddings and ranking inputs.
- Trust history: knowledge events, conflicts, and product audit events.

No Supabase, Firebase, MongoDB, separate vector database, or external persistence system should be added without a clear later architectural reason.

## Authorization Model

The current MVP is owner-scoped. A product belongs to one authenticated user through `products.created_by`. Query functions receive a `userId` and enforce product ownership before returning or mutating product-scoped data.

Important rules:

- Do not rely on frontend hiding for security.
- Server pages, server actions, query functions, retrieval, and AI operations must enforce ownership.
- Product-scoped queries should filter or pre-check through product ownership.
- Retrieval must filter embeddings by `product_id` and authenticated ownership before ranking.

Tests cover key authorization guard behavior and retrieval isolation. Prompt 22 expands this into deeper tenant-isolation hardening.

## AI Provider Abstraction

The AI provider abstraction lives under `src/ai`.

- `src/ai/config.ts` parses provider configuration.
- `src/ai/provider.ts` defines the provider interface and the first OpenAI-compatible implementation.
- `src/ai/prompts` stores task-specific prompts.
- `src/ai/schemas` stores Zod schemas for structured outputs.
- `src/ai/operations` exposes domain operations such as product knowledge extraction, Product Intelligence answers, and decision capture extraction.

Business logic should call domain operations, not provider SDKs directly. Adding Anthropic, OpenAI, local models, or another provider later should require a new provider implementation and config parser extension, not rewrites to Product Memory workflows.

## Product Graph

The Product Graph is explicit relational structure:

- Product -> Module -> Feature.
- Feature -> Feature relationships.
- Knowledge -> Knowledge relationships.
- Knowledge -> Source evidence links.
- Knowledge -> Task / Context Pack / Outcome links.

Graph relationships influence feature pages, knowledge pages, Product Intelligence answers, retrieval ranking, and Context Pack composition.

## Retrieval Architecture

Retrieval starts with `retrieveProductContext()`.

The pipeline:

1. Verify product ownership.
2. Generate an embedding for the task description when AI credentials are available.
3. Query `knowledge_embeddings` inside the product boundary.
4. Combine vector similarity with authority, lifecycle, feature proximity, module proximity, graph relationships, recency, and task intent.
5. Return ranked memory with source evidence and development diagnostics.

pgvector lives inside Neon Postgres. There is no separate vector database.

## Context Pack Generation

Task creation or regeneration retrieves relevant Product Memory and compiles a Context Pack. The pack stores generated content in `context_packs` and its included memory rows in `context_pack_items`.

Exports are provider-neutral. `src/lib/context-packs/exports.ts` formats the same saved pack for Codex, Claude, ChatGPT, or plain Markdown without turning Context OS into a chat product.

## Decision Capture Loop

After a Context Pack is exported and work is completed elsewhere, the outcome is pasted back into Context OS.

The decision capture loop:

1. Store the task outcome as a source-like record linked to the original task and Context Pack.
2. Extract candidate decisions, rules, constraints, rejected approaches, open questions, issues, and terminology.
3. Keep candidates pending until a human reviews them.
4. On approval, create verified Product Memory with source evidence and task/outcome links.
5. Record audit events and optional relationships to prior memory.

AI never directly marks memory trusted without human review.

## Future Integration Boundaries

Future integrations should enter through source ingestion and evidence models first. Figma is the only planned near-term integration and currently exists as manual `figma_link` and `figma_notes` source metadata.

Jira, codebase indexing, Slack, MCP, and richer Figma flows should preserve the same Product Memory rules: source-backed claims, explicit relationships, human review before trust, and Postgres as the source of truth.

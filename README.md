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

Core Product Memory tables include products, modules, features, knowledge items, sources, knowledge-source links, knowledge relationships, feature relationships, tasks, Context Packs, and Context Pack items.

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
- Tests cover auth guard behavior, ownership filter construction, and seed data consistency.
- Product Architecture UI is implemented for Product -> Module -> Feature management.
- Product pages support create/edit, summary counts, modules, recent knowledge, and recent Context Packs.
- Module pages support create/edit/reorder-by-position and feature lists.
- Feature pages support edit/reorder/status changes and act as the feature-level Product Memory workspace.
- Feature Memory management supports manual knowledge creation, editing, source association, lifecycle transitions, detail views, and visible timeline events.
- Knowledge detail pages show full body, source evidence, relationships, lifecycle history, valid dates, and created/updated metadata.
- Manual Source Ingestion supports product/module/feature attachment, source type validation, metadata JSON, raw content storage, source detail pages, connected knowledge display, and an extraction handoff shape for the later AI extraction prompt.
- AI provider abstraction supports server-side text, structured output, and embedding operations with timeout, retry, error handling, malformed response handling, and a Product Memory extraction operation that returns proposed candidates only.

## Product Architecture Workflow

After signing in:

1. Open `/products`.
2. Create a product or open an existing product.
3. On the product detail page, edit product metadata and create ordered modules.
4. Open a module to edit module metadata and create ordered features.
5. Open a feature to manage its overview, status, related sources, related features, grouped knowledge, timeline placeholder, tasks, and Context Packs.

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

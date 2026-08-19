# Context OS

Context OS is a living product-memory layer for teams working on mature software products. It turns product structure, decisions, constraints, history, relationships, and evidence into structured Product Memory, then generates task-specific Context Packs for AI tools such as Codex, Claude, and ChatGPT.

The current dataset is fictional and Nextzen-like. Do not ingest employer data or proprietary material into this repo.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn-style local UI primitives
- Neon Postgres with `@neondatabase/serverless`
- Drizzle ORM and Drizzle migrations
- Managed Better Auth / Better Auth-compatible auth route
- pgvector in Neon Postgres for memory embeddings
- Provider-neutral AI abstraction using environment variables

## Product Principles

- Neon Postgres is the source of truth for Product Memory.
- Product structure, knowledge, sources, relationships, tasks, context packs, and embeddings are relational first.
- JSONB is limited to flexible metadata.
- Every important claim should link to source-backed evidence.
- Contradictions are preserved and surfaced rather than silently overwritten.
- Human verification is required before extracted memory becomes trusted.

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment

Set these values in `.env.local`:

```bash
DATABASE_URL="postgres://user:password@host.neon.tech/context_os?sslmode=require"
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
BETTER_AUTH_URL="http://localhost:3000"
AI_PROVIDER="openai-compatible"
AI_API_KEY=""
AI_BASE_URL="https://api.openai.com/v1"
AI_MODEL="gpt-4.1-mini"
```

`AI_PROVIDER` is intentionally abstract. Business logic should depend on `src/ai/provider.ts`, not on a vendor SDK.

## Database

Generate migrations from the Drizzle schema:

```bash
npm run db:generate
```

Run migrations:

```bash
npm run db:migrate
```

The schema models:

- Product -> Module -> Feature
- Product objects such as flows, screens, components, APIs, roles, and permissions
- Sources with authority and freshness scores
- Knowledge items with status, type, time bounds, verification, and evidence
- Knowledge -> Knowledge relationships, including contradictions and supersession
- pgvector embeddings stored in Postgres
- Context tasks, generated Context Packs, included memory items, and captured decisions

## Quality Loop

After each implementation phase:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Update this README when architecture, setup, or product behavior changes.

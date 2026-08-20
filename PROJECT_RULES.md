# Context OS Project Rules

## Product Vision

Context OS is a living product-memory layer for teams working on mature software products. It gives AI tools the product memory they need before they work on an existing feature.

The product is not a generic knowledge base, generic document search tool, generic RAG demo, or generic AI chat interface. The core loop is feature-aware Product Memory, structured Product Graph, authority and time-aware knowledge, hybrid retrieval, task-specific Context Packs, and decisions captured back into memory.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style reusable primitives where useful
- Neon Postgres
- Drizzle ORM and migrations
- Neon Auth / Managed Better Auth
- pgvector inside Neon Postgres
- Provider-neutral AI abstraction

## Architectural Boundaries

- Neon Postgres is the source of truth for Product Memory.
- Do not use Supabase.
- Do not use Firebase.
- Do not introduce MongoDB.
- Do not introduce a separate vector database.
- Do not add external persistence systems unless there is a strong architectural reason later.
- Keep Product Memory highly relational.
- Use JSONB only for flexible metadata, not as the primary product model.
- Keep product naming centralized so `Context OS` can be changed later.

## Product Memory Rules

- Product structure, current state, decisions, history, relationships, constraints, and evidence are first-class objects.
- Every important claim should link back to source material.
- Authority matters. Current product rules are stronger than old discussions.
- Recency matters, but old rejected decisions can still be relevant.
- Contradictions must be preserved and surfaced.
- Human verification is required before AI-extracted knowledge becomes trusted memory.

## Implementation Rules

- Build the actual application, not a marketing site.
- Keep the UI dense, readable, calm, and work-focused.
- Do not make Context OS a generic chatbot.
- Do not ingest real employer data or proprietary material into the MVP demo dataset.
- Design future integrations for Figma, Jira, codebase indexing, Slack, and MCP, but keep the MVP source loop manual until the core works.

## Checks Before Finishing

Run and fix failures before finishing an implementation phase:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

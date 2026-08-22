# Security And Trust Boundaries

This document records the current security model for Context OS and the boundaries that must remain intact as the product evolves.

## Summary

Context OS stores Product Memory, source evidence, tasks, Context Packs, embeddings, and audit history in Neon Postgres. The current MVP uses Better Auth for authentication and service-layer authorization for tenant isolation.

The system is owner-scoped today: each product belongs to one authenticated user through `products.created_by`. All product-scoped data must be accessed through query/domain services that verify product ownership before reading or mutating related rows.

## Authorization Enforcement

Authorization is enforced server-side, not by hiding UI links.

Important entry points:

- `src/app/(app)/layout.tsx` requires a Better Auth session before rendering authenticated routes.
- `src/lib/auth/session.ts` exposes `requireUser()` and `assertAuthenticatedUserId()`.
- `src/db/queries/authorization.ts` provides ownership predicates.
- `src/db/queries/products.ts` exposes `assertProductOwnership()`.
- Product-scoped services call `assertProductOwnership(productId, userId, db)` before returning product data.

Direct ID reads should include both the object id and `productId`. Examples include products, modules, features, knowledge, sources, tasks, Context Packs, task outcomes, extraction candidates, and graph relationships.

## Tenant Isolation

Tenant isolation relies on these rules:

- `products.created_by` identifies the owner.
- Query functions receive the authenticated `userId`.
- Product ownership is checked before product-scoped data access.
- Child rows are filtered by `product_id` even when loaded through an already authorized parent.
- Relationship expansion is filtered by `product_id`.
- Context Pack items are filtered by the owning pack and by the included memory's `product_id`.
- Source evidence joins are filtered by the source's `product_id`.
- Review candidates are filtered by product and parent workflow ids.

Prompt 22 hardening tightened product filters in:

- Knowledge detail evidence, relationships, and history.
- Source detail linked knowledge.
- Context Pack items, outcomes, module lookup, and source evidence.
- Source extraction candidates, conflicts, and conflict-scope graph expansion.
- Decision capture candidates and included existing memory.
- Product Intelligence source evidence and graph expansion.

## Vector Retrieval Isolation

Semantic retrieval uses pgvector inside Neon Postgres through `knowledge_embeddings`.

The retrieval service:

1. Calls `assertProductOwnership(input.productId, input.userId, db)`.
2. Generates a task embedding only after authorization succeeds.
3. Queries embeddings with `knowledge_embeddings.product_id = input.productId`.
4. Joins to `knowledge_items` and repeats `knowledge_items.product_id = input.productId`.
5. Filters relationship paths by `knowledge_relationships.product_id = input.productId`.

This means another user's embedding rows are not candidates for ranking, even if they are semantically similar.

## Secrets

Secrets must not be exposed client-side.

Server-only values:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `NEON_AUTH_CLIENT_SECRET`
- `AI_API_KEY`
- model and provider configuration unless explicitly made public later

Browser-visible value:

- `NEXT_PUBLIC_APP_URL`

Do not log database URLs, auth secrets, AI API keys, raw provider credentials, or full exported Context Packs in production logs.

`.env.example` must contain placeholders only.

## AI Product Memory Trust

AI output is treated as untrusted until reviewed.

Required trust rules:

- AI extraction cannot create verified Product Memory directly.
- Extracted candidates are stored as pending review records.
- Structured outputs are validated with Zod schemas.
- Candidates must cite the expected source id.
- Unsupported claims must be skipped or listed as unsupported, not silently stored.
- Source content is framed as data in prompts and cannot override system instructions or project rules.
- Human approval is required before a candidate becomes verified Product Memory.

## Source Content And Prompt Injection

Source material, task outcomes, and imported integration content are untrusted data.

When source text is sent to an AI provider:

- Treat it as evidence text, not instructions.
- Keep project rules and system instructions outside the source payload.
- Ask the model to cite source evidence.
- Reject candidates that cite an unexpected source id.
- Preserve unsupported or uncertain claims as review information rather than trusted memory.

## Export Risks

Context Pack exports may contain sensitive product information, including rules, decisions, constraints, source excerpts, and internal workflow context.

The UI warns users before copy/download. For real company data, teams must approve which AI tools and workspaces may receive exported packs.

Future production work should add:

- Workspace-level data classification.
- Export audit events.
- Optional redaction policies.
- Admin controls for allowed export destinations.

## Database Boundaries

The schema uses explicit foreign keys, product ids, indexes, and join tables. JSONB is reserved for flexible metadata and snapshots.

RLS is not currently implemented. Service-layer authorization is the MVP boundary. Before production multi-tenant deployment, evaluate Postgres Row Level Security policies for product-scoped tables as defense in depth.

## Not Yet Production-Ready

The following areas need additional hardening before production use with real company data:

- Postgres RLS policy design and tests.
- Organization/workspace membership and role model beyond single owner.
- Export audit trail and redaction policy.
- Rate limiting for auth and AI-backed actions.
- Centralized security logging without sensitive payloads.
- Secret rotation and deployed environment management.
- Integration-specific OAuth and webhook verification.
- Automated browser/security tests for protected route behavior.

## Checks

Run before security-sensitive handoff:

```bash
npm run lint
npm run typecheck
npm run test
npm run eval
npm run build
```

The evaluation harness reports tenant isolation for retrieval and Context Pack quality. Unit tests should cover direct authorization failures before persistence, AI calls, or vector queries.

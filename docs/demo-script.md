# Context OS Demo Script

This script uses the fictional Nextzen Demo dataset. Do not use real employer data or proprietary product material in the MVP demo.

## Setup

1. Configure `.env.local`.
2. Run migrations and seed:

```bash
npm run db:migrate
npm run db:seed
```

3. Start the app:

```bash
npm run dev
```

4. Open the local URL shown by Next.js.

## 1. Sign In Or Create An Account

Open `/sign-up` and create a local account, or open `/sign-in` if you already created one.

The seed creates demo product data for `demo@context-os.local`, but Better Auth credentials are created through the sign-up flow. New accounts can still create their own products; the seeded account exists to support development workflows and database-level demo data.

## 2. Open Nextzen Demo

Go to `/products` and open `Nextzen Demo`.

Position the product:

- Nextzen is a fictional grants and program-management product.
- It has accumulated decisions, patterns, constraints, source evidence, and history.
- The demo task is `Add bulk approval to Progress Report Review`.

On the product page, point out:

- Modules and features.
- Product Graph coverage.
- Recent knowledge.
- Recent sources.
- Recent Context Packs.
- Timeline/audit entries.

## 3. Inspect Feature Memory

Open:

```text
Progress Reporting -> Review Progress Report
```

Show that the feature page is not just documentation. It contains:

- Current behavior.
- Product rules.
- Permissions.
- UX patterns.
- Technical constraints.
- Decisions.
- Rejected approaches.
- Known issues.
- Related features and components.
- Timeline history.

Emphasize that mature-product AI work needs this context before it changes an existing feature.

## 4. Review Evidence

Open a knowledge item from the feature page.

Show:

- Authority.
- Confidence.
- Lifecycle.
- Valid dates.
- Source evidence cards.
- Source excerpt.
- Source type and source date.
- Trust label.
- Related memory.

Explain that Context OS keeps source-backed claims inspectable instead of flattening everything into an opaque summary.

## 5. Show Existing Patterns

Open:

```text
Application Review -> Bulk Review
Design System -> BulkActionBar
Design System -> ConfirmationModal
```

Use these pages to show that Context OS can retrieve related patterns from other product areas before a designer or engineer asks AI to implement a feature.

The expected insight: bulk approval in Progress Reporting should reuse established Application Review and Design System patterns instead of inventing a new interaction.

## 6. Generate Or Open The Bulk Approval Context Pack

Open `/tasks` or `/context-packs` and find:

```text
Add bulk approval to Progress Report Review
```

Open the Context Pack detail page.

Show the included memory:

- Approval behavior.
- Approval permissions.
- Compliance restrictions.
- 100-record API limit.
- Application Review bulk action pattern.
- BulkActionBar.
- ConfirmationModal.
- Rejected persistent toolbar.
- Known mixed-selection issue.
- Source evidence.

Explain that the pack is task-specific. It is not a generic search result or chat transcript.

## 7. Export To An AI Tool

In the export panel, switch between:

- Codex build prompt.
- Claude design prompt.
- ChatGPT analysis prompt.
- Plain Markdown.

Use copy or markdown download.

Explain that the same Product Memory can be compiled differently depending on the tool and task, while the underlying memory remains provider-neutral.

## 8. Capture A Decision Back Into Memory

On the Context Pack detail page, use `Capture task outcome`.

Paste a fictional result such as:

```text
Bulk approval will use the existing BulkActionBar and ConfirmationModal. The action will be disabled for mixed selected states until the mixed-selection bug is resolved. The initial backend batch size remains capped at 100 records.
```

Submit the outcome.

Open the review page and show that extracted candidates are pending. Point out:

- AI output is not automatically trusted.
- Candidates can be edited.
- Candidates can be approved or rejected.
- Approval links decisions back to the outcome source and task.

## 9. Run Product Intelligence

Open `/intelligence`.

Try a product-aware query such as:

```text
What will be affected if Progress Report Review adds bulk approval?
```

Show that the answer uses Product Memory, Product Graph relationships, source evidence, and open risks. It is not a general-purpose chatbot answer.

Good things to call out:

- Related features and components.
- Existing decisions.
- Constraints.
- Rejected approaches.
- Supporting evidence.
- Unsupported claims or open questions.

## 10. Close The Loop

End the demo with the core loop:

```text
Create Product
-> Map Modules and Features
-> Add Product Knowledge
-> AI extracts candidates
-> Human verifies memory
-> User starts a task
-> Context OS retrieves relevant memory
-> Context Pack is exported
-> New decisions are captured back into Product Memory
```

The core promise: give AI the product memory it needs before it works on an existing feature.

# Histórico Feature Design

**Date:** 2026-05-23
**Scope:** Keep a browsable record of past gifted items per person.

---

## 1. Schema Approach — Recommendation: Option A (`arquivado`)

Add a single boolean column `arquivado` (default `false`) to `presentes`.

**Why Option A over Option B (year tagging):**

- The family has no existing "year" or "occasion" concept in the data model. Introducing `ano` would require a migration decision (what year are current gifts?) and adds UI complexity (year picker on the form).
- `arquivado` is a natural extension of the already-present `comprado` boolean. A gift that was bought and then manually archived is still queryable, filterable, and reversible with one column.
- Year can always be inferred from `created_at` for display purposes without being a first-class field.
- Option B would be the right call if occasions were ever named (e.g., "Natal 2025" vs. "Aniversário 2025"), but that complexity is out of scope.

**New column:**

```sql
ALTER TABLE presentes ADD COLUMN arquivado boolean NOT NULL DEFAULT false;
```

All existing queries keep `WHERE arquivado = false` (or filter client-side) to preserve current behavior.

---

## 2. UI — History Per Person, Not a Dedicated Page

History is shown as a collapsible "Histórico" section at the bottom of each person's gift list, below the active gifts. No new route or page is needed.

- The section is collapsed by default to keep the primary view uncluttered.
- Expanding it shows archived gifts in a read-only, visually muted style (greyed out, no checkboxes, no edit/remove buttons).
- This keeps history contextual: when you're looking at someone's list, their history is right there.

---

## 3. Archiving Flow — Manual, Offered When Removing a Bought Gift

When the owner clicks **remover** on a gift that is already `comprado = true`, the confirmation dialog offers two choices:

- **Arquivar** — sets `arquivado = true` (preserves the record)
- **Remover** — permanent delete (existing behavior)

For gifts that are NOT yet bought, "remover" stays a direct permanent delete — no archiving prompt. This keeps the flow clean; you wouldn't want to archive something that was never purchased.

No automatic archiving on year rollover — that would require a scheduled job and adds complexity with no clear trigger.

---

## 4. What's Shown in History

Each archived gift card displays (read-only):

- Nome
- Valor (if present)
- Comprado por (if present)
- Data de compra (derived from `created_at` — sufficient for display; no separate `comprado_at` column needed)

No link, observacao, edit, or remove controls are shown.

---

## 5. Schema Changes Summary

| Change | Detail |
|--------|--------|
| `presentes.arquivado` | `boolean NOT NULL DEFAULT false` |

Active-gifts queries: add `.eq('arquivado', false)` filter (or filter client-side as the app already loads all `presentes` into state).

No new tables. No new columns on `pessoas`.

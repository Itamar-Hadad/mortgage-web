# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

This is a **single-context** repo: one `CONTEXT.md` + `docs/adr/` at the repo root. There is no `CONTEXT-MAP.md`.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — glossary for the SimpleSave domain (משתמש סקרן/רשום, מסלול, בקשה, לווה, טיוטה).
- **`docs/adr/`** — read ADRs that touch the area you're about to work in (0001 anonymous progress in localStorage, 0002 Firestore-only, 0003 simulated payment, 0004 i18n-ready from day one).
- **`ARCHITECTURE.md`** at the repo root — the broader architecture decisions (roles, data ownership, calc-engine hosting, Firebase component map, known extension points). Not part of the generic skill contract, but read it for this repo specifically — it's the system-level companion to `CONTEXT.md`/ADRs.

If any of these files don't exist, proceed silently. Don't flag their absence; don't suggest creating them upfront.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids (e.g. say "בקשה" not "בקשת משכנתא"; say "משתמש סקרן" not "לקוח אנונימי").

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/grill-with-docs`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding — e.g. "Contradicts ADR-0001 (anonymous progress stays in localStorage only) — but worth reopening because…"
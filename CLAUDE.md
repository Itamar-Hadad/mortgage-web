# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

**SimpleSave** — a Hebrew mortgage-comparison and advisory platform, re-platformed from a single-file HTML simulator into a React + Firebase app. The repo contains:

- `app/` — React + Vite + TypeScript client (the main codebase to work in)
- `functions/` — Firebase Cloud Functions (Node/TS + Python/Agno agents)
- `project files/` — the original hackathon HTML simulator (`סימולטור_משכנתא.html`) plus sample bank PDFs; kept for reference/parser validation
- `ARCHITECTURE.md` — system-level decisions, roles, data model, calc-engine hosting split
- `CONTEXT.md` — domain glossary (use Hebrew terms as defined; do not drift to synonyms the glossary marks "Avoid")
- `docs/adr/` — ADRs; read before working on an area they cover

## Commands

All commands run from `app/`:

```bash
cd app
npm install           # first time
npm run dev           # dev server (Vite)
npm test              # Vitest unit tests
npm run build         # production build
```

Functions (from `functions/`):

```bash
cd functions
npm install
npm test              # emulator integration tests (requires Firebase CLI)
npm run build         # also runs sync-calc-engine.mjs (copies app/src/calc-engine → functions/src/calc-engine)
```

Linter: `oxlint` (config at `app/.oxlintrc.json`). No separate lint script is wired up — run `npx oxlint .` from `app/` if needed.

Deploy (never auto-deploy from git push):

```bash
firebase deploy --only functions          # after changing functions/
firebase deploy --only firestore:rules    # after changing Firestore rules
```

## Architecture

### React app (`app/src/`)

Route map (defined in `App.tsx`):

| Path | Component | Guard |
|---|---|---|
| `/` | `HomePage` | public |
| `/questionnaire` | `Questionnaire` | public (draft in localStorage) |
| `/sign-in` | `SignInPage` | public (consumers) |
| `/sign-up` | `SignUpPage` | public |
| `/staff-sign-in` | `StaffSignInPage` | public (staff only) |
| `/personal-area` | `PersonalArea` | `auth.currentUser` → redirect `/sign-in` |
| `/advisor` | `AdvisorScreen` | `RequireRole role="advisor"` |
| `/admin` | `AdminScreen` | `RequireRole role="admin"` |

**Auth guard**: `shared/RequireRole.tsx` reads `getIdTokenResult()` for the Firebase custom claim `role`. Admin is also allowed on `/advisor`.

**Roles** — Firebase Auth custom claims: `role: 'consumer' | 'advisor' | 'admin'`. Set by Cloud Functions (`claimConsumerRoleOnRegistration`, `createAdvisorCallable`), not manually in Firebase Console.

### Calculation engine (`app/src/calc-engine/`)

Ported unchanged from the original simulator. **Do not alter the formulas.**

- `calcRoute(route, params) → calc object` — full amortization for one route
- `calcMix(routes, params) → mix object` — aggregate totals
- `mixRisk` / `riskRuleForRoute` — risk scoring

**Fixed contract (ARCHITECTURE.md §6, §13):** signature of `calcRoute`/`calcMix` must not change — every consumer (consumer screens via Cloud Function, admin/advisor screens direct client-side) would break.

**Dual deployment:** Admin/advisor screens import this module directly (client-side, no round-trip). Consumer-facing screens call it through Cloud Function callables (`calcRouteCallable`, `calcMixCallable`, `mixRiskCallable`) — the formulas are never shipped to the consumer browser bundle.

`functions/sync-calc-engine.mjs` copies `app/src/calc-engine/` → `functions/src/calc-engine/` at build time, so there is one source of truth.

Tests use golden values extracted from the original HTML simulator running in a real browser — they are not hand-computed. Do not "fix" a golden-value test by changing the expected number unless you have re-run the original simulator to confirm the change.

### Data model (Firestore)

Central aggregate: `requests/{uid}` — owned by one Firebase Auth uid, contains arrays of `personal[]` (borrowers), `financial`, `loans`, `mixes`. Sub-collection: `requests/{uid}/messages` (consumer↔advisor thread).

Other collections: `advisors`, `templates`, `generalRates`, `riskRules`, `monthlyIndices`, `tasks`.

**No relational DB** (ADR-0002). Relationships are either nested (borrowers in request) or uid-reference (`assignedAdvisorUid`).

### Anonymous/pre-registration flow (ADR-0001)

Questionnaire draft lives **only in localStorage** — never in Firebase. On registration, `migrateDraftOnSignup` writes it once to `requests/{uid}`. A user who never registers leaves no trace in any backend store.

Firestore rules: `create` on `requests/{uid}` does **not** require `role=='consumer'` (the role claim isn't set yet at that moment); `update` does.

### i18n (ADR-0004)

All UI strings go through `i18next` via `t('key')`. Today only `he.json` exists (`src/locales/`). Never hardcode UI strings inline — adding a new language must require zero component changes.

### AI Agents (`agents/explainer/`, Cloud Functions Python)

Two Agno (Python) agents — **not** LangChain:

- **Intake agent** (`סוכן-קבלה`): alternative to the step form in `/questionnaire`. Writes the same draft structure to localStorage; does not use a separate data path.
- **Explainer agent** (`סוכן-הסבר`): RAG on the domain glossary + calls the calc Cloud Function for the user's real data. Accessible via `ExplainerChat.tsx`.

Cloud Functions use two runtimes intentionally: Node/TS (calc + auth callables) and Python (agents only).

## Key conventions

- **Branch naming**: `track-a/<issue>-slug` / `track-b/` / `track-c/` (tracks: consumer flow / registration+personal area / admin+advisor+calc)
- **PR body**: include `Closes #<number>` to auto-close the GitHub issue on merge
- **Issues/PR review**: GitHub Issues on `Itamar-Hadad/mortgage-web`. Use `gh` CLI.
- **Shared contracts**: if you change `calcRoute`/`calcMix` signatures, the Firestore `requests/{uid}` shape, or `role` claim names — call it out explicitly in the PR; never change silently
- **Charts**: register/destroy via `window._charts` keyed by canvas id (pattern from the original simulator, preserved in any new chart code)
- **ADR conflicts**: if your work contradicts an existing ADR, surface it explicitly rather than silently overriding

## Agent skills

### Issue tracker

GitHub Issues on `Itamar-Hadad/mortgage-web`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical names used as-is, no overrides (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Read `CONTEXT.md` + `docs/adr/` + `ARCHITECTURE.md` before exploring any area. See `docs/agents/domain.md`.

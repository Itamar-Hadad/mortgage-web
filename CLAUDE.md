# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

**SimpleSave** — a Hebrew mortgage-comparison and advisory platform, re-platformed from a single-file HTML simulator into a React + Firebase app. The repo contains:

- `app/` — React + Vite + TypeScript client (the main codebase to work in)
- `functions/` — Firebase Cloud Functions (Node/TS: calc-engine wrapper + auth callables)
- `agents/` — Python/Agno AI agents at the repo root (`explainer/`, `rate-watcher/`), a separate runtime from `functions/` by design
- `firestore/` + `firestore.rules` — Firestore indexes and security rules
- `ARCHITECTURE.md` — system-level decisions, roles, data model, calc-engine hosting split
- `CONTEXT.md` — domain glossary (use Hebrew terms as defined; do not drift to synonyms the glossary marks "Avoid")
- `docs/adr/` — ADRs; read before working on an area they cover

## Commands

All commands run from `app/`:

```bash
cd app
npm install                       # first time
npm run dev                       # dev server (Vite)
npm test                          # Vitest unit/component tests (vitest run)
npm test -- src/path/to.test.ts   # run a single test file
npm test -- -t "name fragment"    # run tests matching a name
npm run test:firestore            # Firestore-rules tests under the emulator (needs Firebase CLI)
npm run lint                      # oxlint (config at app/.oxlintrc.json)
npm run build                     # tsc -b && vite build
```

Functions (from `functions/`):

```bash
cd functions
npm install
npm run build           # runs sync-calc-engine.mjs (copies app/src/calc-engine → functions/src/calc-engine), then tsc
npm test                # Vitest unit tests
npm run test:emulator   # calc-engine integration test under the functions emulator (builds first)
npm run serve           # build + start functions emulator
```

Agents (Python, from repo root) — each loads `.env` from `app/.env` automatically:

```bash
python agents/explainer/main.py       # Explainer agent HTTP server (AgentOS, port 7777)
python agents/rate-watcher/main.py    # one-shot rate-drift check (writes to admin-alerts)
```

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

### AI Agents (`agents/`, standalone Python)

Agno (Python) agents — **not** LangChain. They run as their own processes at the repo root, separate from the Node/TS Cloud Functions (two runtimes is intentional). See ADR-0006.

- **Explainer agent** (`סוכן-הסבר`, `agents/explainer/`) — **implemented & live.** HTTP server on port 7777 (agent id `simplesave-explainer`). Glossary (`glossary.md`) is loaded inline into the system prompt — **not** RAG/embeddings (it's ~60 lines). One tool, `get_user_mortgage_data(user_id)`, pulls `requests/{uid}` from Firestore. Frontend talks to it via `VITE_EXPLAINER_URL` (`ExplainerChat.tsx` → `useExplainerChat.ts` → `POST /agents/simplesave-explainer/runs`).
- **Rate-watcher agent** (`סוכן-מעקב-ריביות`, `agents/rate-watcher/`) — **implemented & live.** One-shot job (every ~3 days) comparing CBS CPI + estimated prime against `config/generalRates`/`config/monthlyIndices`; writes to the `admin-alerts` collection when drift ≥ 0.1%. Internal/admin only — never faces end users.
- **Intake agent** (`סוכן-קבלה`) — **not implemented yet.** Planned alternative to the step form; would write the same draft structure to localStorage.

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

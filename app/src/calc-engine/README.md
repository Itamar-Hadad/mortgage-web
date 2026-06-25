# calc-engine

Ported from `project files/סימולטור_משכנתא.html` for issue #3 — `PMT`,
`calcRoute`, `mergeSplitRouteCalcs`, `calcMix`, `inferRouteKind`,
`riskRuleForRoute`, `mixRisk`. No formula was changed; every variant
(שפיצר/קרן שווה, בלון/גרייס, הצמדה מדד/דולר/אירו, ריבית יומית/חודשית,
מסלולים מפוצלים) is covered by golden-value tests whose expected numbers
were extracted by running the *original* functions in a real browser
(Playwright), not hand-computed — see the `*.test.ts` files.

## Fixed contract (ARCHITECTURE.md §13, §6)

`calcRoute(route, params) → calc object`, `calcMix(routes, params) → mix
object`. Admin/advisor screens import this module directly client-side;
consumer-facing screens call it through the Cloud Function wrapper in
`functions/` instead of shipping the formulas to their bundle (verified by
building the app and grepping `dist/` for calc-engine-only strings — see
the issue #3 PR description). **Whoever adds a new field or route type
adds it inside `calcRoute` without breaking this signature, and documents
it in the PR** — changing the signature itself requires updating every
consumer (track A מסך-שעונים, track C מסך-יועץ/מנהל, סוכן-הסבר).

`riskRuleForRoute(route, riskRules?)` and `mixRisk(routes, riskRules?)`
aren't bound by the two-argument contract above; `riskRules` defaults to
`defaultRiskRules()` but callers may pass their own (e.g. once issue #11
loads them from Firestore).

The original simulator's route/params fields that could be empty strings
while a user is mid-typing (`amount`, `years`, ...) are typed here as
plain `number` — callers (forms, Cloud Function input validation) resolve
to a number before calling into this module; that parsing concern doesn't
belong in the calc contract.

## Known extension seam: `useGeneralRate` / market-rate bands

The original simulator can auto-fill a route's rate from a managed rate
table (`rt.useGeneralRate` → `generalRateForRoute`/`datedRateForRoute`,
reading `state.generalRateBands`/`state.allPurposeRateBands`/`state.datedRateBands`).
That table is planned (ARCHITECTURE.md §9, issue #11) to live in
Firestore as admin-managed config, not in this module. `calcRoute` here
throws if `route.useGeneralRate` is set — once #11 exists, the caller
(component or Cloud Function) resolves the rate from Firestore and passes
already-resolved `anchor`/`margin` on the route, same as every other
route today. No change to `calcRoute` itself should be needed.

## Cloud Function wrapper

`functions/` (repo root, sibling to `app/`) wraps this module in three
`onCall` callables (`calcRouteCallable`, `calcMixCallable`,
`mixRiskCallable`). It does not import `app/src/calc-engine` directly —
`functions/sync-calc-engine.mjs` copies the module into
`functions/src/calc-engine` as part of `npm run build`, so there is one
source of truth (this directory) and the Cloud Function always ships
whatever it currently contains. Tested against the real Firebase Emulator
Suite (`npm test` in `functions/`), calling the callables the same way a
real screen would (Firebase JS SDK `httpsCallable`), not the internal
functions directly.
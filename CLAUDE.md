# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is not a conventional buildable project — there is no package manager, build tool, linter, test runner, or git history. It's a hackathon ("hakaton AI") workspace holding a single self-contained client-side web app plus reference/source documents used to build it.

```
project files/
  סימולטור_משכנתא.html     — the app: a Hebrew mortgage-mix ("תמהיל") simulator
  עיצוב מערכת 6.26((.docx  — full product spec for "SimpleSave", a much larger
                              planned platform; this HTML file implements only
                              the mix-calculator/simulator piece of that vision
  *.pdf                     — sample Israeli-bank mortgage balance certificates
                              (Hapoalim, Mizrahi-Tefahot, Discount, Leumi, FIBI),
                              used as test input for the report-import parsers
base 44 pics/                — currently empty
```

There is no README and no existing CLAUDE.md to reconcile with.

## Running / developing

Open `project files/סימולטור_משכנתא.html` directly in a browser — there's no dev server, bundler, or test suite. All logic lives inline in one `<script>` block (~3300 lines total for the file); there is nothing to compile.

**Known gap:** the HTML head references three files that do not exist anywhere in this repo:
```html
<script src="./document-engine.js"></script>   <!-- must expose a global pdfjsLib -->
<script src="./insurance-rates.js"></script>    <!-- must expose window.INSURANCE_RATES -->
```
and the PDF-extraction code additionally points the PDF.js worker at `./document-worker.js`. Without these three files, the app still loads and the core mortgage-mix calculator works, but two features fail at runtime: importing a bank balance-certificate PDF (`extractPdfReport`/`handleMortgageReport`, `extractInsurancePolicyText`, `importInsuranceRatesPdf`) and anything reading `window.INSURANCE_RATES` (life-insurance premium comparisons). If asked to "fix" or extend those features, the missing files need to be supplied/restored, not just patched around.

Chart.js 4.4.1 is loaded from a CDN (`cdnjs.cloudflare.com`) — there's no offline fallback.

## Architecture of the simulator (`סימולטור_משכנתא.html`)

Single-page, tab-based app, RTL Hebrew UI, no framework — plain DOM construction via the `el()` helper. Tabs (`.tab` / `.view` pairs, switched by `data-v`): `personal`, `financial`, `mixes`, `templates`, `params`, `insurance`, `prepayment`, `summary`, `schedule`, `ref`.

- **Single global mutable `state` object** (`let state`) holds everything: borrowers (`personal`), `financial` inputs, existing `loans`, calculation `params` (index/CPI assumptions), `generalRates` (rate tables by route type), `riskRules`, `insurance`/`buildingInsurance`/`currentPolicy`, `prepayment` inputs, and `mixes` — a dict keyed by `current, t1..t5` (the "current mortgage" plus five comparison mixes, mirroring the product spec's "five clocks/שעונים" concept). Default shape: `defaultState()`; demo data: `exampleState()` (wired to the "סימולטור · שם לקוח" button via `loadExample()`).
- **Render cycle:** every state mutation calls `recalc()`, which debounces (`setTimeout`) into `renderAll()`. `renderAll()` re-renders every tab unconditionally (`renderPersonal`, `renderFinancial`, `renderParams`, `renderMixes`, `renderSummary`, `renderSchedule`, `renderRef`, `renderInsurance`, `renderPrepayment`, plus template/selector refreshers) — there is no incremental/virtual-DOM diffing, so renders are full rebuilds of each tab's DOM.
- **Calculation engine** (top of the script, "מנוע חישוב"): `calcRoute(route, params)` computes a full amortization schedule for one route (handles שפיצר/קרן שווה boards, balloon/grace (`בלון`/`גרייס`) variants, CPI/$/€ indexation, daily vs. monthly interest compounding, and split loan-purpose routes via `mergeSplitRouteCalcs`). `calcMix(routes, params)` aggregates an array of routes into mix-level totals (weighted rate/years, total interest, indexation, first payment, etc.). `mixRisk`/`riskRuleForRoute` score a mix's risk level against `riskRules`/`defaultRiskRules()`.
- **Mix templates:** `CLOCK_TEMPLATES` are canned route combinations; `selectTemplateForEdit`/`TEMPLATE_DRAFT`/`saveTemplateEditor` implement an editor for these under the "תבניות קבועות" tab. `calculateMixToRange`/`shortenFixedRoutesToMaximum` auto-fit a template to a target payment range.
- **Bank report import (PDF):** one parser per bank under "מסלי דוחות" logic — `parseHapoalimReport`, `parseMizrahiReport`, `parseDiscountReport`, `parseLeumiReport`, `parseFibiReport` — each takes extracted PDF text/pages and returns route data via `routeFromReportData`. Driven by `extractPdfReport` → `handleMortgageReport`/`importMortgageReportFile`. The sample PDFs under `project files/` are real (sanitized) certificates from these banks — use them to validate parser changes.
- **Insurance:** life-insurance rate lookups (`window.INSURANCE_RATES`, keyed by smoker/gender profile → age → company) drive `insuranceProjection`/`renderInsurance`; building/structure insurance is separate (`renderBuildingInsurance`). Policy PDFs can be imported and auto-parsed (`parseInsurancePolicyText`).
- **Prepayment / early-repayment fee:** "עמלת היוון" tab (`prepaymentCalculation`, `renderPrepayment`) estimates the bank's early-exit penalty for a selected route.
- **Schedule & export:** `renderSchedule`/`scheduleTable`/`toYearly` build the amortization table per mix (monthly or yearly); `exportScheduleCSV` exports it.
- **Persistence:** `saveJSON()`/`loadJSON()` serialize/restore the entire `state` object to/from a downloaded `.json` file — there is no backend and no localStorage; closing the tab loses unsaved work unless exported. `window.print()` is used for PDF/print export of the current view.
- **Charts:** all charts go through `window._charts` (a registry keyed by canvas id) so re-renders destroy and recreate Chart.js instances rather than updating them in place — keep this pattern when adding new charts.

## Context from the design doc

`עיצוב מערכת 6.26((.docx` describes "SimpleSave" — a far larger planned product (lead intake, OTP-based personal area, advisor/admin areas, document upload & bank-approval workflow, eligibility-loan calculations, multi-language support). The HTML simulator in this repo implements only the calculator/comparison core of that spec (personal+financial intake → mix builder → five-way comparison → schedule). When making product-shaped decisions (terminology, field names, bank lists, risk-rule tiers), prefer matching the Hebrew terminology already used in the HTML/doc rather than inventing new terms.

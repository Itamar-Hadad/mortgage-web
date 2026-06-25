# SimpleSave — app

React + Vite + TypeScript client. See repo-root `ARCHITECTURE.md`, `CONTEXT.md`,
and `docs/adr/` for the product/architecture decisions this implements.

## Run locally

```
cd app
npm install
cp .env.example .env.local   # fill in Firebase web config from the console
npm run dev
```

## Test

```
npm test
```

## Folder structure

- `src/consumer-flow/` — anonymous/registered consumer flow (Track A)
- `src/personal-area/` — registration + personal area (Track B)
- `src/admin-advisor/` — admin + advisor screens (Track C)
- `src/calc-engine/` — shared mortgage calculation engine (owned by issue #3)
- `src/shared/` — cross-cutting setup (Firebase client, i18next)
- `src/locales/` — i18next dictionaries (`he.json` today, ADR-0004)
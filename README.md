# SDD Navigator Dashboard

A responsive specification traceability dashboard built with Next.js App Router, React, strict TypeScript, and local JSON sample data. It summarizes requirement coverage, linked annotations and tasks, sortable/filterable requirements, requirement details, and orphan records.

## Features

- Mock mode by default; API mode when `NEXT_PUBLIC_API_URL` is configured.
- Summary metrics, status breakdown, scan metadata, and orphan warnings.
- Multi-select requirement filters synchronized to URL query parameters.
- Sorting by requirement ID or last-updated timestamp.
- Requirement detail routes with linked annotations and tasks.
- Task status filter, orphan panels, persistent light/dark theme, responsive table/card layouts.
- Runtime shape validation, unit tests, strict typecheck, lint, production build, and SDD traceability script.

## Requirements

- Node.js 20.9 or newer (recommended for the selected Next.js release).
- npm.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. With an empty `NEXT_PUBLIC_API_URL`, the app uses `data/*.json` sample data.

## API mode

Set `NEXT_PUBLIC_API_URL` to the origin of a compatible SDD Navigator API, for example:

```dotenv
NEXT_PUBLIC_API_URL=https://your-api.example.com
```

Restart the development server after changing environment variables. The API provider expects `GET /stats`, `GET /requirements`, `GET /requirements/{id}`, `GET /annotations`, `GET /tasks`, `POST /scan`, and `GET /scan`.

The official OpenAPI v3 contract is available as `sdd-coverage-api.yaml`. The client normalizes the API v3 statistics and annotation fields into the UI model and validates scan-status responses at runtime. Keep the contract file in the repository so future changes can be checked against the same source of truth.

## Validation

```bash
npm run typecheck
npm run lint
npm test
npm run check:coverage
npm run build
```

## Deployment

Import the repository into Vercel or another Next.js-compatible host. Use `npm run build` as the build command and `npm start` as the start command where applicable. Leave `NEXT_PUBLIC_API_URL` empty to deploy the self-contained mock demo, or set it to the backend origin. Add the live URL here after deployment has actually succeeded.

## SDD traceability

`requirements.yaml` is the dashboard specification. Meaningful implementation and test code includes `@req SCD-UI-NNN` annotations. `scripts/check-coverage.ts` validates requirement metadata, unknown IDs, and source/test annotation presence. This is a traceability check, not proof of behavioral correctness; the test suite and human review remain necessary.

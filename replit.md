# Workspace

## Recent Changes (Session)
- **Sync approval flow**: Sync now stages data in `raw_imports` as `pending` (not inserted directly into main tables). Admin must approve/reject each record. Auto-skips records already in the DB. `status` and `processedAt` columns added to `raw_imports` schema.
- **SyncData page**: Rebuilt with status filter (pending/approved/rejected/skipped), per-row approve/reject buttons, bulk approve/reject with checkbox selection, and live pending-count banner.
- **Duplicates page**: Added "Delete All Extras" bulk action bar that appears when duplicates are found — keeps first record of each group, deletes all others across all entity types, with audit log.
- **Layout**: AVIACBP plane icon now turns orange-600 on hover; clicking the brand logo navigates to `/air`.
- **PAGE_SIZES**: Added 150 to all list pages (Airlines, Airports, AwbPrefixes, GroundHandlers, AuditLogs).
- **Sync route**: Added `POST /api/sync/raw-data/:id/approve`, `POST /api/sync/raw-data/:id/reject`, `POST /api/sync/raw-data/bulk-approve`, `POST /api/sync/raw-data/bulk-reject` endpoints.

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.

## Domain Data

**Airlines**: 131 airlines, `awb_prefix` (3-digit text) maps AWB prefix → airline (e.g. "176" = Emirates/EK). 75 airlines have AWB prefixes set.

**Airports**: 731 airports. 90 US airports have cargo handler data.

**Airline Operations**: 817 records. Columns: `firms_code`, `isc_amount` (range text like "70-140"), `isc_payable_at`, `isc_payable_to` (ground handler), `contact_number`, `contact_email`, `notes`.

**Seed files** in `scripts/`: `seed_airlines.sql`, `seed_airports.sql`, `seed_ground_handlers.sql`, `seed_airline_operations.sql`. Airlines seed includes `UPDATE` to set AWB prefixes after INSERT.

## Key Features

- **AIR Search** (`/air`): Public interface. Tabs: AWB Track, Airlines, Airports, FIRMS Lookup.
- **AWB Track**: `GET /api/awb-search?awb=176-12345678&airport=JFK` — decodes 3-digit prefix to airline, looks up airline_operations at destination airport.
- **Command Center** (`/cmd`, password "332"): Admin CRUD for all entities. Auto-locks after 10 min inactivity.
- **Excel import**: 540 rows from USA cargo handler file imported → 488 new airline_operations records (6 airlines × 90 airports).
- **FIRMS Lookup** (AirPublic tab): Search by FIRMS code across all operations.
- **Duplicate Detection** (`/duplicates`): Admin-only duplicate detection for airline_operations.
- **Database Admin** (`/database`): Table-level view/edit for allowed tables.

## UI Design System (AeroControl)

- **Fonts**: Manrope (all weights) + JetBrains Mono (monospace)
- **Sidebar**: Always deep navy (#0b2147), flat nav items, no accordion, `sidebar-active` / `sidebar-item` CSS classes
- **Background**: Light #f6fafe (default), `aero-card` class for white cards with ambient shadow + hover lift
- **Accents**: `--t-accent: #3b5fad` (medium blue), `--t-accent2: #009d6c` (emerald)
- **Aviation watermarks**: `AviationBg` component uses SVG airplane + control tower silhouettes at very low opacity
- **Buttons**: `btn-primary` class → navy gradient (0b2147 → 000b25)
- **Cards**: `aero-card` class → white bg + `0 12px 40px rgba(11,33,71,0.06)` shadow, lifts on hover
- **Status chips**: `chip-emerald`, `chip-amber`, `chip-blue`, `chip-red` CSS classes
- **Theme**: Light by default. `[data-mode="dark"]` overrides in CSS. ThemeProvider sets attribute on `<html>`.

## AWB Prefix Reference (key carriers)
| Prefix | Airline | IATA |
|--------|---------|------|
| 001 | American Airlines | AA |
| 006 | Delta Air Lines | DL |
| 016 | United Airlines | UA |
| 020 | Lufthansa | LH |
| 057 | Air France | AF |
| 074 | KLM | KL |
| 108 | Atlas Air | 5Y |
| 125 | British Airways | BA |
| 157 | Qatar Airways | QR |
| 176 | Emirates | EK |
| 205 | ANA | NH |
| 235 | Turkish Airlines | TK |
| 618 | Singapore Airlines | SQ |

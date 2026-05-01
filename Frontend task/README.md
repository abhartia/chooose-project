# Chooose Trips — Frontend Assessment

Two-page React app (trips list + trip details) backed by a local mock server seeded from `trips.json`.

## Stack

- **Vite + React 18 + TypeScript** — frontend (`frontend/`)
- **Tailwind CSS + shadcn/ui** (Radix Primitives) — UI
- **React Router v6** — routing
- **TanStack Query v5** — data fetching, caching, infinite scroll
- **Hey-API** (`@hey-api/openapi-ts` + `@tanstack/react-query` plugin) — typed SDK + query options generated from `openapi.yaml`
- **Express + zod** — mock server (`mock-server/`) with cursor-based pagination

The repo is an npm workspace with two packages: `frontend` and `mock-server`.

## Layout

```
Frontend task/
├── trips.json              # seed data (read by mock-server)
├── openapi.yaml            # OpenAPI 3.1 — source of truth for Hey-API
├── frontend/
└── mock-server/
```

## Run

From inside `Frontend task/`:

```bash
npm install         # installs both workspaces
npm run generate    # generates Hey-API client into frontend/src/api/generated
npm run dev         # boots mock server (:4000) + Vite (:5173) concurrently
```

Open <http://localhost:5173>.

## Other scripts

```bash
npm run build       # typecheck + production build of the frontend
npm run lint        # lint frontend
```

## API

The mock server exposes two endpoints. See `openapi.yaml` for the full spec.

### `GET /trips`

Cursor-paginated list. Query params:

| param       | type     | notes                                                     |
|-------------|----------|-----------------------------------------------------------|
| `cursor`    | string?  | opaque token; omit on first request                       |
| `limit`     | int      | 1–50, default 12                                          |
| `sort`      | enum     | `rating`, `-rating`, `days`, `-days`, `co2kilograms`, `-co2kilograms`, `title`, `-title` (default `-rating`) |
| `country`   | string[] | repeatable; OR-filter                                     |
| `minRating` | number   | 0–5                                                       |
| `maxDays`   | int      |                                                           |

Response:

```json
{
  "items": [{ "id": 1, "title": "...", "...": "..." }],
  "pageInfo": { "nextCursor": "...", "hasNextPage": true, "limit": 12 },
  "totalCount": 70
}
```

Cursors are bound to the `sort`+filter combination that minted them; changing those mid-pagination yields `400 INVALID_CURSOR` (restart from the first page).

### `GET /trips/{id}`

Returns the full `Trip` (summary fields + `description`, `advantages[]`) or `404 NOT_FOUND`.

## Regenerating the API client

After editing `openapi.yaml`:

```bash
npm run generate
```

Output lands in `frontend/src/api/generated/` (gitignored).

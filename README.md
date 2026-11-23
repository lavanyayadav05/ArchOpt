# ArchOpt — Architectural Space & Circulation Optimizer

ArchOpt turns an architectural brief (site size, required spaces, adjacency preferences) into ranked,
circulation-aware floor-plan layouts. It is a Next.js web app with a TypeScript optimization engine that
runs entirely in the browser.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4 with design tokens, light and dark themes
- SVG for floor plans and charts
- Optimization engine in `src/lib/engine` (geometry, Dijkstra, constraint checks, simulated annealing)
- Backend: Next.js route handlers in `src/app/api` with a SQLite database (Node.js built-in `node:sqlite`, nothing to compile), stored in `data/archopt.db`
- Accounts use scrypt-hashed passwords and HttpOnly session cookies; layouts also export and import as JSON

## Run it

Requires **Node.js 22.13 or newer** (`node -v`). On Windows no Visual Studio or build tools are needed.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
```

## Backend

| Endpoint | Purpose |
| --- | --- |
| `POST /api/auth/signup`, `/signin`, `/signout`, `GET /api/auth/me` | Accounts and sessions |
| `GET/POST /api/projects`, `PATCH/DELETE /api/projects/:id` | Per-user projects |
| `GET/POST /api/projects/:id/layouts`, `DELETE /api/layouts/:id` | Saved layouts |
| `POST /api/optimize` | Runs the layout engine on the server (inputs are bounded) |

New accounts are seeded with the sample projects, and every query is scoped to the signed-in user.
If the server cannot be reached, the Optimization page runs the same engine in the browser instead.
Set `ARCHOPT_DB_PATH` to move the database file. SQLite needs a persistent disk, so on Vercel you would
replace `src/server/db.ts` with a hosted database such as Postgres; the route handlers stay the same.

## What to try

| Route | What it shows |
| --- | --- |
| `/space-planner` | Set site size, spaces and adjacency weights, then **Generate Layouts** (four ranked candidates, live constraint check, walking routes) |
| `/optimization` | Run the optimizer for a project, choose annealing or constraint search, compare before and after, export JSON |
| `/workspace` | Edit rooms with undo/redo, live validation and **Generate More** variations |
| `/usability` | Personas, Nielsen heuristics, accessibility decisions, test plan and a SUS score calculator |
| `/technology`, `/workflow`, `/features`, `/about` | Architecture, pipeline and scope |

Keyboard: `Ctrl+K` command palette, `?` shortcut list, `G` then `D/P/S/O/L/A` to jump between pages, `/` to search.

## How the engine works

1. Requirements become a list of rectangular rooms with target areas and minimum sizes.
2. Rooms are packed into two bands on either side of a central corridor.
3. Search (randomized constraint search or simulated annealing, seeded for repeatability) changes room order, band depth and corridor width.
4. Each candidate is scored: constraint shortfall, adjacency, excess corridor, walking distance (Dijkstra), unused area.
5. The best candidates are ranked and shown with metrics.

## Limits

Rectangular rooms on a rectangular plot, central-corridor layouts, a single-file SQLite database and no password-reset email. Dashboard,
analytics, team and design-lab screens use example data and are labelled as such.

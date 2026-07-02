# CLAUDE.md

Guidance for working in this repo.

## What this is

**Synthetic Data Lab (SDL)** — a React marketing site + an in-browser CSV **dataset analyzer**.
A user uploads a CSV (or loads a sample), picks a target column, and gets a dashboard of
data-quality, statistics, correlations, class balance, a health score, and ML-readiness
recommendations. **All analysis runs client-side in pure JavaScript — no AI, no server call.**

The Flask backend is a thin, optional proxy to the Gemini API and is *not* wired into the
analyzer path. The `/builder` page and `SyntheticDataSection` (actual synthetic-data
generation) are **commented out / disabled** — the shipped product is the analyzer, despite
the name.

## Stack

- **Frontend:** React 19, Vite 8, React Router 7, Tailwind 4, Framer Motion, GSAP, Recharts, PapaParse (CSV)
- **Backend (optional):** Python Flask proxy to Gemini (`backend/app.py`) — CORS-open, single `/api/gemini` route
- Deployed build lives in `dist/`

## Commands

```bash
npm run dev        # Vite dev server
npm run build      # production build → dist/
npm run preview    # preview built site
npm run lint       # eslint
# backend (rarely needed):
cd backend && pip install -r requirements.txt && python app.py
```

## Architecture

### Routes (`src/App.jsx`)
- `/` → `Home` (marketing landing: hero, problem/solution, story, CTA)
- `/analyze` → `Analyze` (the actual tool)
- `/builder` is commented out; `/home` and `/search` redirect to `/`

### Analyze flow (`src/pages/Analyze.jsx`)
Step machine held in local state: `0 Upload → 1 Target → 2 Processing → 3 Results`.
`?sample=1` skips straight to results with generated demo data.

### Analysis engine (`src/components/utils/core/`) — the heart of the app
`index.js` orchestrates `analyzeDataset(data, columns, target)`, which fans out to:
- `detectors/roles.js` — classify each column: identifier / numeric / binary / categorical (incl. encoded-categorical heuristic)
- `detectors/target.js` — auto-guess the target column
- `analyzers/quality.js` — missing cells, duplicates, quality score
- `analyzers/stats.js` — per-column statistics + histograms/visualizations
- `analyzers/relations.js` — correlation matrix (Pearson), Cramér's V for categoricals, multicollinearity, target-leakage, feature clusters
- `scoring/health.js` — 0–100 health score across quality/structure/relationships/target
- `intelligence/recommendations.js` + `insights.js` — human-readable, prioritized advice
- `helpers.js` — shared numeric utils (mean, pearson, isNumeric, histograms…)

### UI (`src/components/`)
Feature-foldered. `analyze/ResultsDashboard/` renders the tabbed report
(Overview / Quality / Statistics / Visualizations / Relationships / Class Balance);
`hero/`, `home/`, `layout/` are the marketing site. Components favor inline styles +
per-feature CSS files + Framer Motion entrance animations.

## Conventions

- Analysis code is **pure functions, no side effects, no network** — keep it that way; it's the testable core.
- Statistical fixes are annotated inline (`FIX #n`, `FIX Pn`) — read the comment before touching a heuristic.
- Column roles are the single source of truth for how a column is treated downstream.
- The target column is tracked in `meta.target` and excluded from feature lists.

## Gotchas

- Name says "synthetic data" but generation is disabled; product = analyzer.
- Backend is decoupled and optional; don't assume the frontend needs it.
- `backend/api.js` (`fetchData`) is dead/legacy — nothing calls it.
- Flask proxy has CORS wide open and forwards an API key from env — do not expose publicly as-is.
- `.env.local` sets `VITE_BACKEND_URL` but the analyzer path never uses it.

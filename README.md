# Datassert

Know your dataset before you train on it.

Datassert is a browser-based CSV dataset analyzer. Upload a CSV, pick a target column, and
get a full readiness report: data quality, per-column statistics, correlations, class
balance, a 0–100 health score, and prioritized recommendations.

**Every byte of analysis runs in your browser.** No upload, no server, no AI — your data
never leaves your machine.

## Features

- **Data quality** — missing cells, duplicate rows, constant columns, per-column issue list
- **Statistics** — mean, median, sample standard deviation, skewness, excess kurtosis,
  quartiles and outlier counts for every numeric column
- **Column roles** — automatic classification into numeric, categorical, binary,
  identifier, and temporal, with identifier-vs-numeric and date-detection heuristics
- **Relationships** — Pearson correlation matrix, Cramér's V for categorical pairs,
  correlation ratio (η), multicollinearity and target-leakage warnings, feature clusters
- **Class balance** — class distribution for a classification target, including an explicit
  missing-value bucket and minority-class sizing
- **Health score** — a weighted 0–100 score across quality, structure, relationships, and
  target readiness, with a letter grade and per-dimension breakdown
- **Recommendations** — prioritized, human-readable next steps for making the dataset
  ML-ready

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev
```

The dev server prints a local URL. No environment variables and no backend service are
required — the app is fully static.

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built output locally |
| `npm run lint` | Run ESLint over the project |

## Tests

The analysis engine has a dependency-free regression suite that runs on plain Node:

```bash
node tests/phase0.test.mjs
```

Statistical results are asserted against a Python reference (pandas/scipy) rather than
hand-written expectations. `tests/reference/generate_reference.py` produces
`tests/reference/expected.json` from the fixture CSVs in `tests/reference/datasets/`; the
JavaScript implementation is then checked against it to a 1e-6 tolerance. Role detection,
which has no Python equivalent, is asserted against intended-role maps declared in the test
file itself.

Run it after any change under `src/components/utils/core/`.

## Project structure

```text
src/
  App.jsx                     routes: / (landing), /analyze (the tool)
  pages/
    Analyze.jsx               step machine: Upload → Target → Processing → Results
  components/
    analyze/                  uploader, target picker, tabbed results dashboard
    hero/ home/ layout/       marketing site
    utils/core/               the analysis engine (pure functions, no side effects)
      roles.constants.js      ROLE enum — the single source of truth for role strings
      index.js                analyzeDataset() orchestrator
      detectors/              column-role classification, target guessing
      analyzers/              quality, statistics, relationships
      scoring/                health score
      intelligence/           insights and recommendations
      helpers.js              shared numeric utilities
tests/                        analysis-engine regression suite + Python reference
```

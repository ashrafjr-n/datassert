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

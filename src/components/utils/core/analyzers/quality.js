import { isNumeric, getValues, isMissing } from "../helpers.js";

export function getQuality(data, columns, identifierCols = []) {
  let missingCells = 0;
  const columnsWithIssues = [];

  columns.forEach(col => {
    const vals    = data.map(r => r[col]);
    const missing = vals.filter(v => isMissing(v)).length;
    const nonEmpty = vals.filter(v => !isMissing(v));
    const unique  = [...new Set(nonEmpty)];

    missingCells += missing;

    // FIX #3: Check missing and constant independently (not mutually exclusive)
    if (missing > 0) {
      columnsWithIssues.push({
        col,
        issue:  "missing",
        count:  missing,                                       // FIX #3: store raw count
        detail: `${missing} missing value${missing > 1 ? "s" : ""}`,
      });
    }

    // Only check constant/cardinality on non-empty values
    if (nonEmpty.length > 0) {
      if (unique.length === 1) {
        columnsWithIssues.push({
          col,
          issue:  "constant",
          detail: `All non-empty values are identical ("${unique[0]}")`,
        });
      // FIX: compare against nonEmpty.length so missing rows don't mask full uniqueness
      // FIX: use ratio > 0.95 instead of === to catch near-unique columns
      } else if (
        !identifierCols.includes(col) &&
        (unique.length / nonEmpty.length) > 0.95 &&
        nonEmpty.length > 10
      ) {
        columnsWithIssues.push({
          col,
          issue:  "high_cardinality",
          detail: "High uniqueness — likely an ID column",
        });
      }
    }
  });

  // FIX P6: skip duplicate detection for large datasets (expensive O(n × cols log cols))
  let duplicateRows = 0;
  if (data.length <= 50000) {
    const serialized = data.map(r => JSON.stringify(r, Object.keys(r).sort()));
    duplicateRows    = serialized.length - new Set(serialized).size;
  }
  const missingPct    = (missingCells / (data.length * columns.length)) * 100;

  // Score breakdown
  const penalties = [];

  const missingPenalty = Math.round(missingPct * 2);
  if (missingPenalty > 0) {
    penalties.push({
      label:   "Missing values",
      detail:  `${missingPct.toFixed(1)}% of cells are empty`,
      penalty: missingPenalty,
    });
  }

  const dupPenalty = Math.round((duplicateRows / data.length) * 50);
  if (dupPenalty > 0) {
    penalties.push({
      label:   "Duplicate rows",
      detail:  `${duplicateRows} duplicate row${duplicateRows > 1 ? "s" : ""} found`,
      penalty: dupPenalty,
    });
  }

  const issuePenalty = columnsWithIssues.length * 3;
  if (issuePenalty > 0) {
    penalties.push({
      label:   "Column issues",
      detail:  `${columnsWithIssues.length} column${columnsWithIssues.length > 1 ? "s" : ""} with structural issues`,
      penalty: issuePenalty,
    });
  }

  const score = Math.max(0, Math.round(100 - penalties.reduce((s, p) => s + p.penalty, 0)));

  return {
    missingCells,
    missingPct:     Math.round(missingPct * 10) / 10,
    duplicateRows,
    columnsWithIssues,
    qualityScore:   score,
    scorePenalties: penalties,
    scoreBase:      100,
  };
}


/* ══════════════════════════════════════════
   HISTOGRAM HELPER — single source of truth
   FIX P7: extracted to avoid duplication
══════════════════════════════════════════ */
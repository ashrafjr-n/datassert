import { isIdentifierCol, isNumeric, isMissing } from "../helpers.js";
import { isTemporalColumn } from "./temporal.js";
import { ROLE } from "../roles.constants.js";

export function detectColumnRoles(data, columns, target) {
  const roles = {};
  columns.forEach(col => {
    // Never short-circuit for target — we need its real role
    if (isIdentifierCol(data, col) && col !== target) {
      roles[col] = ROLE.IDENTIFIER;
      return;
    }

    // FIX (Group B): key role detection on non-missing values only — exclude
    // NA/?/null/None/NaN/whitespace so missing tokens don't inflate cardinality
    // or dilute the numeric ratio. Scoped to role detection (not getValues).
    const sample = data.slice(0, 100)
      .map(r => r[col])
      .filter(v => !isMissing(v));

    if (sample.length === 0) {
      roles[col] = ROLE.CATEGORICAL;
      return;
    }

    // Cascade position 2: temporal — BEFORE numeric/categorical so date strings get
    // ROLE.TEMPORAL instead of being swept into high-cardinality categorical (or a
    // numeric-parseable date into numeric). Precision-gated: ≥90% valid dates of one
    // family. Bare years/epoch have no date structure → fall through to numeric.
    if (isTemporalColumn(sample)) {
      roles[col] = ROLE.TEMPORAL;
      return;
    }

    const numericCount = sample.filter(v => isNumeric(v)).length;
    if (numericCount / sample.length >= 0.8) {
      // FIX P3: detect encoded categoricals — integers with very low cardinality
      // e.g. country_code (1,2,3,4,5) = categorical
      // but SibSp (0-8 counts), Parch (0-6 counts) = numeric count features
      // Tighter threshold: uniqueCount <= 8 AND ratio < 0.05 (very sparse relative to dataset)
      const numSample  = sample.filter(v => isNumeric(v)).map(v => parseFloat(v));
      const uniqueNum  = new Set(numSample).size;
      const allInts    = numSample.every(v => Number.isInteger(v));
      // Only flag as encoded categorical if VERY low unique count (≤ 8)
      // relative to sample — avoids misclassifying count features like SibSp/Parch
      const isEncoded  = allInts
        && uniqueNum <= 8
        && uniqueNum / numSample.length < 0.05;

      roles[col] = isEncoded ? ROLE.CATEGORICAL : ROLE.NUMERIC;
      return;
    }

    const unique = new Set(sample.map(v => String(v).toLowerCase().trim())).size;
    roles[col] = unique === 2 ? ROLE.BINARY : ROLE.CATEGORICAL;
  });
  return roles;
}
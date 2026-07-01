import { isIdentifierCol, isNumeric } from "../helpers.js";

export function detectColumnRoles(data, columns, target) {
  const roles = {};
  columns.forEach(col => {
    // Never short-circuit for target — we need its real role
    if (isIdentifierCol(data, col) && col !== target) {
      roles[col] = "identifier";
      return;
    }

    const sample = data.slice(0, 100)
      .map(r => r[col])
      .filter(v => v !== "" && v != null);

    if (sample.length === 0) {
      roles[col] = "categorical";
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

      roles[col] = isEncoded ? "categorical" : "numeric";
      return;
    }

    const unique = new Set(sample.map(v => String(v).toLowerCase().trim())).size;
    roles[col] = unique === 2 ? "binary" : "categorical";
  });
  return roles;
}
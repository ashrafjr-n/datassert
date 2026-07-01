import {
  getValues, getNumericValues,
  mean, pearson, isNumeric,
} from "../helpers.js";

export function getRelationshipsV3(data, numericCols, target) {

  /* ── Select top-8 by variance (same as legacy) ── */
  const cols = numericCols
    .map(col => {
      const vals = getNumericValues(data, col);
      if (vals.length < 2) return { col, variance: 0 };
      const m        = mean(vals);
      const variance = mean(vals.map(v => (v - m) ** 2));
      return { col, variance };
    })
    .sort((a, b) => b.variance - a.variance)
    .slice(0, 8)
    .map(c => c.col);

  /* ── Build full correlation matrix ── */
  const matrix             = {};
  const strongRelationships = [];

  // FIX #3: Track target correlations across BOTH numeric and categorical columns.
  // - Numeric target   → Pearson for numeric cols, Point-Biserial approx for binary
  // - Binary target    → Point-Biserial for numeric cols (r = Pearson on 0/1 encoding)
  // - Categorical cols → Cramér's V (chi-square based, range 0-1)
  const targetCorrelations = {};

  if (target) {
    // Determine target type — guard against empty target column
    const targetVals = getValues(data, target);
    if (!targetVals.length) {
      // No target data — return empty correlation structure
      return { cols: [], correlationMatrix: {}, strongRelationships: [],
               multicollinearPairs: [], clusterDetected: false, clusterCols: [],
               leakageSuspects: [], targetCorrelations: {}, observations: [] };
    }

    const targetUnique  = [...new Set(targetVals.map(v => String(v).toLowerCase().trim()))];
    const targetNumeric = targetVals.filter(v => isNumeric(v));
    const isNumericTarget     = targetVals.length > 0 && targetNumeric.length / targetVals.length > 0.8;
    const isBinaryTarget      = targetUnique.length === 2;
    const isCategoricalTarget = !isNumericTarget && targetUnique.length > 2;

    // ── Use all columns for target correlation ──
    // FIX: removed dead targetEncoded block (keyed by object → "[object Object]" bug)
    const allCols = Object.keys(data[0] || {});
    allCols.forEach(col => {
      if (col === target) return;

      const colVals = getValues(data, col);
      const colUnique = [...new Set(colVals.map(v => String(v).toLowerCase().trim()))];
      const colNumericVals = colVals.filter(v => isNumeric(v));
      const colIsNumeric = colNumericVals.length / colVals.length > 0.8;
      const colIsBinary  = colUnique.length === 2;
      const colIsCategorical = !colIsNumeric && !colIsBinary && colUnique.length > 1;

      if ((colIsNumeric || colIsBinary) && (isNumericTarget || isBinaryTarget)) {
        // Pearson / Point-Biserial: encode col as numbers
        let colMap = null;
        if (colIsBinary && !colIsNumeric) {
          colMap = { [colUnique[0]]: 0, [colUnique[1]]: 1 };
        }

        const pairs = [];
        data.forEach(row => {
          let a = colIsNumeric ? parseFloat(row[col]) : (colMap ? colMap[String(row[col]).toLowerCase().trim()] : null);
          const bRaw = row[target];
          let b = isNumericTarget
            ? parseFloat(bRaw)
            : (isBinaryTarget ? (targetUnique.indexOf(String(bRaw).toLowerCase().trim()) >= 0 ? targetUnique.indexOf(String(bRaw).toLowerCase().trim()) : null) : null);

          if (a == null || b == null || isNaN(a) || isNaN(b)) return;
          pairs.push([a, b]);
        });

        if (pairs.length >= 3) {
          const mx = mean(pairs.map(p => p[0]));
          const my = mean(pairs.map(p => p[1]));
          let num = 0, dx2 = 0, dy2 = 0;
          for (const [a, b] of pairs) {
            const dx = a - mx; const dy = b - my;
            num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
          }
          const denom = Math.sqrt(dx2 * dy2);
          const r = denom === 0 ? 0 : Math.round((num / denom) * 100) / 100;
          // FIX #4: store metric type alongside value
          targetCorrelations[col] = { metric: "pearson", value: r, absValue: Math.abs(r) };
        }

      } else if (colIsCategorical) {
        // Cramér's V between categorical col and target
        // Range 0-1, higher = stronger association
        const n = data.length;
        const freqTable = {};
        const rowMarg   = {};
        const colMarg   = {};

        data.forEach(row => {
          const rVal = String(row[col] ?? "").trim();
          const cVal = String(row[target] ?? "").trim();
          if (!rVal || !cVal) return;
          const key = `${rVal}|||${cVal}`;
          freqTable[key]  = (freqTable[key]  || 0) + 1;
          rowMarg[rVal]   = (rowMarg[rVal]   || 0) + 1;
          colMarg[cVal]   = (colMarg[cVal]   || 0) + 1;
        });

        const totalN = Object.values(freqTable).reduce((s, v) => s + v, 0);
        if (totalN < 5) return;

        let chi2 = 0;
        Object.entries(freqTable).forEach(([key, obs]) => {
          const [rVal, cVal] = key.split("|||");
          const expected = (rowMarg[rVal] * colMarg[cVal]) / totalN;
          if (expected > 0) chi2 += ((obs - expected) ** 2) / expected;
        });

        const rCats = Object.keys(rowMarg).length;
        const cCats = Object.keys(colMarg).length;
        const minDim = Math.min(rCats - 1, cCats - 1);
        if (minDim <= 0) return;

        const cramersV = Math.sqrt(chi2 / (totalN * minDim));
        // FIX #4: store metric type — Cramér's V is not comparable to Pearson
        targetCorrelations[col] = {
          metric:   "cramers_v",
          value:    Math.round(cramersV * 100) / 100,
          absValue: Math.round(cramersV * 100) / 100,
        };
      }
    });
  }

  for (let i = 0; i < cols.length; i++) {
    for (let j = i; j < cols.length; j++) {
      const a   = cols[i];
      const b   = cols[j];
      const key = `${a}||${b}`;

      if (i === j) { matrix[key] = 1; continue; }

      // Count usable pairs for confidence
      const pairs = [];
      data.forEach(row => {
        const va = parseFloat(row[a]);
        const vb = parseFloat(row[b]);
        if (!isNaN(va) && !isNaN(vb)) pairs.push([va, vb]);
      });

      const n = pairs.length;
      const r = pearson(data, a, b);
      matrix[key]            = r;
      matrix[`${b}||${a}`]  = r;

      const abs = Math.abs(r);
      if (abs > 0.4) {
        // Strength label
        const strength =
          abs >= 0.9 ? "very strong" :
          abs >= 0.7 ? "strong"      :
          abs >= 0.5 ? "moderate"    : "weak";

        // Confidence based on n pairs
        const confidence =
          n > 100  ? "reliable"  :
          n >= 30  ? "moderate"  : "unreliable";

        // Interpretive statement
        const direction = r > 0 ? "positive" : "negative";
        const trend     = r > 0
          ? `As "${a}" increases, "${b}" tends to increase.`
          : `As "${a}" increases, "${b}" tends to decrease.`;

        strongRelationships.push({
          col1:        a,
          col2:        b,
          correlation: r,
          strength,
          direction,
          confidence,
          nPairs:      n,
          statement:   trend,
        });
      }
    }
  }

  strongRelationships.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  /* ── Multicollinearity detection (|r| > 0.9) ── */
  const multicollinearPairs = strongRelationships
    .filter(r => Math.abs(r.correlation) >= 0.9)
    .map(r => ({
      col1:        r.col1,
      col2:        r.col2,
      correlation: r.correlation,
      warning:     `"${r.col1}" and "${r.col2}" are nearly identical (r = ${r.correlation.toFixed(2)}). Consider dropping one.`,
    }));

  /* ── Feature cluster detection ── */
  // For each col, count how many others have |r| > 0.7
  const clusterMap = {};
  cols.forEach(col => {
    clusterMap[col] = cols.filter(other => {
      if (other === col) return false;
      const key = `${col}||${other}`;
      const rev = `${other}||${col}`;
      const r   = matrix[key] ?? matrix[rev] ?? 0;
      return Math.abs(r) >= 0.7;
    });
  });

  // A cluster = 3+ columns mutually correlated
  const clusterCols = cols.filter(c => clusterMap[c].length >= 2);
  const clusterDetected = clusterCols.length >= 3;
  const clusterObservation = clusterDetected
    ? `Feature cluster detected: ${clusterCols.join(", ")} are heavily intercorrelated. Consider dimensionality reduction within this group.`
    : null;

  /* ── Target leakage detection ── */
  const leakageSuspects = Object.entries(targetCorrelations)
    .filter(([, entry]) => {
      const abs = entry?.absValue ?? 0;
      // Only flag Pearson — Cramér's V near 1.0 is less reliable for leakage
      return entry?.metric === "pearson" && abs > 0.95;
    })
    .map(([col, entry]) => ({
      col,
      correlation: entry.value,
      warning: `"${col}" has near-perfect correlation with target (r = ${entry.value.toFixed(2)}). Possible target leakage — verify this column is not derived from the target.`,
    }));

  /* ── Dataset-level observations ── */
  const observations = [];

  if (multicollinearPairs.length > 0) {
    observations.push(`${multicollinearPairs.length} pair${multicollinearPairs.length > 1 ? "s" : ""} show near-perfect correlation — multicollinearity risk.`);
  }

  if (leakageSuspects.length > 0) {
    observations.push(`${leakageSuspects.length} feature${leakageSuspects.length > 1 ? "s" : ""} may contain target information — check for data leakage.`);
  }

  // FIX P1: read absValue directly, never Math.abs(entry object)
  const maxTargetR = Object.values(targetCorrelations).reduce((m, entry) => Math.max(m, entry.absValue ?? 0), 0);
  if (target && Object.keys(targetCorrelations).length > 0) {
    if (maxTargetR < 0.1) {
      observations.push(`No feature shows meaningful association with target (max = ${maxTargetR.toFixed(2)}). Consider feature engineering or non-linear models.`);
    } else if (maxTargetR >= 0.1 && maxTargetR < 0.3) {
      // Find the strongest feature
      const strongestCol = Object.entries(targetCorrelations)
        .reduce((best, [col, entry]) => (entry?.absValue ?? 0) > (best[1]?.absValue ?? 0) ? [col, entry] : best, ["", { absValue: 0 }]);
      const scVal = strongestCol[1]?.absValue ?? 0; observations.push(`Weak feature-target associations detected. Strongest: "${strongestCol[0]}" (${scVal.toFixed(2)}). Consider feature engineering.`);
    }
  }

  if (clusterObservation) observations.push(clusterObservation);

  return {
    cols,
    correlationMatrix:    matrix,
    strongRelationships,
    multicollinearPairs,
    clusterDetected,
    clusterCols,
    leakageSuspects,
    targetCorrelations,
    observations,
  };
}
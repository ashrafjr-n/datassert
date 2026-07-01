export function getPriorityInsights({ meta, quality, statistics, relationships, classBalance, recommendations }) {
  const insights = [];

  const push = (severity, title, text, score) => {
    insights.push({ severity, title, text, priorityScore: score });
  };

  /* ── CRITICAL ── */

  // Target leakage
  relationships.leakageSuspects.forEach(leak => {
    push("critical",
      "Possible Target Leakage",
      `"${leak.col}" has near-perfect correlation with the target (r = ${leak.correlation.toFixed(2)}). This column may cause data leakage.`,
      100
    );
  });

  // Massive missing on a column (> 50%)
  quality.columnsWithIssues
    .filter(c => c.issue === "missing")
    .forEach(c => {
      const rawP2 = ((c.count ?? parseInt(c.detail)) / meta.rows) * 100;
      const pct   = rawP2 < 1 && rawP2 > 0
        ? Math.max(0.1, Math.round(rawP2 * 10) / 10)
        : Math.round(rawP2);
      if (pct > 50) {
        push("critical",
          `Critical Missing Values in "${c.col}"`,
          `${pct}% of values in "${c.col}" are missing. This column may not be usable.`,
          98
        );
      }
    });

  // Severe class imbalance
  if (classBalance?.isImbalanced) {
    const majority = classBalance.classes.filter(c => !c.missing)[0];
    const majPct   = majority?.pct ?? 0;
    if (majPct > 90) {
      push("critical",
        "Severe Class Imbalance",
        `Target class "${majority.value}" dominates at ${majPct}%. Model will likely predict only the majority class.`,
        95
      );
    }
  }

  /* ── WARNING ── */

  // Duplicate rows
  if (quality.duplicateRows > 0) {
    push("warning",
      "Duplicate Rows Detected",
      `${quality.duplicateRows} duplicate row${quality.duplicateRows > 1 ? "s" : ""} found. Remove before training to avoid biased evaluation.`,
      80
    );
  }

  // Significant missing values (5-50%)
  quality.columnsWithIssues
    .filter(c => c.issue === "missing")
    .forEach(c => {
      const pct = Math.round((c.count ?? parseInt(c.detail) / meta.rows) * 100);
      if (pct > 5 && pct <= 50) {
        push("warning",
          `Missing Values in "${c.col}"`,
          `${pct}% of values in "${c.col}" are missing — imputation recommended.`,
          70 + pct * 0.3
        );
      }
    });

  // Multicollinearity
  if (relationships.multicollinearPairs.length > 0) {
    const pairs = relationships.multicollinearPairs.slice(0, 2)
      .map(p => `"${p.col1}" ↔ "${p.col2}"`)
      .join(", ");
    push("warning",
      "Multicollinearity Detected",
      `${relationships.multicollinearPairs.length} pair${relationships.multicollinearPairs.length > 1 ? "s" : ""} of nearly identical features: ${pairs}. Consider dropping one from each pair.`,
      75
    );
  }

  // Moderate class imbalance
  if (classBalance?.isImbalanced) {
    const majority = classBalance.classes.filter(c => !c.missing)[0];
    const majPct   = majority?.pct ?? 0;
    if (majPct <= 90) {
      push("warning",
        "Class Imbalance",
        `Target class "${majority.value}" represents ${majPct}% of data. Consider class-weighted training.`,
        72
      );
    }
  }

  // Outliers in features
  const colsWithOutliers = statistics
    .filter(s => !s.empty && s.outlierCount > 0)
    .sort((a, b) => b.outlierCount - a.outlierCount)
    .slice(0, 2);

  if (colsWithOutliers.length > 0) {
    const desc = colsWithOutliers
      .map(s => `"${s.col}" (${s.outlierCount})`)
      .join(", ");
    push("warning",
      "Outliers Detected",
      `Outliers found in ${desc}. Review whether these are valid extreme values or data errors.`,
      65
    );
  }

  // High cardinality
  const hiCard = quality.columnsWithIssues.filter(c => c.issue === "high_cardinality");
  if (hiCard.length > 0) {
    push("warning",
      "High Cardinality Columns",
      `${hiCard.map(c => `"${c.col}"`).join(", ")} ${hiCard.length > 1 ? "have" : "has"} very high uniqueness. Encoding may create sparse features.`,
      62
    );
  }

  // Constant columns
  const constCols = quality.columnsWithIssues.filter(c => c.issue === "constant");
  if (constCols.length > 0) {
    push("warning",
      "Constant Columns",
      `${constCols.map(c => `"${c.col}"`).join(", ")} ${constCols.length > 1 ? "have" : "has"} zero variance and should be removed.`,
      68
    );
  }

  /* ── INFO ── */

  // Strong correlations between features (non-critical)
  const strongNonMC = relationships.strongRelationships
    .filter(r => Math.abs(r.correlation) >= 0.7 && Math.abs(r.correlation) < 0.9)
    .slice(0, 2);

  if (strongNonMC.length > 0) {
    const top = strongNonMC[0];
    push("info",
      "Strong Feature Correlations",
      `${top.statement} (r = ${top.correlation.toFixed(2)}, ${top.confidence} estimate).`,
      50
    );
  }

  // Cluster detected
  if (relationships.clusterDetected) {
    push("info",
      "Feature Cluster Detected",
      relationships.observations.find(o => o.includes("cluster")) || "Multiple features are heavily intercorrelated.",
      48
    );
  }

  // Feature-target signal insight
  const noSignalObs  = relationships.observations.find(o => o.includes("No feature shows") || o.includes("no feature shows"));
  const weakSignalObs = relationships.observations.find(o => o.includes("Weak feature-target"));

  if (noSignalObs) {
    push("warning",
      "No Feature-Target Signal Detected",
      noSignalObs,
      60
    );
  } else if (weakSignalObs) {
    push("info",
      "Weak Feature-Target Signal",
      weakSignalObs,
      45
    );
  } else if (meta.target && Object.keys(relationships.targetCorrelations).length > 0) {
    // Positive signal — find top feature
    const topEntry = Object.entries(relationships.targetCorrelations)
      .sort((a, b) => (b[1]?.absValue ?? 0) - (a[1]?.absValue ?? 0))[0];
    if (topEntry && (topEntry[1]?.absValue ?? 0) >= 0.3) {
      push("info",
        "Feature-Target Association Found",
        `Strongest predictor: "${topEntry[0]}" (${topEntry[1]?.metric === "cramers_v" ? "Cramér's V" : "r"} = ${(topEntry[1]?.absValue ?? 0).toFixed(2)}).`,
        42
      );
    }
  }

  /* ── SUCCESS ── */

  // Clean dataset
  if (quality.missingCells === 0 && quality.duplicateRows === 0) {
    push("success",
      "Dataset is Clean",
      "No missing values or duplicate rows detected.",
      40
    );
  }

  // Balanced classes
  if (classBalance && !classBalance.isImbalanced) {
    const majority = classBalance.classes.filter(c => !c.missing)[0];
    push("success",
      "Classes are Balanced",
      `Target classes are well-distributed — majority class at ${majority?.pct ?? "?"}%.`,
      38
    );
  }

  // No multicollinearity
  if (relationships.multicollinearPairs.length === 0 && relationships.cols.length >= 2) {
    push("success",
      "No Multicollinearity",
      "No near-perfect correlations between features — low multicollinearity.",
      35
    );
  }

  // Sort by priorityScore descending
  insights.sort((a, b) => b.priorityScore - a.priorityScore);

  return insights.slice(0, 8);
}
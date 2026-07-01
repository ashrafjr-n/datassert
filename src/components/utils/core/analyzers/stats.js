import {
  getNumericValues, getValues,
  mean, median, stdDev, quantile,
  buildHistogram,
} from "../helpers.js";

export function getStatistics(data, numericCols) {
  return numericCols.map(col => {
    const vals = getNumericValues(data, col);
    if (!vals.length) return { col, empty: true };

    const sorted = [...vals].sort((a, b) => a - b);
    const q1     = quantile(vals, 0.25);
    const q3     = quantile(vals, 0.75);
    const iqr    = q3 - q1;
    const m      = mean(vals);
    const med    = median(vals);
    const std    = stdDev(vals);

    const skewness = std === 0 ? 0 : Math.round(((m - med) / std) * 3 * 100) / 100;
    const skewnessLabel =
      skewness >  0.5 ? "right-skewed" :
      skewness < -0.5 ? "left-skewed"  : "approximately symmetric";

    const lowerFence  = q1 - 1.5 * iqr;
    const upperFence  = q3 + 1.5 * iqr;

    // FIX #4: Skip IQR outlier detection for discrete/count features.
    // When unique values ≤ 10, IQR classifies a huge fraction as "outliers"
    // because the distribution is heavily concentrated at a few integers.
    const uniqueVals  = [...new Set(vals)];
    const isDiscrete  = uniqueVals.length <= 10;
    const outliers    = isDiscrete
      ? []
      : vals.filter(v => v < lowerFence || v > upperFence);

    const min     = sorted[0];
    const max     = sorted[sorted.length - 1];

    // FIX P7: use shared buildHistogram helper
    const bins = buildHistogram(vals);

    return {
      col,
      mean:         Math.round(m * 100) / 100,
      median:       Math.round(med * 100) / 100,
      min:          Math.round(min * 100) / 100,
      max:          Math.round(max * 100) / 100,
      std:          Math.round(std * 100) / 100,
      q1:           Math.round(q1 * 100) / 100,
      q3:           Math.round(q3 * 100) / 100,
      iqr:          Math.round(iqr * 100) / 100,
      skewness,
      skewnessLabel,
      outlierCount: outliers.length,
      lowerFence:   Math.round(lowerFence * 100) / 100,
      upperFence:   Math.round(upperFence * 100) / 100,
      count:        vals.length,
      histogram:    bins,
      isConstant:   min === max,
    };
  });
}

/* ══════════════════════════════════════════
   VISUALIZATIONS
   FIX #5: Same constant column guard
══════════════════════════════════════════ */
export function getVisualizations(data, columns, numericCols, categoricalCols) {
  const result = [];

  numericCols.forEach(col => {
    const vals = getNumericValues(data, col);
    if (!vals.length) return;

    const min = Math.min(...vals);
    const max = Math.max(...vals);

    // FIX P7: use shared buildHistogram helper
    const bins = buildHistogram(vals);

    const q1         = quantile(vals, 0.25);
    const q3         = quantile(vals, 0.75);
    const iqr        = q3 - q1;
    const med        = median(vals);
    const lowerFence  = q1 - 1.5 * iqr;
    const upperFence  = q3 + 1.5 * iqr;
    // FIX #4: same discrete guard as getStatistics
    const uniqueVals2 = [...new Set(vals)];
    const isDiscrete2 = uniqueVals2.length <= 10;
    const outliers    = isDiscrete2
      ? []
      : vals.filter(v => v < lowerFence || v > upperFence);
    const m          = mean(vals);
    const skewness   = (m - med) / (stdDev(vals) || 1) * 3;

    const skewLabel =
      min === max                ? "constant — all values are identical" :
      skewness >  0.5            ? "right-skewed (tail toward higher values)" :
      skewness < -0.5            ? "left-skewed (tail toward lower values)" :
                                   "approximately symmetric";

    result.push({
      col,
      type:      "numeric",
      histogram: bins,
      isConstant: min === max,
      boxplot: {
        min:          Math.round(min * 100) / 100,
        max:          Math.round(max * 100) / 100,
        q1:           Math.round(q1 * 100) / 100,
        q3:           Math.round(q3 * 100) / 100,
        median:       Math.round(med * 100) / 100,
        lowerFence:   Math.round(lowerFence * 100) / 100,
        upperFence:   Math.round(upperFence * 100) / 100,
        outlierCount: outliers.length,
      },
      insight: `Distribution is ${skewLabel}.${outliers.length > 0 ? ` ${outliers.length} outlier${outliers.length > 1 ? "s" : ""} detected.` : " No outliers detected."}`,
    });
  });

  categoricalCols.forEach(col => {
    const freq = {};
    data.forEach(r => {
      const v = r[col];
      if (v !== "" && v != null) freq[String(v)] = (freq[String(v)] || 0) + 1;
    });

    const total       = Object.values(freq).reduce((a, b) => a + b, 0);
    const uniqueCount = Object.keys(freq).length;
    const sorted      = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([value, count]) => ({
        value,
        count,
        pct: Math.round((count / total) * 1000) / 10,
      }));

    const topValue = sorted[0];
    const insight  = topValue
      ? `"${topValue.value}" is the most frequent value at ${topValue.pct}%. ${uniqueCount} unique categories total.`
      : "No data available.";

    result.push({ col, type: "categorical", data: sorted, insight });
  });

  return result;
}
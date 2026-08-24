/* Correlation is polarity (-1..+1 around a neutral 0) — a diverging color job per
   the dataviz skill: two hues + a neutral midpoint, equal steps per arm. Negative
   = info blue, positive = gold (a data-encoding use of gold, distinct from its
   sparse-UI-accent role elsewhere — see frontend.md "Correlation heatmap"). */
const NEGATIVE = ["#EAF2FA", "#BFDAF0", "#6FA8D8", "#2563A6", "#1B4C81"];
const POSITIVE = ["#FBF6E6", "#F0DDA0", "#D9B450", "#C7A233", "#7A5C15"];
const NEUTRAL  = "#F6F6F4"; // paper-sunken — true near-zero reads as neither side

/* Text color per band, verified >=4.5:1 (WCAG AA normal text) via the dataviz
   skill's contrast() checker for every fill above — NOT a single abs-value
   cutoff, because the two arms don't cross to white at the same band: gold's
   4th step (#C7A233) still passes 7.72:1 in ink, while blue's 4th step
   (#2563A6) needs white (6.15:1; ink there is only 3.05:1). */
const NEGATIVE_TEXT = ["#111214", "#111214", "#111214", "#FFFFFF", "#FFFFFF"];
const POSITIVE_TEXT = ["#111214", "#111214", "#111214", "#111214", "#FFFFFF"];

function band(abs) {
  return abs < 0.2 ? 0 : abs < 0.4 ? 1 : abs < 0.6 ? 2 : abs < 0.8 ? 3 : 4;
}

export function correlationFill(r) {
  const abs = Math.abs(r);
  if (abs < 0.05) return NEUTRAL;
  return (r > 0 ? POSITIVE : NEGATIVE)[band(abs)];
}

export function correlationText(r) {
  const abs = Math.abs(r);
  if (abs < 0.05) return "#111214";
  return (r > 0 ? POSITIVE_TEXT : NEGATIVE_TEXT)[band(abs)];
}

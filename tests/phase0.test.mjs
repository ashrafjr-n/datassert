/* phase0.test.mjs — plain Node, no framework.
   Verifies stdDev (sample, ddof=1) against the Python reference harness. */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { stdDev, mean, skewness, kurtosis } from "../src/components/utils/core/helpers.js";
import { getQuality } from "../src/components/utils/core/analyzers/quality.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOL = 1e-6;

const expected = JSON.parse(
  readFileSync(join(__dirname, "reference", "expected.json"), "utf8"),
);

/* tiny CSV parser — fine for the clean fixtures (no quoting/escaping) */
function parseCsv(path) {
  const lines = readFileSync(path, "utf8").trim().split(/\r?\n/);
  const header = lines[0].split(",");
  const rows = lines.slice(1).map(line => {
    const cells = line.split(",");
    const obj = {};
    header.forEach((h, i) => { obj[h] = cells[i]; });
    return obj;
  });
  return { header, rows };
}

const { header, rows } = parseCsv(
  join(__dirname, "reference", "datasets", "clean_numeric.csv"),
);

let failures = 0;
console.log("Fix #1 — sample stdDev (ddof=1) vs reference harness\n");

for (const col of header) {
  const vals = rows.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
  const actual = stdDev(vals);
  const want = expected.clean_numeric.columns[col].std;
  const diff = Math.abs(actual - want);
  const pass = diff <= TOL;
  if (!pass) failures++;
  console.log(
    `${pass ? "PASS" : "FAIL"}  ${col.padEnd(6)} ` +
    `actual=${actual.toFixed(12)}  expected=${want.toFixed(12)}  |diff|=${diff.toExponential(3)}`,
  );
}

/* ── Fix #2 — moment skewness + excess kurtosis vs reference harness ── */
const sk = parseCsv(
  join(__dirname, "reference", "datasets", "skew_kurt.csv"),
);

console.log("\nFix #2 — moment skewness (bias=False) + excess kurtosis vs reference harness\n");

const metrics = [
  { name: "skewness", fn: skewness, key: "skewness" },
  { name: "kurtosis", fn: kurtosis, key: "kurtosis" },
];

for (const col of sk.header) {
  const vals = sk.rows.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
  for (const { name, fn, key } of metrics) {
    const actual = fn(vals);
    const want = expected.skew_kurt.columns[col][key];
    const diff = Math.abs(actual - want);
    const pass = diff <= TOL;
    if (!pass) failures++;
    console.log(
      `${pass ? "PASS" : "FAIL"}  ${col.padEnd(12)} ${name.padEnd(8)} ` +
      `actual=${actual.toFixed(12)}  expected=${want.toFixed(12)}  |diff|=${diff.toExponential(3)}`,
    );
  }
}

/* ── Fix #3 — broadened missing-value detection via getQuality ── */
const mv = parseCsv(
  join(__dirname, "reference", "datasets", "missing_variants.csv"),
);
const quality = getQuality(mv.rows, mv.header);
// per-column missing count from columnsWithIssues (issue === "missing")
const missingByCol = Object.fromEntries(mv.header.map(c => [c, 0]));
for (const issue of quality.columnsWithIssues) {
  if (issue.issue === "missing") missingByCol[issue.col] = issue.count;
}

console.log("\nFix #3 — missing-value counts (getQuality) vs reference harness\n");

for (const col of mv.header) {
  const actual = missingByCol[col];
  const want = expected.missing_variants.missing_counts[col];
  const pass = actual === want;            // integer equality
  if (!pass) failures++;
  console.log(`${pass ? "PASS" : "FAIL"}  ${col.padEnd(6)} actual=${actual}  expected=${want}`);
}

console.log(`\n${failures === 0 ? "ALL PASS" : failures + " FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);

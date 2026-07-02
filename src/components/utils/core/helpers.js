/* ─────────────────────────────────────────────
   Datassert HELPERS — shared pure utilities
   No imports. Used by all other modules.
───────────────────────────────────────────── */

export function isNumeric(val) {
  if (val === null || val === undefined || val === "") return false;
  return !isNaN(parseFloat(val)) && isFinite(val);
}

export function getValues(data, col) {
  return data.map(r => r[col]).filter(v => v !== "" && v != null);
}

export function getNumericValues(data, col) {
  return getValues(data, col).map(v => parseFloat(v)).filter(v => !isNaN(v));
}

export function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid    = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function stdDev(arr) {
  if (arr.length < 2) return 0;
  const m  = mean(arr);
  const sq = arr.map(v => (v - m) ** 2);
  return Math.sqrt(mean(sq));
}

export function quantile(arr, q) {
  const sorted = [...arr].sort((a, b) => a - b);
  const pos    = (sorted.length - 1) * q;
  const base   = Math.floor(pos);
  const rest   = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

/* ── FIX #1: Pearson uses paired rows to handle missing values correctly ── */
export function pearson(data, colA, colB) {
  const pairs = [];
  data.forEach(row => {
    const a = parseFloat(row[colA]);
    const b = parseFloat(row[colB]);
    if (!isNaN(a) && !isNaN(b)) pairs.push([a, b]);
  });

  const n = pairs.length;
  if (n < 3) return 0;

  const mx = mean(pairs.map(p => p[0]));
  const my = mean(pairs.map(p => p[1]));

  let num = 0, dx2 = 0, dy2 = 0;
  for (const [a, b] of pairs) {
    const dx = a - mx;
    const dy = b - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }

  const denom = Math.sqrt(dx2 * dy2);
  return denom === 0 ? 0 : Math.round((num / denom) * 100) / 100;
}

/* ── FIX #8: isIdentifierCol — guard against year-like sequential features ── */
export function isIdentifierCol(data, col) {
  const nameLower = col.toLowerCase();

  // Name heuristic — must contain id/uuid/key/index at a word boundary
  const idNamePattern = /(\b|_)(id|uuid|key|index|ref)(\b|_|$)/i;
  if (idNamePattern.test(nameLower)) {
    const vals   = getValues(data, col);
    const unique = new Set(vals.map(String)).size;
    if (unique / data.length > 0.9) return true;
  }

  // Uniqueness + sequential heuristic
  // Excluded: "no", "num", "number", "code" — too likely to be real features (year, score, code)
  const vals = data.slice(0, 200).map(r => r[col]).filter(v => v !== "" && v != null);

  // FIX: guard against all-missing column
  if (vals.length === 0) return false;

  const unique = new Set(vals.map(String)).size;

  if (unique / vals.length > 0.95 && vals.length > 10) {
    const nums = vals.map(v => parseFloat(v)).filter(v => !isNaN(v));
    if (nums.length / vals.length > 0.95) {
      const sorted = [...nums].sort((a, b) => a - b);
      const diffs  = sorted.slice(1).map((v, i) => v - sorted[i]);
      const allOne = diffs.every(d => d === 1);
      // Extra guard: sequential integers starting from 1 or 0 only
      // Prevents year columns (2000, 2001...) from being flagged
      const startsAtOrigin = sorted[0] === 0 || sorted[0] === 1;
      if (allOne && startsAtOrigin) return true;
    }
  }

  return false;
}

/* ── FIX #1 (detectColumnRoles): guard against empty sample (all missing) ── */
/* detectColumnRoles — returns the actual data role for every column.
   The target column gets its true role (numeric/binary/categorical),
   NOT the special "target" sentinel. isTarget is tracked separately
   so getMeta can read the real role without ambiguity. */
export function buildHistogram(vals, bins = 10) {
  if (!vals.length) return [];
  const min = Math.min(...vals);
  const max = Math.max(...vals);

  if (min === max) {
    return [{ bin: `${min}`, count: vals.length }];
  }

  const binSize    = (max - min) / bins;
  const histogram  = Array.from({ length: bins }, (_, i) => ({
    bin:   `${Math.round((min + i * binSize) * 100) / 100}–${Math.round((min + (i + 1) * binSize) * 100) / 100}`,
    count: 0,
  }));

  vals.forEach(v => {
    const idx = Math.min(Math.floor((v - min) / binSize), bins - 1);
    histogram[idx].count++;
  });

  return histogram;
}

/* ══════════════════════════════════════════

export function generateSampleData() {
  const departments = ["Engineering", "Sales", "HR", "Marketing", "Finance"];
  const educations  = ["Bachelor's", "Master's", "PhD", "High School"];
  const genders     = ["Male", "Female", "Other"];

  const rand  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick  = arr => arr[Math.floor(Math.random() * arr.length)];
  const gauss = (mu, sigma) => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const rows = Array.from({ length: 500 }, (_, i) => {
    const age        = Math.round(Math.max(22, Math.min(58, gauss(38, 8))));
    const experience = Math.round(Math.max(1,  Math.min(25, gauss(8, 5))));
    const salary     = Math.round(Math.max(30000, Math.min(120000, gauss(65000, 18000))));
    const score      = Math.round(Math.max(1, Math.min(5, gauss(3.2, 0.8))));
    const churn      = (salary < 45000 || score < 2 || experience < 2) && Math.random() > 0.4 ? 1 : 0;

    return {
      employee_id:       i + 1,
      age,
      gender:            pick(genders),
      department:        pick(departments),
      years_experience:  experience,
      education:         pick(educations),
      salary,
      performance_score: score,
      remote_work:       rand(0, 1),
      churn,
    };
  });

  [10, 55, 120, 200, 310].forEach(idx => { rows[idx].salary = ""; });
  [30, 90].forEach(idx => { rows[idx].performance_score = ""; });

  const columns = Object.keys(rows[0]);
  return { data: rows, columns };
}

/* ══════════════════════════════════════════

export function getDatasetSnapshot(data, columns) {
  const rows = data.slice(0, 10).map(row => {
    const clean = {};
    columns.forEach(col => {
      const val = row[col];
      clean[col] = val === "" || val == null ? null : val;
    });
    return clean;
  });

  return { columns, rows };
}

/* ══════════════════════════════════════════
   TOP INSIGHTS — column-aware, cross-signal
══════════════════════════════════════════ */
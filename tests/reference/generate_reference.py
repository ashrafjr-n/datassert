#!/usr/bin/env python3
"""
generate_reference.py — GOLD-STANDARD reference values for the JS analysis engine.

Loads each fixture CSV in tests/reference/datasets/, computes the statistics the
JS engine (src/components/utils/core/) is expected to match, and writes them to
tests/reference/expected.json.

------------------------------------------------------------------------------
AUDIT: exactly which pandas/scipy call each metric maps to, and the ddof/method.
------------------------------------------------------------------------------
Per numeric column (NaNs dropped first via Series.dropna()):

  mean      -> Series.mean()                         (arithmetic mean)
  median    -> Series.median()                       (50th pct, linear)
  min       -> Series.min()
  max       -> Series.max()
  variance  -> Series.var(ddof=1)                    SAMPLE variance (ddof=1)
  std       -> Series.std(ddof=1)                    SAMPLE std  (ddof=1, = sqrt(var))
  q1        -> numpy.percentile(x, 25, method="linear")   type-7 / numpy default
  q3        -> numpy.percentile(x, 75, method="linear")   type-7 / numpy default
              (pandas Series.quantile() default interpolation="linear" is identical)
  skewness  -> scipy.stats.skew(x, bias=False)
              => moment-based g1, BIAS-CORRECTED sample skewness
                 (multiplies g1 by sqrt(n(n-1))/(n-2))
  kurtosis  -> scipy.stats.kurtosis(x, bias=False, fisher=True)
              => EXCESS kurtosis (normal -> 0), BIAS-CORRECTED sample estimator

Correlations (clean_numeric.csv):
  pearson r -> DataFrame.corr(method="pearson")      pairwise Pearson r

Missing counts (missing_variants.csv):
  A cell is MISSING iff, after str.strip(), it is "" (covers empty string and
  whitespace-only) OR one of: NA, N/A, NaN, null, None, ?.
  The file is read with keep_default_na=False, dtype=str so pandas does NOT
  silently convert any of these tokens itself — we count them explicitly.
------------------------------------------------------------------------------
"""

import json
import os
from itertools import combinations

import numpy as np
import pandas as pd
from scipy import stats

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "datasets")
OUT = os.path.join(HERE, "expected.json")

# Tokens treated as missing (after stripping whitespace). "" also catches
# whitespace-only cells because we strip first.
MISSING_TOKENS = {"", "NA", "N/A", "NaN", "null", "None", "?"}


def is_missing(cell: str) -> bool:
    return cell.strip() in MISSING_TOKENS


def numeric_column_stats(series: pd.Series) -> dict:
    """Gold-standard stats for one numeric column (NaNs dropped)."""
    x = series.dropna().to_numpy(dtype=float)
    n = int(x.size)
    return {
        "n": n,
        "mean": float(np.mean(x)),
        "median": float(np.median(x)),
        "min": float(np.min(x)),
        "max": float(np.max(x)),
        "variance": float(pd.Series(x).var(ddof=1)),        # sample, ddof=1
        "std": float(pd.Series(x).std(ddof=1)),             # sample, ddof=1
        "q1": float(np.percentile(x, 25, method="linear")), # type-7
        "q3": float(np.percentile(x, 75, method="linear")), # type-7
        "skewness": float(stats.skew(x, bias=False)),        # bias-corrected g1
        "kurtosis": float(stats.kurtosis(x, bias=False, fisher=True)),  # excess
    }


def numeric_stats_for_file(path: str) -> dict:
    df = pd.read_csv(path)
    num = df.select_dtypes(include=[np.number])
    return {col: numeric_column_stats(num[col]) for col in num.columns}


def missing_counts_for_file(path: str) -> dict:
    df = pd.read_csv(path, dtype=str, keep_default_na=False)
    return {
        col: int(df[col].map(is_missing).sum())
        for col in df.columns
    }


# Declared design intent for roles_missing.csv — the role the JS engine SHOULD
# assign to each column once missing tokens are stripped. This is a fixture-author
# expectation (not something pandas computes), asserted by the later role test.
ROLES_MISSING_EXPECTED_ROLE = {
    "bin_col": "binary",
    "cat_col": "categorical",
    "num_col": "numeric",
    "id_col": "identifier",
}


def _is_numeric_token(cell: str) -> bool:
    """True iff a non-missing cell parses as a finite number."""
    try:
        float(cell)
        return True
    except ValueError:
        return False


def roles_missing_reference(path: str) -> dict:
    """Per-column gold numbers for roles_missing.csv, read as raw strings so the
    missing tokens are visible (keep_default_na=False, dtype=str).

    missing_count / true_distinct / numeric_count are COMPUTED from the CSV.
    numeric_count is only recorded for the numeric-role column (null elsewhere,
    where a numeric parse count is not the relevant signal). expected_role is the
    INTENDED design label, hardcoded in ROLES_MISSING_EXPECTED_ROLE."""
    df = pd.read_csv(path, dtype=str, keep_default_na=False)
    out = {}
    for col in df.columns:
        cells = df[col].tolist()
        present = [c for c in cells if not is_missing(c)]  # non-missing raw values
        role = ROLES_MISSING_EXPECTED_ROLE[col]
        numeric_count = (
            int(sum(_is_numeric_token(c) for c in present))
            if role == "numeric" else None
        )
        out[col] = {
            "missing_count": int(sum(is_missing(c) for c in cells)),
            "true_distinct": len(set(present)),                 # distinct non-missing
            "numeric_count": numeric_count,
            "expected_role": role,                              # INTENDED (not computed)
        }
    return out


def correlations_for_file(path: str) -> dict:
    df = pd.read_csv(path)
    num = df.select_dtypes(include=[np.number])
    corr = num.corr(method="pearson")
    out = {}
    for a, b in combinations(num.columns, 2):
        out[f"{a}__{b}"] = float(corr.loc[a, b])
    return out


def main():
    expected = {}

    # a. clean_numeric.csv — numeric stats + all pairwise Pearson r
    expected["clean_numeric"] = {
        "columns": numeric_stats_for_file(os.path.join(DATA, "clean_numeric.csv")),
        "correlations": correlations_for_file(os.path.join(DATA, "clean_numeric.csv")),
    }

    # b. missing_variants.csv — per-column missing counts
    expected["missing_variants"] = {
        "missing_counts": missing_counts_for_file(
            os.path.join(DATA, "missing_variants.csv")
        ),
    }

    # c. mixed_types.csv — numeric stats (measurement, record_id, flag)
    expected["mixed_types"] = {
        "columns": numeric_stats_for_file(os.path.join(DATA, "mixed_types.csv")),
    }

    # d. skew_kurt.csv — numeric stats (skew/kurtosis are the point of interest)
    expected["skew_kurt"] = {
        "columns": numeric_stats_for_file(os.path.join(DATA, "skew_kurt.csv")),
    }

    # e. roles_missing.csv — role-detection targets w/ missing tokens in typed cols
    expected["roles_missing"] = {
        "_note": (
            "missing_count, true_distinct, numeric_count are COMPUTED by "
            "pandas/scipy (objective reference). expected_role is INTENDED by "
            "fixture design (what detectColumnRoles SHOULD output) — it is "
            "asserted, not computed."
        ),
        "columns": roles_missing_reference(os.path.join(DATA, "roles_missing.csv")),
    }

    with open(OUT, "w") as f:
        json.dump(expected, f, indent=2, sort_keys=True)
        f.write("\n")

    # ---- human-readable summary ----
    print(f"Reference written to {OUT}\n")
    print(f"pandas {pd.__version__} | numpy {np.__version__} | scipy {stats.__name__ and __import__('scipy').__version__}\n")

    def print_cols(name, cols):
        print(f"[{name}]")
        for col, m in cols.items():
            print(
                f"  {col:<12} n={m['n']:<3} mean={m['mean']:.4f} "
                f"std={m['std']:.4f} var={m['variance']:.4f} "
                f"median={m['median']:.4f} Q1={m['q1']:.4f} Q3={m['q3']:.4f} "
                f"skew={m['skewness']:.4f} kurt={m['kurtosis']:.4f}"
            )

    print_cols("clean_numeric", expected["clean_numeric"]["columns"])
    print("  correlations:")
    for k, v in expected["clean_numeric"]["correlations"].items():
        print(f"    {k:<16} r={v:.6f}")
    print()

    print("[missing_variants] missing counts per column:")
    for col, c in expected["missing_variants"]["missing_counts"].items():
        print(f"  {col:<8} = {c}")
    print()

    print_cols("mixed_types", expected["mixed_types"]["columns"])
    print()
    print_cols("skew_kurt", expected["skew_kurt"]["columns"])
    print()

    print("[roles_missing] role-detection targets (missing tokens in typed cols):")
    for col, m in expected["roles_missing"]["columns"].items():
        print(
            f"  {col:<8} missing={m['missing_count']} "
            f"true_distinct={m['true_distinct']} numeric_count={m['numeric_count']} "
            f"expected_role={m['expected_role']}"
        )


if __name__ == "__main__":
    main()

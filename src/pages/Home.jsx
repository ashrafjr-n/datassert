import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import {
  UploadCloud, LoaderCircle, TriangleAlert, ChevronDown,
  FlaskConical, Binary, ShieldCheck, Scale,
  Workflow, ListChecks, Network, Gauge, Split, Lightbulb,
} from "lucide-react";

import Header from "../components/layout/Header.jsx";
import { setPendingDataset } from "../lib/datasetHandoff.js";

const MAX_SIZE_MB = 40;
const MAX_SIZE_B  = MAX_SIZE_MB * 1024 * 1024;

const ERRORS = {
  format: {
    title: "Unsupported file format.",
    desc:  "Only CSV files are accepted.",
  },
  size: {
    title: "File exceeds the size limit.",
    desc:  `Maximum accepted size is ${MAX_SIZE_MB}MB.`,
  },
  parse: {
    title: "Unable to parse this file.",
    desc:  "The CSV structure could not be read — check for a header row and consistent columns.",
  },
};

/* Small stat row for dashboard-adjacent texture only — not live data. See
   frontend.md "Home" spec: atmosphere, never a fake dashboard. */
const DIAGNOSTICS = [
  { value: "10+", label: "Diagnostics computed" },
  { value: "6",   label: "Report sections" },
  { value: "0",   label: "Bytes sent to a server" },
];

/* Left column: grounded, checkable claims — not marketing adjectives. Every one
   of these is a fact about something specific in the engine, not a vibe. */
const TALKING_POINTS = [
  {
    icon: FlaskConical,
    title: "Validated against a reference implementation",
    text: "Every statistic — standard deviation, skewness, kurtosis — is checked against a Python/pandas/scipy reference to a 1e-6 tolerance, not hand-verified once and left alone.",
  },
  {
    icon: Binary,
    title: "Role detection, not column-name matching",
    text: "Numeric, categorical, identifier, and temporal roles are inferred from the values themselves — cardinality, uniqueness, date-family matching — with explicit guards against false positives like a 4-digit year read as a date.",
  },
  {
    icon: ShieldCheck,
    title: "Nothing leaves the browser",
    text: "Parsing and every computation run in this tab. There is no upload endpoint to misconfigure, because there is no upload.",
  },
  {
    icon: Scale,
    title: "Built for people who read a correlation matrix",
    text: "No dumbed-down thresholds, no hand-holding copy. If you know what target leakage or multicollinearity means, this tool assumes you do.",
  },
];

/* Right column: real documentation of how each phase actually works, sourced
   directly from the analysis engine's logic — expand-on-click, not a wall of
   text no one asked for. See frontend.md "Home" spec. */
const PROCESS_TOPICS = [
  {
    icon: Workflow,
    title: "Column role detection",
    text: "Each column is classified as identifier, numeric, categorical, binary, or temporal. Numeric-looking integers with very low cardinality (≤8 unique values, under 5% of rows) are reclassified as encoded categorical, so a country code stored as 1–5 isn't treated as a continuous measurement. Identifier columns need a uniqueness signal plus supporting evidence — a name hint or leading-zero codes — width and uniqueness alone are never enough on their own.",
  },
  {
    icon: ListChecks,
    title: "Missing values & duplicates",
    text: "Missing tokens are matched broadly — empty strings, NA, null, N/A, whitespace — and excluded from every downstream calculation, not just counted. Duplicate-row scanning runs on datasets up to 50,000 rows; past that it's skipped and reported as skipped, never silently shown as zero.",
  },
  {
    icon: Network,
    title: "Correlation methods",
    text: "Numeric pairs use Pearson correlation. Categorical pairs use Cramér's V. A numeric feature against a categorical target uses the correlation ratio (η). Pairs at |r| ≥ 0.9 are flagged as redundant; a feature correlated above that threshold with the target itself is flagged as possible leakage.",
  },
  {
    icon: Gauge,
    title: "Health score",
    text: "A single 0–100 score, weighted across four dimensions: quality (missing/duplicate/constant columns), structure (row-to-feature ratio, identifier leakage), relationships (multicollinearity, leakage), and target readiness (class balance, when a target is set). A dimension's own sub-weights renormalize when a check — like the duplicate scan — is skipped, rather than silently scoring it as passing.",
  },
  {
    icon: Split,
    title: "Class balance",
    text: "For a classification target, the majority-to-minority ratio is compared against a 3× threshold (or an 80% majority share) to flag imbalance. The minority class's absolute row count is called out separately — under 10 rows reads as critically few no matter what the percentage says.",
  },
  {
    icon: Lightbulb,
    title: "Recommendations",
    text: "Every finding becomes a prioritized action — drop a column, impute a specific way, investigate an outlier — tagged by category (Data Cleaning, Feature Selection, Feature Engineering, Modeling, Data Integrity) and priority, not a generic checklist.",
  },
];

function validate(file) {
  if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") return "format";
  if (file.size > MAX_SIZE_B) return "size";
  return null;
}

function TalkingPointsColumn() {
  return (
    <aside className="order-2 space-y-6 lg:order-1">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Why it's built this way</div>
      {TALKING_POINTS.map((p) => (
        <div key={p.title}>
          <div className="flex items-center gap-2">
            <p.icon size={15} className="shrink-0 text-gold-ink" />
            <div className="text-[13px] font-semibold text-ink">{p.title}</div>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-soft">{p.text}</p>
        </div>
      ))}
    </aside>
  );
}

function ProcessTopicsColumn() {
  const [open, setOpen] = useState(null);
  return (
    <aside className="order-3 lg:order-3">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">How the analysis works</div>
      <div className="divide-y divide-line rounded-xl border border-line">
        {PROCESS_TOPICS.map((topic, i) => {
          const isOpen = open === i;
          return (
            <div key={topic.title}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left"
              >
                <topic.icon size={15} className="shrink-0 text-ink-faint" />
                <span className="flex-1 text-[13px] font-medium text-ink">{topic.title}</span>
                <ChevronDown size={14} className={`shrink-0 text-ink-faint transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pl-[34px] text-[12.5px] leading-relaxed text-ink-soft">
                  {topic.text}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function Home() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isParsing,  setIsParsing]  = useState(false);
  const [error,      setError]      = useState(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    const err = validate(file);
    if (err) { setError(err); return; }

    setError(null);
    setIsParsing(true);

    Papa.parse(file, {
      header:         true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;
        const cols = results.meta.fields;
        if (!cols || cols.length === 0 || data.length === 0) {
          setIsParsing(false);
          setError("parse");
          return;
        }
        setPendingDataset(data, cols);
        navigate("/analyze");
      },
      error: () => {
        setIsParsing(false);
        setError("parse");
      },
    });
  }, [navigate]);

  const onDragOver  = (e) => { e.preventDefault(); setIsDragOver(true); };
  const onDragLeave = ()  => setIsDragOver(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Header />

      <main className="mx-auto min-h-[160vh] max-w-[1500px] px-6 pb-24 pt-28 sm:px-10 sm:pt-32">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)_300px] lg:gap-8">

          <TalkingPointsColumn />

          {/* Center — intro + upload, pulled close together */}
          <div className="order-1 lg:order-2">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                A structural and statistical audit of your dataset,
                computed entirely in the browser.
              </h1>
              <p className="mx-auto mt-6 text-[15px] leading-relaxed text-ink-soft">
                Upload a CSV and select a target column. Datassert returns column-role
                detection, missing-value and duplicate analysis, per-column statistics,
                a correlation matrix with multicollinearity and target-leakage checks,
                class-balance diagnostics, and a weighted health score. No file is
                uploaded to a server — parsing and analysis run locally, in this tab.
              </p>

              <div className="mt-8 flex items-center justify-center gap-8 border-y border-line py-4">
                {DIAGNOSTICS.map((d) => (
                  <div key={d.label} className="text-center">
                    <div className="font-mono text-xl font-semibold text-ink">{d.value}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-wide text-ink-faint">{d.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload card — close under the intro, not vertically centered
                in leftover page space */}
            <div className="mx-auto mt-8 max-w-xl">
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => !isParsing && inputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-8 py-14 text-center transition-colors ${
                  isDragOver ? "border-gold bg-gold-tint" : "border-line-strong bg-paper-sunken hover:border-ink-faint"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />

                {isParsing ? (
                  <>
                    <LoaderCircle size={32} className="animate-spin text-gold-ink" />
                    <div className="mt-4 text-sm font-medium text-ink">Parsing file…</div>
                  </>
                ) : (
                  <>
                    <UploadCloud size={32} className="text-ink-faint" />
                    <div className="mt-4 text-[15px] font-medium text-ink">
                      {isDragOver ? "Drop to upload" : "Drag and drop a CSV file"}
                    </div>
                    <div className="mt-1 text-[13px] text-ink-faint">or click to browse</div>
                  </>
                )}
              </div>

              <p className="mt-4 text-center text-[12px] text-ink-faint">
                CSV only · Up to {MAX_SIZE_MB}MB · Processed locally, never uploaded
              </p>

              {error && (
                <div className="mt-4 flex items-start gap-3 rounded-lg border border-critical/20 bg-critical-tint px-4 py-3">
                  <TriangleAlert size={16} className="mt-0.5 shrink-0 text-critical" />
                  <div>
                    <div className="text-[13px] font-semibold text-critical">{ERRORS[error].title}</div>
                    <div className="text-[13px] text-ink-soft">{ERRORS[error].desc}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <ProcessTopicsColumn />

        </div>
      </main>
    </div>
  );
}

export default Home;

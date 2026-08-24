import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import { UploadCloud, LoaderCircle, TriangleAlert } from "lucide-react";

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

function validate(file) {
  if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") return "format";
  if (file.size > MAX_SIZE_B) return "size";
  return null;
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

      <main className="mx-auto flex min-h-[160vh] max-w-[1400px] flex-col px-6 pt-32 pb-24 sm:px-12">

        {/* Intro — plain, technical, no marketing tone */}
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            A structural and statistical audit of your dataset,
            computed entirely in the browser.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
            Upload a CSV and select a target column. Datassert returns column-role
            detection, missing-value and duplicate analysis, per-column statistics,
            a correlation matrix with multicollinearity and target-leakage checks,
            class-balance diagnostics, and a weighted health score. No file is
            uploaded to a server — parsing and analysis run locally, in this tab.
          </p>

          <div className="mt-10 flex items-center justify-center gap-10 border-y border-line py-5">
            {DIAGNOSTICS.map((d) => (
              <div key={d.label} className="text-center">
                <div className="font-mono text-xl font-semibold text-ink">{d.value}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-ink-faint">{d.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload card */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xl">
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

      </main>
    </div>
  );
}

export default Home;

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Info, ChevronDown } from "lucide-react";

import { detectColumnRoles } from "../../utils/core/detectors/roles.js";
import { ROLE }              from "../../utils/core/roles.constants.js";

const TARGET_MODES = [
  { id: "auto",   label: "Auto Detect"   },
  { id: "select", label: "Select Column" },
  { id: "none",   label: "No Target"     },
];

/* Status-pill mapping, keyed by the ROLE enum — the picker labels columns with the
   SAME roles the analysis engine assigns, so this can never disagree with the
   report (see frontend.md "Target step"). identifier gets the warning tint since
   it's the one role the engine recommends dropping; temporal gets the gold tint
   as a deliberate, sparing accent — dates are the rarest/most notable role. */
const PILL_STYLE = {
  [ROLE.NUMERIC]:     "bg-info-tint text-info",
  [ROLE.CATEGORICAL]: "bg-paper text-ink-soft border border-line",
  [ROLE.BINARY]:      "bg-success-tint text-success",
  [ROLE.IDENTIFIER]:  "bg-warning-tint text-warning",
  [ROLE.TEMPORAL]:    "bg-gold-tint text-gold-ink",
};
const FALLBACK_PILL = PILL_STYLE[ROLE.CATEGORICAL];

function RolePill({ role }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide ${PILL_STYLE[role] ?? FALLBACK_PILL}`}>
      {role}
    </span>
  );
}

function ModePanel({ mode, columns, colTypes, selected, setSelected, initialTarget }) {
  if (mode === "auto") {
    if (!initialTarget) return null;
    const type = colTypes[initialTarget] ?? ROLE.CATEGORICAL;
    return (
      <div className="flex items-center justify-between rounded-lg border border-line bg-paper-sunken px-4 py-3">
        <span className="font-mono text-[13px] text-ink">{initialTarget}</span>
        <div className="flex items-center gap-2">
          <RolePill role={type} />
          <span className="text-[11px] text-ink-faint">auto-detected</span>
        </div>
      </div>
    );
  }

  if (mode === "select") {
    const type = colTypes[selected] ?? ROLE.CATEGORICAL;
    return (
      <div className="space-y-3">
        <div className="relative">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full appearance-none rounded-lg border border-line-strong bg-paper px-4 py-2.5 font-mono text-[13px] text-ink focus:border-gold focus:outline-none"
          >
            {columns.map((col) => (
              <option key={col} value={col}>{col} — {colTypes[col]}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-faint" />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-line bg-paper-sunken px-4 py-3">
          <span className="font-mono text-[13px] text-ink">{selected}</span>
          <RolePill role={type} />
        </div>
      </div>
    );
  }

  if (mode === "none") {
    return (
      <div className="flex items-start gap-2.5 rounded-lg border border-line bg-paper-sunken px-4 py-3 text-[12px] leading-relaxed text-ink-soft">
        <Info size={14} className="mt-0.5 shrink-0 text-ink-faint" />
        Class balance and ML task type will be unavailable without a target
        column. Every other section of the report runs normally.
      </div>
    );
  }

  return null;
}

function TargetStep({ columns, csvData, initialTarget, onConfirm, onBack }) {
  const [mode,     setMode]     = useState("auto");
  const [selected, setSelected] = useState(initialTarget || columns[0] || "");

  // Single source of truth: the same role detector the analyzer runs. Passing a null
  // target keeps every column's natural role — so an ID column is still surfaced as
  // "identifier" here, which is exactly the warning a user needs while picking.
  const colTypes = useMemo(
    () => detectColumnRoles(csvData ?? [], columns, null),
    [columns, csvData],
  );

  const effectiveTarget =
    mode === "none" ? null :
    mode === "auto" ? initialTarget :
    selected;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center px-6 py-16">
      <div className="w-full rounded-2xl border border-line bg-paper p-8">

        <div className="text-[11px] font-medium uppercase tracking-widest text-ink-faint">
          Configuration
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
          Select a target column
        </h1>
        <p className="mt-1.5 text-[13px] text-ink-soft">
          Determines the ML task type, class-balance report, and leakage checks.
        </p>

        <div className="mt-6 flex gap-6 border-y border-line py-4">
          <div>
            <div className="font-mono text-lg font-semibold text-ink">{csvData.length.toLocaleString()}</div>
            <div className="text-[11px] uppercase tracking-wide text-ink-faint">Rows</div>
          </div>
          <div>
            <div className="font-mono text-lg font-semibold text-ink">{columns.length}</div>
            <div className="text-[11px] uppercase tracking-wide text-ink-faint">Columns</div>
          </div>
        </div>

        {/* Segmented control */}
        <div className="mt-6 flex gap-1 rounded-lg bg-paper-sunken p-1">
          {TARGET_MODES.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMode(opt.id)}
              className={`flex-1 rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                mode === opt.id ? "bg-paper text-ink shadow-sm" : "text-ink-soft hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="mt-4"
          >
            <ModePanel
              mode={mode}
              columns={columns}
              colTypes={colTypes}
              selected={selected}
              setSelected={setSelected}
              initialTarget={initialTarget}
            />
          </motion.div>
        </AnimatePresence>

        <div className="mt-7 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-soft hover:text-ink"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <button
            type="button"
            onClick={() => onConfirm(effectiveTarget)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-5 py-2.5 text-[13px] font-semibold text-paper hover:bg-ink/90"
          >
            Start Analysis
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}

export default TargetStep;

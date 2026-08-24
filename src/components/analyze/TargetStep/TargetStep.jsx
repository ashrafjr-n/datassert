import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { detectColumnRoles } from "../../utils/core/detectors/roles.js";
import { ROLE }              from "../../utils/core/roles.constants.js";

import "./target.css";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const TARGET_MODES = [
  { id: "auto",   label: "Auto Detect",    desc: "Recommended"           },
  { id: "select", label: "Select Column",  desc: "Choose manually"       },
  { id: "none",   label: "No Target",      desc: "Unsupervised / EDA only" },
];

/* Keyed by the ROLE enum — the picker now labels columns with the SAME roles the
   analysis engine will assign, so the pill can never disagree with the report.
   identifier/temporal reuse the neutral style; no new pill styling was added. */
const PILL_CLASS = {
  [ROLE.NUMERIC]:     "target-col-info__pill--numeric",
  [ROLE.CATEGORICAL]: "target-col-info__pill--categorical",
  [ROLE.BINARY]:      "target-col-info__pill--binary",
  [ROLE.IDENTIFIER]:  "target-col-info__pill--categorical",
  [ROLE.TEMPORAL]:    "target-col-info__pill--categorical",
};

const FALLBACK_PILL = PILL_CLASS[ROLE.CATEGORICAL];

/* ─────────────────────────────────────────────
   MODE PANEL — single animated block
───────────────────────────────────────────── */
function ModePanel({ mode, columns, colTypes, selected, setSelected, initialTarget }) {
  if (mode === "auto") {
    if (!initialTarget) return null;
    const type = colTypes[initialTarget] ?? ROLE.CATEGORICAL;
    return (
      <div className="target-col-info" style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <div className="target-selector__hint-dot" />
          <span className="target-col-info__name">{initialTarget}</span>
        </div>
        <div className="target-col-info__pills">
          <span className={`target-col-info__pill ${PILL_CLASS[type] ?? FALLBACK_PILL}`}>
            {type}
          </span>
          <span className="target-col-info__pill target-col-info__pill--categorical"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.30)" }}>
            auto-detected
          </span>
        </div>
      </div>
    );
  }

  if (mode === "select") {
    const type      = colTypes[selected] ?? ROLE.CATEGORICAL;
    const pillClass = PILL_CLASS[type] ?? FALLBACK_PILL;
    return (
      <div className="target-selector" style={{ marginBottom: "28px" }}>
        <div className="target-selector__dropdown-wrap">
          <select
            className="target-selector__dropdown"
            value={selected}
            onChange={e => setSelected(e.target.value)}
          >
            {columns.map(col => (
              <option key={col} value={col}>
                {col} — {colTypes[col]}
              </option>
            ))}
          </select>
          <span className="target-selector__chevron">▾</span>
        </div>
        <div className="target-col-info" style={{ marginTop: "10px" }}>
          <span className="target-col-info__name">{selected}</span>
          <div className="target-col-info__pills">
            <span className={`target-col-info__pill ${pillClass}`}>{type}</span>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "none") {
    return (
      <div style={{
        display: "flex", alignItems: "flex-start", gap: "10px",
        padding: "12px 14px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "10px", marginBottom: "28px",
        fontSize: "12px", color: "rgba(255,255,255,0.35)", lineHeight: "1.6",
      }}>
        <span style={{ flexShrink: 0, marginTop: "1px" }}>ℹ</span>
        Class Balance and ML Task Type will be unavailable without a target column.
        All other analysis will run normally.
      </div>
    );
  }

  return null;
}

/* ─────────────────────────────────────────────
   TARGET STEP
───────────────────────────────────────────── */
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
    mode === "none"   ? null :
    mode === "auto"   ? initialTarget :
    selected;

  return (
    <div className="target-page">
      <div className="target-card">

        {/* Eyebrow */}
        <motion.div
          className="target-card__eyebrow"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="target-card__eyebrow-dot" />
          Step 2 of 4
        </motion.div>

        {/* Title */}
        <motion.h1
          className="target-card__title"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
        >
          Dataset Detected
        </motion.h1>

        <motion.p
          className="target-card__subtitle"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          Choose how to handle the target column before running the analysis.
        </motion.p>

        {/* Dataset summary */}
        <motion.div
          className="target-summary"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <div className="target-summary__card">
            <div className="target-summary__label">Rows</div>
            <div className="target-summary__value">{csvData.length.toLocaleString()}</div>
          </div>
          <div className="target-summary__card">
            <div className="target-summary__label">Columns</div>
            <div className="target-summary__value">{columns.length}</div>
          </div>
        </motion.div>

        {/* Mode selector */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.4 }}
        >
          <div className="target-selector__label">Target Column</div>
          <div className="target-mode-group">
            {TARGET_MODES.map(opt => (
              <div
                key={opt.id}
                className={`target-mode-option${mode === opt.id ? " target-mode-option--active" : ""}`}
                onClick={() => setMode(opt.id)}
              >
                <div className="target-mode-option__radio">
                  {mode === opt.id && <div className="target-mode-option__radio-dot" />}
                </div>
                <span className="target-mode-option__label">{opt.label}</span>
                <span className="target-mode-option__desc">{opt.desc}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Single AnimatePresence — key changes with mode */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
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

        {/* Actions */}
        <motion.div
          className="target-actions"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <button
            className="target-btn-primary"
            onClick={() => onConfirm(effectiveTarget)}
          >
            Start Analysis
            <span>→</span>
          </button>
          <button className="target-btn-back" onClick={onBack}>
            ← Back
          </button>
        </motion.div>

      </div>
    </div>
  );
}

export default TargetStep;
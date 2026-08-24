import { useMemo } from "react";
import { motion } from "framer-motion";

// ─── Constants ────────────────────────────────────────────────────────────────

const ISSUE_ICONS = {
  missing:          "⚠",
  high_cardinality: "◈",
  constant:         "—",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Maps a missing-value percentage to a severity colour.
 * Centralises all colour logic in one place so bars + labels always agree.
 */
const getSeverityColor = (pct) => {
  if (pct > 20) return "var(--danger, #f87171)";
  if (pct > 10) return "var(--warning)";
  return "rgba(255,255,255,0.40)";
};

/**
 * Robustly parse a count from c.detail which may arrive as:
 *   123 | "123" | "123 missing" | "12%" | null | "" | undefined
 * Strategy: strip everything except digits and dots, then parse.
 */
const parseCount = (detail) => {
  const cleaned = String(detail ?? "0").replace(/[^\d.]/g, "");
  const n = Math.floor(Number(cleaned));
  return Number.isFinite(n) ? n : 0;
};

// ─── Framer-Motion variants ────────────────────────────────────────────────────

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.42 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.28 } },
};


// ─── LoadingSkeleton ──────────────────────────────────────────────────────────

/**
 * Shown when meta.rows is not yet available (async load).
 * Prevents bars from rendering as ~100% on stale/empty data.
 */
function LoadingSkeleton() {
  return (
    <motion.div
      className="dash-card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      style={{ padding: "32px", textAlign: "center" }}
    >
      <div style={{
        display:       "flex",
        flexDirection: "column",
        gap:           "12px",
        alignItems:    "stretch",
      }}>
        {[100, 72, 55].map((w, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "130px", height: "10px", borderRadius: "4px", background: "rgba(255,255,255,0.06)" }} />
            <div style={{ flex: 1, height: "4px",  borderRadius: "2px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: `${w}%` }}
                transition={{ delay: 0.1 * i, duration: 0.8, ease: "easeOut", repeat: Infinity, repeatType: "reverse", repeatDelay: 0.6 }}
                style={{ height: "100%", background: "rgba(255,255,255,0.08)", borderRadius: "2px" }}
              />
            </div>
            <div style={{ width: "42px", height: "10px", borderRadius: "4px", background: "rgba(255,255,255,0.06)" }} />
          </div>
        ))}
      </div>
      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", marginTop: "18px" }}>
        Loading row data…
      </div>
    </motion.div>
  );
}

// ─── MissingValuesRanking ─────────────────────────────────────────────────────

/**
 * Receives `missingCols` already enriched with `pct` from the parent's useMemo.
 * Purely presentational — no calculations here.
 */
function MissingValuesRanking({ missingCols }) {
  if (!missingCols.length) return null;

  return (
    <motion.div
      className="dash-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.38, duration: 0.35 }}
      style={{ marginBottom: "14px" }}
    >
      <div className="dash-section-title">Missing Values — by Column</div>

      <motion.div variants={listVariants} initial="hidden" animate="show">
        {missingCols.map((item, i) => {
          const { pct, count, col } = item;
          const color = getSeverityColor(pct);

          return (
            <motion.div
              key={col}
              variants={rowVariants}
              style={{
                display:      "flex",
                alignItems:   "center",
                gap:          "12px",
                padding:      "9px 0",
                borderBottom: i < missingCols.length - 1
                  ? "1px solid rgba(255,255,255,0.04)"
                  : "none",
              }}
            >
              {/* Column name */}
              <span style={{
                fontSize:     "12px",
                fontWeight:   "500",
                color:        "rgba(255,255,255,0.65)",
                width:        "130px",
                flexShrink:   0,
                overflow:     "hidden",
                textOverflow: "ellipsis",
                whiteSpace:   "nowrap",
              }}>
                {col}
              </span>

              {/* Bar — honest width; minWidth only shows a dot if pct > 0 */}
              <div style={{
                flex:         1,
                height:       "4px",
                background:   "rgba(255,255,255,0.06)",
                borderRadius: "2px",
                overflow:     "hidden",
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.46 + i * 0.05, duration: 0.5, ease: "easeOut" }}
                  style={{
                    height:       "100%",
                    background:   color,
                    borderRadius: "2px",
                    minWidth:     pct > 0 ? "2px" : "0px",
                  }}
                />
              </div>

              {/* Count + percentage */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.28)" }}>
                  {count.toLocaleString()}
                </span>
                <span style={{
                  fontSize:   "11px",
                  fontWeight: "600",
                  color,
                  minWidth:   "42px",
                  textAlign:  "right",
                }}>
                  {Math.round(pct * 10) / 10}%
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

// ─── QualityTab ───────────────────────────────────────────────────────────────

function QualityTab({ result }) {
  const { quality, meta } = result;

  // Row count isn't ready yet → render a skeleton instead of bars showing ~100%
  // from a division-by-1 fallback on stale data.
  const totalRows = meta?.rows;
  const rowsReady = totalRows > 0;

  // Rules of Hooks: these must run on EVERY render, so they sit above the early
  // return below and no-op internally until the row count is ready.
  const issues = quality?.columnsWithIssues;

  const missingCols = useMemo(() => (
    !rowsReady ? [] : (issues ?? [])
      .filter(c => c.issue === "missing")
      .map(c => {
        const count = parseCount(c.detail);
        // clamp to [0, 100] — guards against data inconsistencies
        const pct   = Math.min(100, Math.max(0, (count / totalRows) * 100));
        return { col: c.col, count, pct };
      })
      .sort((a, b) => b.count - a.count)
  ), [issues, totalRows, rowsReady]);

  const otherIssues = useMemo(() => (
    (issues ?? []).filter(c => c.issue !== "missing")
  ), [issues]);

  if (!rowsReady) return <LoadingSkeleton />;

  const score      = quality.qualityScore;
  const scoreColor =
    score >= 80 ? "var(--success)" :
    score >= 55 ? "var(--warning)" :
    "#f87171";

  return (
    <div>
      {/* ── KPI row ── */}
      <div className="dash-grid-3">
        {[
          {
            label: "Missing Cells",
            value: quality.missingCells.toLocaleString(),
            cls:   quality.missingCells > 0 ? "dash-stat-value--warning" : "dash-stat-value--success",
          },
          {
            // FIX #4: skipped ≠ zero. Show "Skipped" in a neutral (gray) style,
            // never green success, when the duplicate scan was skipped.
            label: "Duplicate Rows",
            value: quality.duplicatesComputed ? quality.duplicateRows : "Skipped",
            cls:   !quality.duplicatesComputed ? "dash-stat-value--neutral"
                 : quality.duplicateRows > 0   ? "dash-stat-value--warning"
                 :                               "dash-stat-value--success",
            title: quality.duplicatesComputed ? undefined
                 : "Duplicate check skipped on datasets over 50,000 rows.",
          },
          {
            label: "Missing %",
            value: `${quality.missingPct}%`,
            cls:   quality.missingPct > 5 ? "dash-stat-value--warning" : "dash-stat-value--success",
          },
        ].map((k, i) => (
          <motion.div
            key={k.label}
            className="dash-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.32 }}
          >
            <div className="dash-stat-label">{k.label}</div>
            <div className={`dash-stat-value ${k.cls}`} title={k.title}>{k.value}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Quality score + breakdown ── */}
      <motion.div
        className="dash-card dash-card--gold"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.35 }}
        style={{ marginBottom: "14px" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div className="dash-section-title" style={{ marginBottom: 0 }}>Quality Score</div>
          <span style={{ fontSize: "28px", fontWeight: "800", color: scoreColor, letterSpacing: "-0.04em" }}>
            {score}
            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.22)", fontWeight: "400" }}>/100</span>
          </span>
        </div>

        {/* Score bar */}
        <div style={{ height: "4px", background: "rgba(255,255,255,0.07)", borderRadius: "2px", overflow: "hidden", marginBottom: "18px" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
            style={{ height: "100%", background: scoreColor, borderRadius: "2px" }}
          />
        </div>

        {/* Score breakdown */}
        {quality.scorePenalties?.length > 0 ? (
          <div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.28)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>
              Why this score?
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>Base score</span>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--success)" }}>+100</span>
            </div>

            <motion.div variants={listVariants} initial="hidden" animate="show">
              {quality.scorePenalties.map((p, i) => (
                <motion.div
                  key={p.label}
                  variants={rowVariants}
                  style={{
                    display:        "flex",
                    justifyContent: "space-between",
                    alignItems:     "flex-start",
                    padding:        "9px 0",
                    borderBottom:   i < quality.scorePenalties.length - 1
                      ? "1px solid rgba(255,255,255,0.05)"
                      : "none",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", fontWeight: "500", marginBottom: "2px" }}>{p.label}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.28)" }}>{p.detail}</div>
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--warning)", flexShrink: 0 }}>−{p.penalty}</span>
                </motion.div>
              ))}
            </motion.div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0 0", marginTop: "4px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "rgba(255,255,255,0.55)" }}>Final score</span>
              <span style={{ fontSize: "14px", fontWeight: "800", color: scoreColor }}>{score}/100</span>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: "12px", color: "var(--success)" }}>
            ✓ No penalties — dataset passed all quality checks.
          </div>
        )}
      </motion.div>

      {/* ── Missing values ranking ── */}
      <MissingValuesRanking missingCols={missingCols} />

      {/* ── Other issues ── */}
      {otherIssues.length > 0 && (
        <motion.div
          className="dash-card"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44, duration: 0.35 }}
        >
          <div className="dash-section-title">Other Issues</div>
          {otherIssues.map((item, i) => (
            <div
              key={item.col}
              className="dash-issue-row"
              style={{ borderBottom: i < otherIssues.length - 1 ? undefined : "none" }}
            >
              <span className="dash-issue-row__icon">{ISSUE_ICONS[item.issue] ?? "⚠"}</span>
              <div>
                <div className="dash-issue-row__col">{item.col}</div>
                <div className="dash-issue-row__detail">{item.detail}</div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── All clean ── */}
      {quality.columnsWithIssues.length === 0 && (
        <motion.div
          className="dash-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.38 }}
          style={{ textAlign: "center", padding: "32px" }}
        >
          <div style={{ fontSize: "22px", marginBottom: "10px" }}>✓</div>
          <div style={{ fontSize: "14px", color: "var(--success)", fontWeight: "600" }}>No issues detected</div>
          <div className="dash-stat-label" style={{ marginTop: "6px" }}>All columns passed quality checks.</div>
        </motion.div>
      )}
    </div>
  );
}

export default QualityTab;
import { useState } from "react";
import { motion }   from "framer-motion";

const SEVERITY_CFG = {
  critical: { icon: "\u2715", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.22)",  color: "#f87171",        label: "Critical" },
  warning:  { icon: "\u26a0", bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.20)", color: "var(--warning)", label: "Warning"  },
  info:     { icon: "\u25c8", bg: "rgba(99,179,237,0.06)", border: "rgba(99,179,237,0.16)", color: "#63b3ed",        label: "Info"     },
  success:  { icon: "\u2713", bg: "rgba(74,222,128,0.06)", border: "rgba(74,222,128,0.16)", color: "var(--success)", label: "Good"     },
};

function InsightRow({ insight, i }) {
  const cfg = SEVERITY_CFG[insight.severity] || SEVERITY_CFG.info;
  return (
    <motion.div
      className="dash-insight-row"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.05, duration: 0.26 }}
    >
      <div className="dash-insight-row__icon" style={{ color: cfg.color }}>{cfg.icon}</div>
      <div className="dash-insight-row__body">
        <div className="dash-insight-row__title" style={{ color: cfg.color }}>{insight.title}</div>
        <div className="dash-insight-row__text">{insight.text}</div>
      </div>
      <div className="dash-insight-row__badge" style={{ color: cfg.color, borderColor: cfg.border }}>
        {cfg.label}
      </div>
    </motion.div>
  );
}

function PriorityInsightsCard({ insights, recommendations }) {
  const [recsExpanded, setRecsExpanded] = useState(false);
  if (!insights?.length && !recommendations?.length) return null;

  const problems  = (insights || []).filter(i => i.severity === "critical" || i.severity === "warning");
  const positives = (insights || []).filter(i => i.severity === "success");
  const infos     = (insights || []).filter(i => i.severity === "info");
  const highRecs  = (recommendations || []).filter(r => r.priority === "high");
  const shownRecs = recsExpanded ? (recommendations || []) : (recommendations || []).slice(0, 4);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26, duration: 0.38 }}>

      {insights?.length > 0 && (
        <div className="dash-card" style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div className="dash-section-title" style={{ marginBottom: 0 }}>Priority Insights</div>
            <div style={{ display: "flex", gap: "6px" }}>
              {problems.filter(i => i.severity === "critical").length > 0 && (
                <span className="dash-count-badge dash-count-badge--critical">{problems.filter(i => i.severity === "critical").length} critical</span>
              )}
              {problems.filter(i => i.severity === "warning").length > 0 && (
                <span className="dash-count-badge dash-count-badge--warning">{problems.filter(i => i.severity === "warning").length} warnings</span>
              )}
            </div>
          </div>
          {problems.length > 0 && (
            <div style={{ marginBottom: "14px" }}>
              <div className="dash-insights-group__label">Issues to address</div>
              <div className="dash-insights-group__list">{problems.map((ins, i) => <InsightRow key={i} insight={ins} i={i} />)}</div>
            </div>
          )}
          {infos.length > 0 && (
            <div style={{ marginBottom: "14px" }}>
              <div className="dash-insights-group__label">Observations</div>
              <div className="dash-insights-group__list">{infos.map((ins, i) => <InsightRow key={i} insight={ins} i={i} />)}</div>
            </div>
          )}
          {positives.length > 0 && (
            <div>
              <div className="dash-insights-group__label">Strengths</div>
              <div className="dash-insights-group__list">{positives.map((ins, i) => <InsightRow key={i} insight={ins} i={i} />)}</div>
            </div>
          )}
        </div>
      )}

      {recommendations?.length > 0 && (
        <div className="dash-card" style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div className="dash-section-title" style={{ marginBottom: 0 }}>Recommendations</div>
            {highRecs.length > 0 && <span className="dash-count-badge dash-count-badge--critical">{highRecs.length} high priority</span>}
          </div>
          <div className="dash-recs-list">
            {shownRecs.map((rec, i) => {
              const pColor = rec.priority === "high" ? "#f87171" : rec.priority === "medium" ? "var(--warning)" : "rgba(255,255,255,0.35)";
              return (
                <motion.div key={i} className="dash-rec-row" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05, duration: 0.26 }}>
                  <div className="dash-rec-row__header">
                    <span className="dash-rec-row__category">{rec.category}</span>
                    {rec.column && <span className="dash-rec-row__col">&quot;{rec.column}&quot;</span>}
                    <span className="dash-rec-row__priority" style={{ color: pColor }}>{rec.priority}</span>
                  </div>
                  <div className="dash-rec-row__issue">{rec.issue}</div>
                  <div className="dash-rec-row__action">{rec.action}</div>
                </motion.div>
              );
            })}
          </div>
          {(recommendations || []).length > 4 && (
            <button className="dash-recs-toggle" onClick={() => setRecsExpanded(!recsExpanded)}>
              {recsExpanded ? "Show less" : `Show ${recommendations.length - 4} more recommendation${recommendations.length - 4 > 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   COLUMN ROLE PILL
───────────────────────────────────────────── */
const ROLE_PILL = {
  numeric:     { label: "#",  cls: "dash-pill--neutral" },
  categorical: { label: "Aa", cls: "dash-pill--neutral" },
  binary:      { label: "01", cls: "dash-pill--success" },
  identifier:  { label: "ID", cls: "dash-pill--warning" },
  temporal:    { label: "◷",  cls: "dash-pill--info"    },
  target:      { label: "▶",  cls: "dash-pill--gold"    },
};

/* ─────────────────────────────────────────────
   NULL BADGE
───────────────────────────────────────────── */
function NullBadge() {
  return (
    <span style={{
      display:      "inline-flex",
      alignItems:   "center",
      fontSize:     "9px",
      fontWeight:   "600",
      fontFamily:   "monospace",
      color:        "rgba(245,158,11,0.85)",
      background:   "rgba(245,158,11,0.08)",
      border:       "1px solid rgba(245,158,11,0.18)",
      borderRadius: "4px",
      padding:      "1px 6px",
      letterSpacing: "0.04em",
    }}>
      null
    </span>
  );
}

/* ─────────────────────────────────────────────
   DATASET SNAPSHOT TABLE
───────────────────────────────────────────── */
function DatasetSnapshot({ snapshot }) {
  if (!snapshot?.rows?.length) return null;

  const { columns, rows } = snapshot;
  const visibleCols = columns.slice(0, 7);
  const hiddenCount = columns.length - visibleCols.length;

  return (
    <motion.div
      className="dash-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.35 }}
      style={{ marginBottom: "14px", padding: "0", overflow: "hidden" }}
    >
      {/* Card header */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        padding:        "16px 20px",
        borderBottom:   "1px solid rgba(255,255,255,0.06)",
      }}>
        <div className="dash-section-title" style={{ marginBottom: 0 }}>
          Dataset Preview
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {hiddenCount > 0 && (
            <span className="dash-pill dash-pill--neutral">+{hiddenCount} cols hidden</span>
          )}
          <span className="dash-pill dash-pill--neutral">First {rows.length} rows</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.02)" }}>
              {/* Row number header */}
              <th style={{
                padding:      "9px 14px",
                textAlign:    "right",
                fontSize:     "9px",
                fontWeight:   "600",
                color:        "rgba(255,255,255,0.18)",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                borderRight:  "1px solid rgba(255,255,255,0.06)",
                whiteSpace:   "nowrap",
                width:        "36px",
                userSelect:   "none",
              }}>
                #
              </th>
              {visibleCols.map(col => (
                <th key={col} style={{
                  padding:       "9px 14px",
                  textAlign:     "left",
                  fontSize:      "10px",
                  fontWeight:    "600",
                  color:         "rgba(255,255,255,0.45)",
                  borderBottom:  "1px solid rgba(255,255,255,0.08)",
                  borderRight:   "1px solid rgba(255,255,255,0.04)",
                  whiteSpace:    "nowrap",
                  letterSpacing: "0.04em",
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.08 + i * 0.025, duration: 0.2 }}
                style={{
                  background: i % 2 === 0
                    ? "transparent"
                    : "rgba(255,255,255,0.012)",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,175,55,0.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.012)"; }}
              >
                {/* Row number */}
                <td style={{
                  padding:     "7px 14px",
                  fontSize:    "10px",
                  color:       "rgba(255,255,255,0.18)",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  borderRight:  "1px solid rgba(255,255,255,0.06)",
                  textAlign:   "right",
                  userSelect:  "none",
                  fontFamily:  "monospace",
                }}>
                  {i + 1}
                </td>

                {visibleCols.map(col => {
                  const val    = row[col];
                  const isNull = val === null || val === undefined;
                  const str    = isNull ? "" : String(val);

                  return (
                    <td key={col} style={{
                      padding:      "7px 14px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      borderRight:  "1px solid rgba(255,255,255,0.03)",
                      whiteSpace:   "nowrap",
                      maxWidth:     "160px",
                      overflow:     "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {isNull
                        ? <NullBadge />
                        : <span style={{
                            color:      /^-?\d+(\.\d+)?$/.test(str)
                              ? "rgba(99,179,237,0.85)"
                              : "rgba(255,255,255,0.62)",
                            fontFamily: /^-?\d+(\.\d+)?$/.test(str) ? "monospace" : "inherit",
                            fontSize:   "12px",
                          }}>
                            {str.length > 20 ? str.slice(0, 20) + "…" : str}
                          </span>
                      }
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   NUMERIC SUMMARY CARD
───────────────────────────────────────────── */
function NumericSummaryCard({ meta }) {
  const items = [
    { label: "Total Rows",           value: meta.rows.toLocaleString()  },
    { label: "Total Columns",        value: meta.columns                },
    { label: "Numeric Features",     value: meta.numericCols.length     },
    { label: "Categorical Features", value: meta.categoricalCols.length },
    { label: "Identifier Columns",   value: meta.identifierCols.length  },
    { label: "Temporal Columns",     value: meta.temporalCols.length    },
    // Only show ML Task Type and Target Column when a target is set
    ...(meta.target ? [
      { label: "ML Task Type",   value: meta.datasetType, gold: true },
      { label: "Target Column",  value: meta.target,      gold: true },
    ] : []),
  ];

  return (
    <motion.div
      className="dash-card dash-card--gold"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.35 }}
      style={{ marginBottom: "14px" }}
    >
      <div className="dash-section-title">Dataset Summary</div>
      <div style={{
        display:             "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap:                 "16px",
      }}>
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.05, duration: 0.26 }}
          >
            <div className="dash-stat-label">{item.label}</div>
            <div className={`dash-stat-value${item.gold ? " dash-stat-value--gold" : ""}`}>
              {item.value ?? "—"}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   COLUMN ROLE LIST
───────────────────────────────────────────── */
function ColumnRoleList({ meta }) {
  const allCols = [
    ...(meta.target ? [{ col: meta.target, role: "target" }] : []),
    ...meta.numericCols.map(c     => ({ col: c, role: "numeric"     })),
    ...meta.categoricalCols.map(c => ({ col: c, role: "categorical" })),
    ...meta.identifierCols.map(c  => ({ col: c, role: "identifier"  })),
    ...(meta.temporalCols ?? []).map(c => ({ col: c, role: "temporal" })),
  ];

  const groups = [
    { role: "target",      label: "Target",      cols: allCols.filter(c => c.role === "target")      },
    { role: "numeric",     label: "Numeric",      cols: allCols.filter(c => c.role === "numeric")     },
    { role: "categorical", label: "Categorical",  cols: allCols.filter(c => c.role === "categorical") },
    { role: "identifier",  label: "Identifier",   cols: allCols.filter(c => c.role === "identifier")  },
    { role: "temporal",    label: "Temporal",     cols: allCols.filter(c => c.role === "temporal")    },
  ].filter(g => g.cols.length > 0);

  return (
    <motion.div
      className="dash-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22, duration: 0.35 }}
    >
      <div className="dash-section-title">Column Roles</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {groups.map((group, gi) => {
          const pill = ROLE_PILL[group.role] || ROLE_PILL.categorical;
          return (
            <div key={gi}>
              {/* Group label */}
              <div style={{
                fontSize:      "10px",
                fontWeight:    "600",
                color:         "rgba(255,255,255,0.22)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom:  "8px",
              }}>
                {group.label} ({group.cols.length})
              </div>
              {/* Columns grid */}
              <div style={{
                display:             "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap:                 "4px",
              }}>
                {group.cols.map((item, i) => (
                  <div key={i} style={{
                    display:      "flex",
                    alignItems:   "center",
                    gap:          "8px",
                    padding:      "6px 8px",
                    borderRadius: "7px",
                    background:   "rgba(255,255,255,0.02)",
                    border:       "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <span className={`dash-pill ${pill.cls}`} style={{ fontSize: "9px", padding: "2px 7px" }}>
                      {pill.label}
                    </span>
                    <span style={{
                      fontSize:     "12px",
                      color:        "rgba(255,255,255,0.60)",
                      overflow:     "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace:   "nowrap",
                    }}>
                      {item.col}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}


/* ─────────────────────────────────────────────
   HEALTH SCORE CARD — shown in Overview
───────────────────────────────────────────── */
function HealthScoreCard({ healthScore }) {
  if (!healthScore) return null;

  const { score, grade, breakdown, hasTarget } = healthScore;

  const scoreColor =
    score >= 90 ? "var(--success)"     :
    score >= 75 ? "#63b3ed"            :
    score >= 60 ? "var(--warning)"     :
    score >= 40 ? "rgba(251,146,60,1)" : "#f87171";

  const dims = [
    { key: "quality",         label: "Quality"       },
    { key: "structure",       label: "Structure"     },
    { key: "relationships",   label: "Relationships" },
    { key: "targetReadiness", label: "Target Ready"  },
  ].filter(d => hasTarget || d.key !== "targetReadiness");

  return (
    <motion.div
      className="dash-card dash-card--gold"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.07, duration: 0.35 }}
      style={{ marginBottom: "14px" }}
    >
      <div className="dash-section-title">Dataset Health Score</div>
      <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>

        {/* Score */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: "80px" }}>
          <div style={{ fontSize: "40px", fontWeight: "900", letterSpacing: "-0.05em", lineHeight: 1, color: scoreColor }}>
            {score}
          </div>
          <div style={{ fontSize: "12px", fontWeight: "700", color: scoreColor, marginTop: "4px" }}>{grade}</div>
          <div style={{ fontSize: "9px", fontWeight: "600", color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: "3px" }}>Health Score</div>
        </div>

        {/* Breakdown */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "9px" }}>
          {dims.map((d, i) => {
            const val = breakdown[d.key] ?? 0;
            const barColor = val >= 80 ? "var(--success)" : val >= 60 ? "var(--warning)" : "#f87171";
            return (
              <motion.div key={d.key} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + i * 0.06, duration: 0.28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "600", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.10em" }}>{d.label}</span>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: barColor }}>{val}</span>
                </div>
                <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${val}%` }}
                    transition={{ delay: 0.16 + i * 0.06, duration: 0.55, ease: "easeOut" }}
                    style={{ height: "100%", borderRadius: "2px", background: barColor }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function OverviewTab({ result }) {
  const { meta, snapshot, healthScore, insights, recommendations } = result;

  return (
    <div>
      <DatasetSnapshot snapshot={snapshot} />
      <HealthScoreCard healthScore={healthScore} />
      <NumericSummaryCard meta={meta} />
      <ColumnRoleList meta={meta} />
      <PriorityInsightsCard insights={insights} recommendations={recommendations} />
    </div>
  );
}

export default OverviewTab;
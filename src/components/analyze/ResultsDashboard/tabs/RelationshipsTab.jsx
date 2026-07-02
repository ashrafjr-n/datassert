import { useState } from "react";
import { motion }   from "framer-motion";

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function heatColor(v) {
  const abs = Math.abs(v);
  if (abs >= 0.9)  return v > 0 ? "rgba(212,175,55,0.90)" : "rgba(99,179,237,0.90)";
  if (abs >= 0.65) return v > 0 ? "rgba(212,175,55,0.55)" : "rgba(99,179,237,0.55)";
  if (abs >= 0.45) return v > 0 ? "rgba(212,175,55,0.28)" : "rgba(99,179,237,0.28)";
  if (abs >= 0.25) return v > 0 ? "rgba(212,175,55,0.12)" : "rgba(99,179,237,0.12)";
  return "rgba(255,255,255,0.04)";
}

/* ─────────────────────────────────────────────
   LEAKAGE WARNINGS
───────────────────────────────────────────── */
function LeakageWarnings({ suspects }) {
  if (!suspects?.length) return null;
  return (
    <div style={{ marginBottom: "14px" }}>
      {suspects.map((leak, i) => (
        <div key={i} className="dash-leakage-warning">
          <div className="dash-leakage-warning__icon">✕</div>
          <div>
            <div className="dash-leakage-warning__title">Possible Target Leakage</div>
            <div className="dash-leakage-warning__text">{leak.warning}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   DATASET-LEVEL OBSERVATIONS
───────────────────────────────────────────── */
function RelationshipObservations({ observations }) {
  if (!observations?.length) return null;
  return (
    <motion.div
      className="dash-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.32 }}
      style={{ marginBottom: "14px" }}
    >
      <div className="dash-section-title">Dataset Observations</div>
      {observations.map((obs, i) => (
        <div key={i} className="dash-rel-observation">
          <div className="dash-rel-observation__dot" />
          {obs}
        </div>
      ))}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   CORRELATION RANKING — with interpretations
───────────────────────────────────────────── */
function CorrelationRanking({ relationships }) {
  const { strongRelationships } = relationships;

  if (!strongRelationships.length) {
    return (
      <motion.div
        className="dash-card"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ textAlign: "center", padding: "28px", marginBottom: "14px" }}
      >
        <div className="dash-stat-label">No strong correlations found (|r| &gt; 0.4).</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="dash-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.35 }}
      style={{ marginBottom: "14px" }}
    >
      <div className="dash-section-title">
        Top Relationships — {strongRelationships.length} found
      </div>

      {strongRelationships.map((rel, i) => {
        const abs      = Math.abs(rel.correlation);
        const barPct   = Math.round(abs * 100);
        const isStrong = rel.strength === "strong" || rel.strength === "very strong";
        const isPos    = rel.correlation > 0;
        const isMC     = abs >= 0.9;
        const rColor   = isMC
          ? "#f87171"
          : isStrong ? (isPos ? "var(--gold)" : "#63b3ed") : "rgba(255,255,255,0.40)";
        const barBg = isMC
          ? "linear-gradient(90deg, #f87171, #ef4444)"
          : isStrong
            ? (isPos ? "linear-gradient(90deg, var(--gold), var(--gold-warm))" : "linear-gradient(90deg, #63b3ed, #4299e1)")
            : "rgba(255,255,255,0.22)";

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.28 }}
            style={{
              padding:      "12px 0",
              borderBottom: i < strongRelationships.length - 1
                ? "1px solid rgba(255,255,255,0.04)"
                : "none",
            }}
          >
            {/* Row 1: pair + bar + r value */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.18)", width: "16px", flexShrink: 0, textAlign: "right" }}>
                {i + 1}
              </span>
              <span style={{ fontSize: "12px", fontWeight: "500", color: "rgba(255,255,255,0.65)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {rel.col1}
                <span style={{ color: "rgba(255,255,255,0.22)", margin: "0 5px" }}>↔</span>
                {rel.col2}
              </span>
              <div style={{ width: "80px", height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden", flexShrink: 0 }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barPct}%` }}
                  transition={{ delay: 0.14 + i * 0.05, duration: 0.5, ease: "easeOut" }}
                  style={{ height: "100%", borderRadius: "2px", background: barBg }}
                />
              </div>
              <span style={{ fontSize: "12px", fontWeight: "700", color: rColor, minWidth: "46px", textAlign: "right", flexShrink: 0 }}>
                r = {rel.correlation.toFixed(2)}
              </span>
              <span className={`dash-pill ${isMC ? "dash-pill--warning" : isStrong ? (isPos ? "dash-pill--gold" : "dash-pill--neutral") : "dash-pill--neutral"}`} style={{ flexShrink: 0 }}>
                {isMC ? "redundant" : rel.strength}
              </span>
            </div>

            {/* Row 2: interpretation + confidence */}
            {rel.statement && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", paddingLeft: "28px" }}>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", flex: 1, fontStyle: "italic" }}>
                  {rel.statement}
                </span>
                {rel.confidence && (
                  <span className={`dash-rel-confidence dash-rel-confidence--${rel.confidence}`}>
                    {rel.confidence}
                  </span>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   CORRELATION HEATMAP — adaptive cell size
───────────────────────────────────────────── */
function CorrelationHeatmap({ relationships }) {
  const { cols, correlationMatrix } = relationships;
  const [tooltip, setTooltip] = useState(null);

  const cellSize = cols.length <= 4 ? 64 : cols.length <= 6 ? 54 : cols.length <= 8 ? 44 : 38;
  const labelW   = cols.length <= 4 ? 100 : cols.length <= 6 ? 88 : cols.length <= 8 ? 76 : 64;
  const fontSize = cols.length <= 6 ? "10px" : "9px";

  return (
    <motion.div
      className="dash-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.35 }}
      style={{ overflowX: "auto" }}
    >
      <div className="dash-section-title">Correlation Heatmap</div>

      <div style={{ display: "flex", paddingLeft: `${labelW}px`, marginBottom: "4px" }}>
        {cols.map(col => (
          <div key={col} style={{ width: `${cellSize}px`, flexShrink: 0, fontSize, color: "rgba(255,255,255,0.32)", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 2px" }}>
            {col.length > 6 ? col.slice(0, 5) + "…" : col}
          </div>
        ))}
      </div>

      {cols.map((rowCol, i) => (
        <div key={rowCol} style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
          <div style={{ width: `${labelW}px`, flexShrink: 0, fontSize, color: "rgba(255,255,255,0.32)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "8px", textAlign: "right" }}>
            {rowCol}
          </div>
          {cols.map((colCol, j) => {
            const key      = `${rowCol}||${colCol}`;
            const val      = correlationMatrix[key] ?? correlationMatrix[`${colCol}||${rowCol}`] ?? 0;
            const isActive = tooltip?.row === i && tooltip?.col === j;
            const isDiag   = rowCol === colCol;
            return (
              <motion.div
                key={colCol}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (i * cols.length + j) * 0.008, duration: 0.22 }}
                onMouseEnter={() => !isDiag && setTooltip({ row: i, col: j, val, rowCol, colCol })}
                onMouseLeave={() => setTooltip(null)}
                style={{
                  width: `${cellSize}px`, height: `${Math.round(cellSize * 0.6)}px`,
                  flexShrink: 0, borderRadius: "5px", background: heatColor(val),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "8px", fontWeight: "600",
                  color: isActive ? "rgba(255,255,255,0.95)" : "transparent",
                  cursor: isDiag ? "default" : "crosshair", margin: "0 2px",
                  transition: "transform 0.12s ease, box-shadow 0.12s ease",
                  transform: isActive ? "scale(1.1)" : "scale(1)",
                  boxShadow: isActive ? "0 0 0 1px rgba(255,255,255,0.18)" : "none",
                  outline: isDiag ? "1px solid rgba(255,255,255,0.08)" : "none",
                }}
              >
                {val.toFixed(2)}
              </motion.div>
            );
          })}
        </div>
      ))}

      {/* Legend + tooltip */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap", minHeight: "38px" }}>
        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.20)" }}>Legend:</span>
        {[
          { color: "rgba(212,175,55,0.90)", label: "Strong +"  },
          { color: "rgba(212,175,55,0.28)", label: "Moderate +" },
          { color: "rgba(99,179,237,0.55)", label: "Moderate −" },
          { color: "rgba(99,179,237,0.90)", label: "Strong −"  },
          { color: "rgba(255,255,255,0.04)", label: "Weak"     },
        ].map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "11px", height: "11px", borderRadius: "3px", background: l.color, flexShrink: 0 }} />
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>{l.label}</span>
          </div>
        ))}
        {tooltip && (
          <div style={{ marginLeft: "auto", fontSize: "12px", color: "rgba(255,255,255,0.50)", background: "rgba(255,255,255,0.04)", borderRadius: "7px", padding: "5px 12px" }}>
            <strong style={{ color: "var(--gold)" }}>{tooltip.rowCol}</strong>
            {" ↔ "}
            <strong style={{ color: "var(--gold)" }}>{tooltip.colCol}</strong>
            {" — r = "}
            <strong style={{ color: "rgba(255,255,255,0.85)" }}>{tooltip.val.toFixed(3)}</strong>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   RELATIONSHIPS TAB
───────────────────────────────────────────── */
function RelationshipsTab({ result }) {
  const { relationships } = result;
  const { cols } = relationships;

  if (!cols.length) {
    return (
      <div className="dash-card" style={{ textAlign: "center", padding: "40px" }}>
        <div className="dash-stat-label">Not enough numeric columns for relationship analysis.</div>
      </div>
    );
  }

  return (
    <div>
      <LeakageWarnings suspects={relationships.leakageSuspects} />
      <RelationshipObservations observations={relationships.observations} />
      <CorrelationRanking  relationships={relationships} />
      <CorrelationHeatmap  relationships={relationships} />
    </div>
  );
}

export default RelationshipsTab;
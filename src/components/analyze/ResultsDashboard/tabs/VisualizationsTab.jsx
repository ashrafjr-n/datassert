import { useState, useMemo } from "react";
import { motion }                        from "framer-motion";

// ─── Framer-Motion variants ────────────────────────────────────────────────────

const listVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.28 } },
};

/* ─────────────────────────────────────────────
   BOXPLOT — drawn with SVG
───────────────────────────────────────────── */

// Shown when all values are identical (no variance)
function FlatLine({ value }) {
  return (
    <div style={{ padding: "18px 0 10px" }}>
      <div style={{ position: "relative", height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px" }}>
        <div style={{
          position:     "absolute",
          left:         "50%",
          top:          "50%",
          transform:    "translate(-50%, -50%)",
          width:        "8px",
          height:       "8px",
          borderRadius: "50%",
          background:   "var(--gold)",
        }} />
      </div>
      <div style={{ textAlign: "center", marginTop: "12px", fontSize: "11px", color: "rgba(255,255,255,0.30)" }}>
        No variance — all values equal{" "}
        <span style={{ color: "var(--gold)", fontWeight: "600" }}>{value?.toLocaleString()}</span>
      </div>
    </div>
  );
}

function BoxPlot({ boxplot }) {
  const { min, max, q1, q3, median, mean, lowerFence, upperFence, outlierCount } = boxplot;

  // FIX: explicit no-variance guard — avoids a misleading single-line plot
  if (max === min) return <FlatLine value={min} />;

  const range = max - min;
  const toX   = v => Math.round(((v - min) / range) * 100);

  const fenceL = Math.max(min, lowerFence);
  const fenceR = Math.min(max, upperFence);

  const fL    = toX(fenceL);
  const fR    = toX(fenceR);
  const q1x   = toX(q1);
  const q3x   = toX(q3);
  const medX  = toX(median);
  const meanX = mean != null ? toX(mean) : null;

  return (
    <div>
      <svg
        viewBox="0 0 100 28"
        preserveAspectRatio="none"
        style={{ width: "100%", height: "56px", overflow: "visible" }}
      >
        {/* Whisker line */}
        <line x1={fL} y1="14" x2={fR} y2="14" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />

        {/* Whisker caps */}
        <line x1={fL} y1="9"  x2={fL} y2="19" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
        <line x1={fR} y1="9"  x2={fR} y2="19" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />

        {/* IQR box */}
        <rect
          x={q1x} y="7"
          width={q3x - q1x} height="14"
          fill="rgba(212,175,55,0.15)"
          stroke="rgba(212,175,55,0.45)"
          strokeWidth="0.8"
          rx="1"
        />

        {/* Median line */}
        <line x1={medX} y1="7" x2={medX} y2="21" stroke="var(--gold)" strokeWidth="1.4" />

        {/* Mean marker — diamond, only when provided */}
        {meanX != null && (
          <polygon
            points={`${meanX},5 ${meanX + 2},14 ${meanX},23 ${meanX - 2},14`}
            fill="rgba(255,255,255,0.55)"
            stroke="rgba(255,255,255,0.20)"
            strokeWidth="0.4"
          />
        )}
      </svg>

      {/* Labels */}
      <div style={{
        display:        "flex",
        justifyContent: "space-between",
        fontSize:       "10px",
        color:          "rgba(255,255,255,0.25)",
        marginTop:      "4px",
        flexWrap:       "wrap",
        gap:            "4px",
      }}>
        <span>{min.toLocaleString()}</span>
        <span style={{ color: "rgba(212,175,55,0.6)" }}>Q1 {q1.toLocaleString()}</span>
        <span style={{ color: "var(--gold)" }}>Median {median.toLocaleString()}</span>
        {mean != null && (
          <span style={{ color: "rgba(255,255,255,0.40)" }}>Mean {mean.toLocaleString()}</span>
        )}
        <span style={{ color: "rgba(212,175,55,0.6)" }}>Q3 {q3.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>

      {outlierCount > 0 && (
        <div style={{
          marginTop:    "10px",
          fontSize:     "11px",
          color:        "var(--warning)",
          background:   "rgba(245,158,11,0.07)",
          border:       "1px solid rgba(245,158,11,0.16)",
          borderRadius: "7px",
          padding:      "6px 12px",
          display:      "inline-block",
        }}>
          ⚠ {outlierCount} outlier{outlierCount > 1 ? "s" : ""} detected beyond fences
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   NUMERIC COLUMN VIEW
───────────────────────────────────────────── */
function NumericView({ vis }) {
  if (!vis?.histogram?.length) return null;

  const maxCount = vis.histogram.reduce((m, b) => Math.max(m, b.count), 1);

  return (
    <div>
      {/* Histogram */}
      <div className="dash-card" style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div className="dash-section-title" style={{ marginBottom: 0 }}>Distribution — Histogram</div>
          <span className="dash-pill dash-pill--neutral">Numeric</span>
        </div>

        {/* Bars — count label sits inside the flex column, never absolutely positioned */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "134px" }}>
          {vis.histogram.map((b, i) => {
            const heightPct = (b.count / maxCount) * 100;
            const isMax     = b.count === maxCount;
            return (
              <div
                key={b.bin}
                title={`${b.bin}: ${b.count.toLocaleString()}`}
                style={{
                  flex:           1,
                  display:        "flex",
                  flexDirection:  "column",
                  alignItems:     "center",
                  height:         "100%",
                  justifyContent: "flex-end",
                }}
              >
                {/* FIX: label is in-flow above the bar, not absolute — never clips */}
                <span style={{
                  fontSize:   "8px",
                  color:      isMax ? "var(--gold)" : "transparent",
                  marginBottom: "3px",
                  whiteSpace: "nowrap",
                  // reserve the space always so other bars don't shift
                  visibility: isMax ? "visible" : "hidden",
                }}>
                  {b.count.toLocaleString()}
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ delay: i * 0.03, duration: 0.45, ease: "easeOut" }}
                  style={{
                    width:        "100%",
                    background:   isMax ? "var(--gold)" : "rgba(212,175,55,0.35)",
                    borderRadius: "3px 3px 0 0",
                    minHeight:    b.count > 0 ? "3px" : "0",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* X axis labels */}
        <div style={{ display: "flex", gap: "3px", marginTop: "6px" }}>
          {vis.histogram.map(b => (
            <div key={b.bin} style={{
              flex:         1,
              fontSize:     "8px",
              color:        "rgba(255,255,255,0.22)",
              textAlign:    "center",
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
            }}>
              {b.bin.split("–")[0]}
            </div>
          ))}
        </div>
      </div>

      {/* Box Plot */}
      <div className="dash-card" style={{ marginBottom: "12px" }}>
        <div className="dash-section-title">Spread & Outliers — Box Plot</div>
        <BoxPlot boxplot={vis.boxplot} />
      </div>

      <InsightBanner text={vis.insight} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   CATEGORICAL COLUMN VIEW
───────────────────────────────────────────── */
function CategoricalView({ vis }) {
  // Progressive Disclosure: default = simple (pct only, single scale).
  // "Details" mode reveals rank position via hover tooltip.
  // One scale per visual element — no cognitive overload.
  // Rules of Hooks: every hook runs before the empty-data early return below.
  const [hoveredValue, setHoveredValue] = useState(null);

  const data = vis?.data;

  const totalCount = useMemo(
    () => (data ?? []).reduce((s, d) => s + d.count, 0) || 1,
    [data]
  );

  // Pre-compute sorted rank (1 = largest) — used only in hover tooltip
  const rankMap = useMemo(() => {
    const sorted = [...(data ?? [])].sort((a, b) => b.count - a.count);
    return Object.fromEntries(sorted.map((d, i) => [d.value, i + 1]));
  }, [data]);

  if (!data?.length) return null;

  const totalCategories = vis.data.length;

  return (
    <div>
      <div className="dash-card" style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
          <div className="dash-section-title" style={{ marginBottom: 0 }}>Category Distribution</div>
          <span className="dash-pill dash-pill--neutral">Categorical</span>
        </div>

        {/* Single-scale hint — no ambiguity */}
        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.20)", marginBottom: "14px" }}>
          Bar length = share of total dataset · hover for rank
        </div>

        <motion.div variants={listVariants} initial="hidden" animate="show">
          {vis.data.map((item, i) => {
            // Single source of truth: width AND label both from totalCount
            const pct        = Math.min(100, Math.max(0, (item.count / totalCount) * 100));
            const isTop      = rankMap[item.value] === 1;
            const isHovered  = hoveredValue === item.value;
            const rank       = rankMap[item.value];

            return (
              <motion.div
                key={item.value}
                variants={rowVariants}
                onMouseEnter={() => setHoveredValue(item.value)}
                onMouseLeave={() => setHoveredValue(null)}
                style={{ marginBottom: i < vis.data.length - 1 ? "10px" : 0 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", overflow: "hidden" }}>
                    <span style={{
                      fontSize:     "12px",
                      color:        isHovered ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.65)",
                      fontWeight:   "500",
                      overflow:     "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace:   "nowrap",
                      transition:   "color 0.15s ease",
                    }}>
                      {item.value}
                    </span>
                    {/* Progressive detail: rank badge appears on hover only */}
                    {isHovered && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          fontSize:     "10px",
                          fontWeight:   "600",
                          color:        isTop ? "var(--gold)" : "rgba(255,255,255,0.35)",
                          background:   isTop ? "rgba(212,175,55,0.10)" : "rgba(255,255,255,0.05)",
                          border:       `1px solid ${isTop ? "rgba(212,175,55,0.25)" : "rgba(255,255,255,0.08)"}`,
                          borderRadius: "5px",
                          padding:      "1px 7px",
                          whiteSpace:   "nowrap",
                          flexShrink:   0,
                        }}
                      >
                        #{rank} of {totalCategories}
                      </motion.span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}>
                    {/* Count — visible on hover only (progressive detail) */}
                    {isHovered && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                        style={{ fontSize: "11px", color: "rgba(255,255,255,0.28)" }}
                      >
                        {item.count.toLocaleString()}
                      </motion.span>
                    )}
                    <span style={{
                      fontSize:   "11px",
                      fontWeight: "600",
                      color:      isTop ? "var(--gold)" : "rgba(255,255,255,0.38)",
                      minWidth:   "42px",
                      textAlign:  "right",
                    }}>
                      {Math.round(pct * 10) / 10}%
                    </span>
                  </div>
                </div>

                {/* Bar — single scale (totalCount), colour = highlight only */}
                <div style={{ height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.1 + i * 0.04, duration: 0.5, ease: "easeOut" }}
                    style={{
                      height:       "100%",
                      borderRadius: "3px",
                      background:   isTop
                        ? "linear-gradient(90deg, var(--gold), var(--gold-warm))"
                        : isHovered
                          ? "rgba(255,255,255,0.38)"
                          : "rgba(255,255,255,0.22)",
                      transition:   "background 0.15s ease",
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <InsightBanner text={vis.insight} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   INSIGHT BANNER
───────────────────────────────────────────── */
function InsightBanner({ text }) {
  if (!text) return null;
  return (
    <div style={{
      display:      "flex",
      alignItems:   "flex-start",
      gap:          "10px",
      padding:      "12px 16px",
      background:   "rgba(212,175,55,0.04)",
      border:       "1px solid rgba(212,175,55,0.12)",
      borderRadius: "10px",
      fontSize:     "12px",
      color:        "rgba(255,255,255,0.50)",
      lineHeight:   "1.6",
    }}>
      <span style={{ color: "var(--gold)", flexShrink: 0 }}>◈</span>
      {text}
    </div>
  );
}

/* ─────────────────────────────────────────────
   COLUMN SELECTOR BUTTON
───────────────────────────────────────────── */
function ColButton({ label, isSelected, onClick, accent }) {
  const base = accent === "gold" ? "rgba(212,175,55" : "rgba(154,117,234";
  return (
    <button
      onClick={onClick}
      className="dash-col-btn"
      style={{
        background:   isSelected ? `${base},0.12)` : "rgba(255,255,255,0.04)",
        border:       `1px solid ${isSelected ? `${base},0.30)` : "rgba(255,255,255,0.08)"}`,
        borderRadius: "8px",
        padding:      "6px 14px",
        fontSize:     "12px",
        fontWeight:   isSelected ? "600" : "400",
        color:        isSelected
          ? (accent === "gold" ? "var(--gold)" : "#9a75ea")
          : "rgba(255,255,255,0.42)",
        cursor:     "pointer",
        transition: "all 0.18s ease",
      }}
    >
      {label}
    </button>
  );
}

/* ─────────────────────────────────────────────
   MAIN TAB
───────────────────────────────────────────── */
function VisualizationsTab({ result }) {
  const { visualizations } = result;

  // `selected` holds only the user's explicit pick. The column actually shown is
  // DERIVED during render (no effect): it falls back to the first available column
  // both on the first render, when visualizations arrives async, and when a new
  // dataset drops the previously-picked column.
  const [selected, setSelected] = useState("");

  const { numericVis, categoricalVis, vis, activeCol } = useMemo(() => {
    const active = visualizations.some(v => v.col === selected)
      ? selected
      : (visualizations[0]?.col ?? "");
    return {
      numericVis:     visualizations.filter(v => v.type === "numeric"),
      categoricalVis: visualizations.filter(v => v.type === "categorical"),
      vis:            visualizations.find(v => v.col === active) ?? null,
      activeCol:      active,
    };
  }, [visualizations, selected]);

  if (!visualizations.length) {
    return (
      <div className="dash-card" style={{ textAlign: "center", padding: "40px" }}>
        <div className="dash-stat-label">No columns available for visualization.</div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Column selector — grouped ── */}
      <div style={{ marginBottom: "24px" }}>
        {numericVis.length > 0 && (
          <div style={{ marginBottom: "10px" }}>
            <div style={{
              fontSize: "10px", color: "rgba(255,255,255,0.22)", fontWeight: "600",
              textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px",
            }}>
              Numeric ({numericVis.length})
            </div>
            <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
              {numericVis.map(v => (
                <ColButton key={v.col} label={v.col} isSelected={activeCol === v.col}
                  onClick={() => setSelected(v.col)} accent="gold" />
              ))}
            </div>
          </div>
        )}

        {categoricalVis.length > 0 && (
          <div>
            <div style={{
              fontSize: "10px", color: "rgba(255,255,255,0.22)", fontWeight: "600",
              textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px",
            }}>
              Categorical ({categoricalVis.length})
            </div>
            <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
              {categoricalVis.map(v => (
                <ColButton key={v.col} label={v.col} isSelected={activeCol === v.col}
                  onClick={() => setSelected(v.col)} accent="purple" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Chart view ── */}
      {vis && (
        <motion.div
          key={activeCol}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
        >
          {vis.type === "numeric"     && <NumericView     vis={vis} />}
          {vis.type === "categorical" && <CategoricalView vis={vis} />}
        </motion.div>
      )}
    </div>
  );
}

export default VisualizationsTab;
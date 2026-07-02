import { motion, useInView } from "framer-motion";
import { useRef, useState  } from "react";

const FEATURES = [
  {
    id:      "quality",
    icon:    "◈",
    label:   "Data Quality",
    title:   "Know if your data is usable before you do anything.",
    stat:    "91",
    statSub: "avg quality score",
    tags:    ["Missing values", "Duplicates", "Constant columns", "ID detection"],
    color:   "gold",
  },
  {
    id:      "relationships",
    icon:    "⬡",
    label:   "Relationships",
    title:   "Find what correlates. Automatically.",
    stat:    "r²",
    statSub: "Pearson — pairwise",
    tags:    ["Correlation matrix", "Ranked pairs", "Interactive heatmap"],
    color:   "blue",
  },
  {
    id:      "statistics",
    icon:    "▦",
    label:   "Statistics",
    title:   "See the shape of every column.",
    stat:    "18+",
    statSub: "stats per column",
    tags:    ["Histograms", "Box plots", "Skewness", "IQR outliers"],
    color:   "purple",
  },
  {
    id:      "balance",
    icon:    "◐",
    label:   "Class Balance",
    title:   "Catch imbalance before it ruins your model.",
    stat:    "70%",
    statSub: "imbalance threshold",
    tags:    ["Distribution bars", "Imbalance flag", "SMOTE recommendation"],
    color:   "warning",
  },
];

const COLOR_MAP = {
  gold:    { accent: "rgba(212,175,55,1)",   bg: "rgba(212,175,55,0.07)",  border: "rgba(212,175,55,0.18)"  },
  blue:    { accent: "rgba(99,179,237,1)",   bg: "rgba(99,179,237,0.07)", border: "rgba(99,179,237,0.18)"  },
  purple:  { accent: "rgba(154,117,234,1)",  bg: "rgba(154,117,234,0.07)",border: "rgba(154,117,234,0.18)" },
  warning: { accent: "rgba(245,158,11,1)",   bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.18)"  },
};

function FeatureCard({ feat, i, active, onHover }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const c      = COLOR_MAP[feat.color];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: i * 0.09, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => onHover(feat.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        background:    active ? c.bg : "rgba(255,255,255,0.02)",
        border:        `1px solid ${active ? c.border : "rgba(255,255,255,0.07)"}`,
        borderRadius:  "18px",
        padding:       "28px",
        cursor:        "default",
        transition:    "background 0.22s ease, border-color 0.22s ease, transform 0.22s ease",
        transform:     active ? "translateY(-4px)" : "translateY(0)",
        position:      "relative",
        overflow:      "hidden",
      }}
    >
      {/* Top shimmer line on hover */}
      <div style={{
        position:   "absolute",
        top:        0,
        left:       "10%",
        right:      "10%",
        height:     "1px",
        background: active
          ? `linear-gradient(90deg, transparent, ${c.accent}, transparent)`
          : "transparent",
        transition: "background 0.22s ease",
      }} />

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{
          width:          "40px",
          height:         "40px",
          borderRadius:   "11px",
          background:     active ? c.bg : "rgba(255,255,255,0.05)",
          border:         `1px solid ${active ? c.border : "rgba(255,255,255,0.08)"}`,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontSize:       "17px",
          color:          active ? c.accent : "rgba(255,255,255,0.35)",
          transition:     "all 0.22s ease",
          flexShrink:     0,
        }}>
          {feat.icon}
        </div>

        {/* Stat */}
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontSize:      "22px",
            fontWeight:    "800",
            letterSpacing: "-0.04em",
            color:         active ? c.accent : "rgba(255,255,255,0.25)",
            transition:    "color 0.22s ease",
            lineHeight:    1,
          }}>
            {feat.stat}
          </div>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.22)", marginTop: "3px" }}>
            {feat.statSub}
          </div>
        </div>
      </div>

      {/* Label */}
      <div style={{
        fontSize:      "10px",
        fontWeight:    "700",
        color:         active ? c.accent : "rgba(255,255,255,0.28)",
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        marginBottom:  "8px",
        transition:    "color 0.22s ease",
      }}>
        {feat.label}
      </div>

      {/* Title */}
      <h3 style={{
        fontSize:      "15px",
        fontWeight:    "600",
        color:         active ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.55)",
        lineHeight:    "1.45",
        letterSpacing: "-0.015em",
        marginBottom:  "20px",
        transition:    "color 0.22s ease",
      }}>
        {feat.title}
      </h3>

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {feat.tags.map((tag, ti) => (
          <span key={ti} style={{
            fontSize:     "10px",
            fontWeight:   "500",
            color:        active ? c.accent : "rgba(255,255,255,0.28)",
            background:   active ? c.bg : "rgba(255,255,255,0.04)",
            border:       `1px solid ${active ? c.border : "rgba(255,255,255,0.07)"}`,
            borderRadius: "6px",
            padding:      "3px 9px",
            transition:   "all 0.22s ease",
            letterSpacing: "0.04em",
          }}>
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function ProblemSolution() {
  const [active,   setActive]   = useState(null);
  const titleRef    = useRef(null);
  const titleInView = useInView(titleRef, { once: true });

  return (
    <section className="ps-section">
      <div className="ps-inner">

        {/* Header */}
        <motion.div
          ref={titleRef}
          className="ps-header"
          initial={{ opacity: 0, y: 20 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="ps-header__eyebrow">
            <span className="ps-header__eyebrow-line" />
            What Datassert surfaces
            <span className="ps-header__eyebrow-line" />
          </div>
          <h2 className="ps-header__headline">
            Everything hidden in your data.
            <br />
            <span className="ps-header__headline--gold">Made visible.</span>
          </h2>
        </motion.div>

        {/* 2×2 Grid */}
        <div style={{
          display:             "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap:                 "14px",
        }}>
          {FEATURES.map((feat, i) => (
            <FeatureCard
              key={feat.id}
              feat={feat}
              i={i}
              active={active === feat.id}
              onHover={setActive}
            />
          ))}
        </div>

      </div>
    </section>
  );
}

export default ProblemSolution;
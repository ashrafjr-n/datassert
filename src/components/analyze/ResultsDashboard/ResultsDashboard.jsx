import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import "./dashboard.css";
import OverviewTab       from "./tabs/OverviewTab";
import QualityTab        from "./tabs/QualityTab";
import StatisticsTab     from "./tabs/StatisticsTab";
import VisualizationsTab from "./tabs/VisualizationsTab";
import RelationshipsTab  from "./tabs/RelationshipsTab";
import ClassBalanceTab   from "./tabs/ClassBalanceTab";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const BASE_TABS = [
  { id: "overview",       label: "Overview"                            },
  { id: "quality",        label: "Quality"                             },
  { id: "statistics",     label: "Statistics"                          },
  { id: "visualizations", label: "Visualizations"                      },
  { id: "relationships",  label: "Relationships"                       },
  { id: "classbalance",   label: "Class Balance", requiresTarget: true },
];

const SEVERITY_CONFIG = {
  critical: { icon: "✕", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.22)",   color: "#f87171",        label: "Critical" },
  warning:  { icon: "⚠", bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.20)",  color: "var(--warning)", label: "Warning"  },
  info:     { icon: "◈", bg: "rgba(99,179,237,0.06)",  border: "rgba(99,179,237,0.16)",  color: "#63b3ed",        label: "Info"     },
  success:  { icon: "✓", bg: "rgba(74,222,128,0.06)",  border: "rgba(74,222,128,0.16)",  color: "var(--success)", label: "Good"     },
};

/* ─────────────────────────────────────────────
   HEALTH SCORE BADGE
───────────────────────────────────────────── */
function HealthScoreBadge({ healthScore }) {
  if (!healthScore) return null;

  const { score, grade, breakdown } = healthScore;

  const scoreColor =
    score >= 90 ? "var(--success)"  :
    score >= 75 ? "#63b3ed"         :
    score >= 60 ? "var(--warning)"  :
    score >= 40 ? "rgba(251,146,60,1)" : "#f87171";

  const dims = [
    { key: "quality",         label: "Quality"      },
    { key: "structure",       label: "Structure"    },
    { key: "relationships",   label: "Relationships"},
    { key: "targetReadiness", label: "Target"       },
  ];

  return (
    <motion.div
      className="dash-card dash-health-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.38 }}
    >
      <div className="dash-health-card__row">
        {/* Score circle */}
        <div className="dash-health-card__score-wrap">
          <div className="dash-health-card__score" style={{ color: scoreColor }}>
            {score}
          </div>
          <div className="dash-health-card__grade" style={{ color: scoreColor }}>
            {grade}
          </div>
          <div className="dash-health-card__sublabel">Health Score</div>
        </div>

        {/* Breakdown bars */}
        <div className="dash-health-card__breakdown">
          {dims.map((d, i) => {
            if (!healthScore.hasTarget && d.key === "targetReadiness") return null;
            const val = breakdown[d.key] ?? 0;
            const barColor =
              val >= 80 ? "var(--success)" :
              val >= 60 ? "var(--warning)" : "#f87171";

            return (
              <motion.div
                key={d.key}
                className="dash-health-dim"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.14 + i * 0.06, duration: 0.3 }}
              >
                <div className="dash-health-dim__header">
                  <span className="dash-health-dim__label">{d.label}</span>
                  <span className="dash-health-dim__val" style={{ color: barColor }}>{val}</span>
                </div>
                <div className="dash-health-dim__track">
                  <motion.div
                    className="dash-health-dim__fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${val}%` }}
                    transition={{ delay: 0.18 + i * 0.06, duration: 0.55, ease: "easeOut" }}
                    style={{ background: barColor }}
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

/* ─────────────────────────────────────────────
   PRIORITY INSIGHTS
───────────────────────────────────────────── */
function PriorityInsightsStrip({ insights }) {
  if (!insights?.length) return null;

  const problems  = insights.filter(i => i.severity === "critical" || i.severity === "warning");
  const positives = insights.filter(i => i.severity === "success");
  const infos     = insights.filter(i => i.severity === "info");

  const renderInsight = (insight, i) => {
    const cfg = SEVERITY_CONFIG[insight.severity] || SEVERITY_CONFIG.info;
    return (
      <motion.div
        key={i}
        className="dash-insight-row"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.38 + i * 0.05, duration: 0.28 }}
      >
        <div className="dash-insight-row__icon" style={{ color: cfg.color, background: `${cfg.bg}` }}>
          {cfg.icon}
        </div>
        <div className="dash-insight-row__body">
          <div className="dash-insight-row__title" style={{ color: cfg.color }}>
            {insight.title}
          </div>
          <div className="dash-insight-row__text">{insight.text}</div>
        </div>
        <div className="dash-insight-row__badge" style={{ color: cfg.color, borderColor: cfg.border }}>
          {cfg.label}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      className="dashboard-insights"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.32, duration: 0.4 }}
    >
      <div className="dashboard-insights__header">
        <div className="dashboard-insights__title">Priority Insights</div>
        <div className="dashboard-insights__counts">
          {problems.filter(i => i.severity === "critical").length > 0 && (
            <span className="dash-count-badge dash-count-badge--critical">
              {problems.filter(i => i.severity === "critical").length} critical
            </span>
          )}
          {problems.filter(i => i.severity === "warning").length > 0 && (
            <span className="dash-count-badge dash-count-badge--warning">
              {problems.filter(i => i.severity === "warning").length} warnings
            </span>
          )}
        </div>
      </div>

      {/* Problems first */}
      {problems.length > 0 && (
        <div className="dash-insights-group">
          <div className="dash-insights-group__label">Issues to address</div>
          <div className="dash-insights-group__list">
            {problems.map(renderInsight)}
          </div>
        </div>
      )}

      {/* Info observations */}
      {infos.length > 0 && (
        <div className="dash-insights-group">
          <div className="dash-insights-group__label">Observations</div>
          <div className="dash-insights-group__list">
            {infos.map(renderInsight)}
          </div>
        </div>
      )}

      {/* Strengths */}
      {positives.length > 0 && (
        <div className="dash-insights-group">
          <div className="dash-insights-group__label">Strengths</div>
          <div className="dash-insights-group__list">
            {positives.map(renderInsight)}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   SMART RECOMMENDATIONS STRIP
───────────────────────────────────────────── */
function RecommendationsStrip({ recommendations }) {
  const [expanded, setExpanded] = useState(false);
  if (!recommendations?.length) return null;

  const highRecs = recommendations.filter(r => r.priority === "high");
  const shown    = expanded ? recommendations : recommendations.slice(0, 4);

  return (
    <motion.div
      className="dashboard-insights"
      style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
    >
      <div className="dashboard-insights__header">
        <div className="dashboard-insights__title">Recommendations</div>
        {highRecs.length > 0 && (
          <span className="dash-count-badge dash-count-badge--critical">
            {highRecs.length} high priority
          </span>
        )}
      </div>

      <div className="dash-recs-list">
        {shown.map((rec, i) => {
          const priorityColor =
            rec.priority === "high"   ? "#f87171"         :
            rec.priority === "medium" ? "var(--warning)"  : "rgba(255,255,255,0.35)";

          return (
            <motion.div
              key={i}
              className="dash-rec-row"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.52 + i * 0.05, duration: 0.28 }}
            >
              <div className="dash-rec-row__left">
                <div className="dash-rec-row__header">
                  <span className="dash-rec-row__category">{rec.category}</span>
                  {rec.column && (
                    <span className="dash-rec-row__col">"{rec.column}"</span>
                  )}
                  <span className="dash-rec-row__priority" style={{ color: priorityColor }}>
                    {rec.priority}
                  </span>
                </div>
                <div className="dash-rec-row__issue">{rec.issue}</div>
                <div className="dash-rec-row__action">{rec.action}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {recommendations.length > 4 && (
        <button
          className="dash-recs-toggle"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? "Show less"
            : `Show ${recommendations.length - 4} more recommendation${recommendations.length - 4 > 1 ? "s" : ""}`}
        </button>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   RESULTS DASHBOARD
───────────────────────────────────────────── */
function ResultsDashboard({ result, onReset }) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!result) return null;

  const { meta, quality, insights, healthScore, recommendations } = result;
  const tabs = BASE_TABS.filter(t => !t.requiresTarget || !!meta.target);

  return (
    <div className="dashboard-page">

      {/* ── Hero Bar ── */}
      <div className="dashboard-hero">
        <div className="dashboard-hero__inner">

          {/* Top row */}
          <div className="dashboard-hero__top">
            <div className="dashboard-hero__title-wrap">
              <div className="dashboard-hero__badge">✓</div>
              <div>
                <div className="dashboard-hero__title">Dataset Analysis Complete</div>
                <div className="dashboard-hero__subtitle">
                  {meta.target
                    ? <>Target: <strong style={{ color: "var(--gold)" }}>{meta.target}</strong>&nbsp;·&nbsp;{meta.datasetType}</>
                    : <span style={{ color: "rgba(255,255,255,0.30)" }}>No target selected · Exploratory analysis</span>
                  }
                </div>
              </div>
            </div>

            <button className="dashboard-hero__reset" onClick={onReset}>
              ↩ New Analysis
            </button>
          </div>

          {/* KPI strip */}
          <motion.div
            className="dashboard-kpi-strip"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            {[
              { label: "Rows",          value: meta.rows.toLocaleString()            },
              { label: "Columns",       value: meta.columns                          },
              { label: "Missing",       value: quality.missingCells.toLocaleString() },
              { label: "Duplicates",    value: quality.duplicatesComputed ? quality.duplicateRows : "Skipped",
                                        title: quality.duplicatesComputed ? undefined : "Duplicate check skipped on datasets over 50,000 rows." },
              { label: "Health Score",  value: healthScore?.score ?? quality.qualityScore, suffix: "/100", quality: true },
            ].map((k, i) => (
              <motion.div
                key={i}
                className={`dashboard-kpi-card${k.quality ? " dashboard-kpi-card--quality" : ""}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.06, duration: 0.35 }}
              >
                <div className="dashboard-kpi-card__label">{k.label}</div>
                <div className="dashboard-kpi-card__value" title={k.title}>
                  {k.value}
                  {k.suffix && <span className="dashboard-kpi-card__suffix">{k.suffix}</span>}
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="dashboard-tabs">
        <div className="dashboard-tabs__inner">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`dashboard-tab${activeTab === tab.id ? " dashboard-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="dashboard-inner">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            className="dashboard-tab-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {activeTab === "overview"       && <OverviewTab       result={result} />}
            {activeTab === "quality"        && <QualityTab        result={result} />}
            {activeTab === "statistics"     && <StatisticsTab     result={result} />}
            {activeTab === "visualizations" && <VisualizationsTab result={result} />}
            {activeTab === "relationships"  && <RelationshipsTab  result={result} />}
            {activeTab === "classbalance"   && <ClassBalanceTab   result={result} />}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}

export default ResultsDashboard;
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

/* ─────────────────────────────────────────────
   RESULTS DASHBOARD
───────────────────────────────────────────── */
function ResultsDashboard({ result, onReset }) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!result) return null;

  const { meta, quality, healthScore } = result;
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
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";

import StatTile from "../shared/StatTile.jsx";
import OverviewTab       from "./tabs/OverviewTab.jsx";
import QualityTab        from "./tabs/QualityTab.jsx";
import StatisticsTab     from "./tabs/StatisticsTab.jsx";
import VisualizationsTab from "./tabs/VisualizationsTab.jsx";
import RelationshipsTab  from "./tabs/RelationshipsTab.jsx";
import ClassBalanceTab   from "./tabs/ClassBalanceTab.jsx";

const BASE_TABS = [
  { id: "overview",       label: "Overview"                            },
  { id: "quality",        label: "Quality"                             },
  { id: "statistics",     label: "Statistics"                          },
  { id: "visualizations", label: "Visualizations"                      },
  { id: "relationships",  label: "Relationships"                       },
  { id: "classbalance",   label: "Class Balance", requiresTarget: true },
];

function ResultsDashboard({ result, onReset }) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!result) return null;

  const { meta, quality, healthScore } = result;
  const tabs = BASE_TABS.filter((t) => !t.requiresTarget || !!meta.target);
  const healthTone = healthScore
    ? healthScore.score >= 80 ? "success" : healthScore.score >= 60 ? "warning" : "critical"
    : "ink";

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-16 pt-8 sm:px-12">

      {/* Scope row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
        <div className="text-[13px] text-ink-soft">
          {meta.target ? (
            <>Target <span className="font-mono font-medium text-ink">{meta.target}</span> · {meta.datasetType}</>
          ) : (
            "No target selected · Exploratory analysis"
          )}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-soft hover:text-ink"
        >
          <RotateCcw size={13} />
          New analysis
        </button>
      </div>

      {/* KPI strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      >
        <StatTile label="Rows" value={meta.rows.toLocaleString()} />
        <StatTile label="Columns" value={meta.columns} />
        <StatTile
          label="Missing cells"
          value={quality.missingCells.toLocaleString()}
          tone={quality.missingCells > 0 ? "warning" : "success"}
        />
        <StatTile
          label="Duplicate rows"
          value={quality.duplicatesComputed ? quality.duplicateRows.toLocaleString() : "Skipped"}
          tone={!quality.duplicatesComputed ? "ink" : quality.duplicateRows > 0 ? "warning" : "success"}
        />
        <StatTile label="Quality score" value={quality.qualityScore} suffix="/100" />
        <StatTile
          label="Health score"
          value={healthScore?.score ?? quality.qualityScore}
          suffix="/100"
          tone={healthTone}
        />
      </motion.div>

      {/* Tab nav + content */}
      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">

        <nav className="flex gap-1 overflow-x-auto border-b border-line pb-2 lg:w-[200px] lg:shrink-0 lg:flex-col lg:gap-0.5 lg:border-b-0 lg:border-r lg:border-line lg:pb-0 lg:pr-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-md px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-gold-tint text-gold-ink"
                  : "text-ink-soft hover:bg-paper-sunken hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
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

    </div>
  );
}

export default ResultsDashboard;

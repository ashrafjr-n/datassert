import { useState, useEffect } from "react";
import { useLocation }         from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import Header           from "../components/layout/Header.jsx";
import UploadStep       from "../components/analyze/UploadStep/UploadStep.jsx";
import TargetStep       from "../components/analyze/TargetStep/TargetStep.jsx";
import ProcessingStep   from "../components/analyze/ProcessingStep/ProcessingStep.jsx";
import ResultsDashboard from "../components/analyze/ResultsDashboard/ResultsDashboard.jsx";

import { analyzeDataset, detectTarget, detectColumnRoles, generateSampleData }
  from "../components/utils/core/index.js";

/* ─────────────────────────────────────────────
   STEP TRANSITION VARIANTS
───────────────────────────────────────────── */
const stepVariants = {
  initial:  { opacity: 0, y: 24 },
  animate:  { opacity: 1, y: 0,  transition: { duration: 0.4, ease: "easeOut" } },
  exit:     { opacity: 0, y: -16, transition: { duration: 0.28, ease: "easeIn" } },
};

/* ─────────────────────────────────────────────
   ANALYZE PAGE
───────────────────────────────────────────── */
function Analyze() {
  const location = useLocation();

  const [step,           setStep]           = useState(0);
  const [csvData,        setCsvData]        = useState(null);
  const [columns,        setColumns]        = useState([]);
  const [target,         setTarget]         = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);

  /* ── Sample mode: load instantly at step 3 ── */
  useEffect(() => {
    const isSample = new URLSearchParams(location.search).get("sample");
    if (!isSample) return;

    const { data, columns: cols } = generateSampleData();
    const detectedTarget          = detectTarget(cols, data);
    const result                  = analyzeDataset(data, cols, detectedTarget);

    setCsvData(data);
    setColumns(cols);
    setTarget(detectedTarget);
    setAnalysisResult(result);
    setStep(3);
  }, []);

  /* ── Step 0 → 1: CSV parsed ── */
  const handleUploadComplete = (data, cols) => {
    setCsvData(data);
    setColumns(cols);
    const auto = detectTarget(cols, data);
    setTarget(auto);
    setStep(1);
  };

  /* ── Step 1 → 2: target confirmed ── */
  const handleTargetConfirmed = (selectedTarget) => {
    setTarget(selectedTarget);
    setStep(2);
  };

  /* ── Step 2 → 3: analysis done ── */
  const handleAnalysisComplete = () => {
    const result = analyzeDataset(csvData, columns, target);
    setAnalysisResult(result);
    setStep(3);
  };

  /* ── Reset to start ── */
  const handleReset = () => {
    setCsvData(null);
    setColumns([]);
    setTarget("");
    setAnalysisResult(null);
    setStep(0);
  };

  return (
    <div style={{
      minHeight:       "100vh",
      width:           "100%",
      display:         "flex",
      flexDirection:   "column",
      background:      "var(--surface-base)",
      color:           "var(--text-primary)",
    }}>
      <Header />

      <main style={{
        flex: 1,
        width: "100%",
        }}>
        <AnimatePresence mode="wait">

          {step === 0 && (
            <motion.div key="upload" {...stepVariants}>
              <UploadStep onComplete={handleUploadComplete} />
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="target" {...stepVariants}>
              <TargetStep
                columns={columns}
                csvData={csvData}
                initialTarget={target}
                onConfirm={handleTargetConfirmed}
                onBack={() => setStep(0)}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="processing" {...stepVariants}>
              <ProcessingStep
                csvData={csvData}
                columns={columns}
                target={target}
                onComplete={handleAnalysisComplete}
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="results" {...stepVariants}>
              <ResultsDashboard
                result={analysisResult}
                onReset={handleReset}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

export default Analyze;
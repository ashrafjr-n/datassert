import { useEffect, useRef } from "react";
import { motion, useInView  } from "framer-motion";
import { useNavigate }        from "react-router-dom";
import "./cta-final.css";

/* ─────────────────────────────────────────────
   DATA LINES — visual metaphor for transformation
───────────────────────────────────────────── */
const RAW_LINES = [
  { w: "42%", o: 0.18 }, { w: "68%", o: 0.12 }, { w: "31%", o: 0.20 },
  { w: "55%", o: 0.14 }, { w: "73%", o: 0.10 }, { w: "47%", o: 0.16 },
  { w: "61%", o: 0.13 }, { w: "38%", o: 0.19 }, { w: "52%", o: 0.11 },
];

const INSIGHT_SIGNALS = [
  { label: "Quality Score", value: "91/100", gold: true,    delay: 0.4  },
  { label: "Relationships", value: "3 found", gold: false,  delay: 0.55 },
  { label: "Outliers",      value: "12",      gold: false,  delay: 0.7  },
  { label: "Class Balance", value: "Balanced", gold: false, delay: 0.85 },
];

function CtaFinal() {
  const ref      = useRef(null);
  const inView   = useInView(ref, { once: true, margin: "-80px" });
  const navigate = useNavigate();

  return (
    <section ref={ref} className="ctaf-section">

      {/* Top separator line */}
      <div className="ctaf-sep" />

      {/* Background — diagonal stripes */}
      <div className="ctaf-stripes" />

      <div className="ctaf-inner">

        {/* ── Visual centerpiece ── */}
        <motion.div
          className="ctaf-visual"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
        >
          {/* Raw data side */}
          <div className="ctaf-visual__raw">
            <div className="ctaf-visual__raw-label">Raw CSV</div>
            <div className="ctaf-visual__lines">
              {RAW_LINES.map((l, i) => (
                <motion.div
                  key={i}
                  className="ctaf-visual__line"
                  style={{ width: l.w, opacity: l.o }}
                  initial={{ scaleX: 0 }}
                  animate={inView ? { scaleX: 1 } : {}}
                  transition={{ delay: 0.1 + i * 0.04, duration: 0.5, ease: "easeOut" }}
                />
              ))}
            </div>
          </div>

          {/* Arrow — transformation */}
          <motion.div
            className="ctaf-visual__arrow"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={inView ? { opacity: 1, scaleX: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
          >
            <div className="ctaf-visual__arrow-line" />
            <div className="ctaf-visual__arrow-head" />
          </motion.div>

          {/* Insight signals */}
          <div className="ctaf-visual__signals">
            <div className="ctaf-visual__signals-label">Datassert Analysis</div>
            {INSIGHT_SIGNALS.map((s, i) => (
              <motion.div
                key={i}
                className={`ctaf-signal${s.gold ? " ctaf-signal--gold" : ""}`}
                initial={{ opacity: 0, x: 16 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: s.delay, duration: 0.45, ease: "easeOut" }}
              >
                <span className="ctaf-signal__label">{s.label}</span>
                <span className="ctaf-signal__value">{s.value}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Text + CTA ── */}
        <div className="ctaf-content">
          <motion.h2
            className="ctaf-headline"
            initial={{ opacity: 0, y: 22 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            Know your data,<br />
            <span className="ctaf-headline--gold">Then trust your decisions.</span>
          </motion.h2>

          <motion.p
            className="ctaf-sub"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.45, duration: 0.5 }}
          >
            Upload any dataset. Datassert tells you what it contains,
            what it's missing, and what it's trying to show you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6, duration: 0.45 }}
          >
            <button
              className="ctaf-btn"
              onClick={() => navigate("/analyze")}
            >
              Analyze your dataset
              <span className="ctaf-btn__arrow">→</span>
            </button>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

export default CtaFinal;
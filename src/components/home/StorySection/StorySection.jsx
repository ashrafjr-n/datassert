import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./story.css";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────
   DATA INGREDIENTS
───────────────────────────────────────────── */

const CHAOS_PARTICLES = [
  { val: "23",       x: "9%",  y: "15%", type: "num"  },
  { val: "M",        x: "20%", y: "32%", type: "cat"  },
  { val: "null",     x: "31%", y: "9%",  type: "null" },
  { val: "87432",    x: "44%", y: "24%", type: "num"  },
  { val: "Sales",    x: "57%", y: "13%", type: "cat"  },
  { val: "0.74",     x: "69%", y: "20%", type: "num"  },
  { val: "NaN",      x: "79%", y: "32%", type: "null" },
  { val: "true",     x: "87%", y: "17%", type: "bin"  },
  { val: "1994",     x: "13%", y: "48%", type: "num"  },
  { val: "Eng",      x: "33%", y: "54%", type: "cat"  },
  { val: "null",     x: "50%", y: "62%", type: "null" },
  { val: "3.2",      x: "62%", y: "44%", type: "num"  },
  { val: "HR",       x: "73%", y: "57%", type: "cat"  },
  { val: "false",    x: "84%", y: "50%", type: "bin"  },
  { val: "105k",     x: "22%", y: "72%", type: "num"  },
  { val: "5",        x: "40%", y: "80%", type: "num"  },
  { val: "Senior",   x: "54%", y: "75%", type: "cat"  },
  { val: "NaN",      x: "66%", y: "83%", type: "null" },
  { val: "1",        x: "77%", y: "74%", type: "bin"  },
  { val: "42",       x: "89%", y: "67%", type: "num"  },
  { val: "Remote",   x: "6%",  y: "82%", type: "cat"  },
  { val: "0",        x: "91%", y: "87%", type: "bin"  },
  { val: "2019",     x: "46%", y: "90%", type: "num"  },
  { val: "null",     x: "16%", y: "91%", type: "null" },
];

const HIST_BARS = [
  { h: 18 }, { h: 32 }, { h: 54 }, { h: 78 }, { h: 96 },
  { h: 88 }, { h: 72 }, { h: 55 }, { h: 38 }, { h: 24 },
  { h: 14 }, { h: 8  },
];

const BOX = { q1: 28, median: 52, q3: 74, outliers: [3, 97, 102] };

const HM_SIZE = 8;
const HM_LABELS = ["age", "salary", "exp", "score", "hours", "churn", "remote", "edu"];
const HM_DATA = [
  [1.0,  0.72, 0.58, 0.31, 0.12, 0.24, 0.08, 0.19],
  [0.72, 1.0,  0.61, 0.44, 0.21, 0.48, 0.15, 0.33],
  [0.58, 0.61, 1.0,  0.52, 0.19, 0.38, 0.22, 0.41],
  [0.31, 0.44, 0.52, 1.0,  0.35, 0.55, 0.28, 0.29],
  [0.12, 0.21, 0.19, 0.35, 1.0,  0.17, 0.44, 0.11],
  [0.24, 0.48, 0.38, 0.55, 0.17, 1.0,  0.21, 0.18],
  [0.08, 0.15, 0.22, 0.28, 0.44, 0.21, 1.0,  0.09],
  [0.19, 0.33, 0.41, 0.29, 0.11, 0.18, 0.09, 1.0 ],
];

const SIGNAL_ITEMS = [
  { value: "91",     unit: "/100", label: "Dataset Quality Score",       color: "gold"    },
  { value: "r 0.72", unit: "",     label: "Strongest Correlation Found", color: "blue"    },
  { value: "177",    unit: "",     label: "Missing Values Detected",     color: "warning" },
  { value: "3",      unit: "",     label: "Critical Relationships",      color: "purple"  },
];

/* Scene copy — updated per request */
const SCENES = [
  {
    num: "01",
    hl: "Every dataset\nbegins as chaos.",
    sub: "Raw values. Missing entries. Scattered columns with no meaning yet.",
  },
  {
    num: "02",
    hl: "Structure starts\nto appear.",
    sub: "Columns align. Rows begin to cohere. Suddenly, the shape of the data becomes visible.",
  },
  {
    num: "03",
    hl: "Individual features\nstart speaking.",
    sub: "Distributions unfold. Outliers rise to the surface. Datassert reveals what was previously invisible.",
  },
  {
    num: "04",
    hl: "Relationships\ncome alive.",
    sub: "Correlations form across every pair. Ranked and visualized automatically.",
  },
  {
    num: "05",
    hl: "Only signal\nremains.",
    sub: "Noise disappears. Patterns converge into understanding. All in under three seconds.",
  },
];

function hmColor(v) {
  if (v >= 0.6) return `rgba(212,175,55,${0.28 + v * 0.52})`;
  if (v >= 0.3) return `rgba(99,179,237,${0.12 + v * 0.38})`;
  return `rgba(255,255,255,${0.02 + v * 0.07})`;
}

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function StorySection() {
  const wrapRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const SCROLL = window.innerHeight * 5;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrap,
          start: "top top",
          end: `+=${SCROLL}`,
          pin: true,
          scrub: 1.4,
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = document.getElementById("st-prog");
            if (p) p.style.width = `${self.progress * 100}%`;
          },
        },
      });

      const switchScene = (hideId, showId, t) => {
        // outer: opacity only — never touch translateY so CSS centering is preserved
        tl.to(`#st-scene-${hideId}`, { opacity: 0, duration: 0.3 }, t);
        // inner: y slide
        tl.to(`#st-scene-${hideId}-inner`, { y: -16, duration: 0.3 }, t);
        tl.fromTo(`#st-scene-${showId}`,
          { opacity: 0 },
          { opacity: 1, duration: 0.4 },
          t + 0.1
        );
        tl.fromTo(`#st-scene-${showId}-inner`,
          { y: 20 },
          { y: 0, duration: 0.4, ease: "power2.out" },
          t + 0.1
        );
      };

      /* ═══ SCENE 1 → 2 : CHAOS → STRUCTURE  t=0→2.4 ═══ */

      CHAOS_PARTICLES.forEach((p, i) => {
        tl.fromTo(`#st-p-${i}`,
          { opacity: 0, scale: 0, rotate: gsap.utils.random(-45, 45) },
          { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.4)" },
          i * 0.022
        );
      });

      switchScene(1, 2, 1.0);

      const GRID_COLS = 6;
      CHAOS_PARTICLES.forEach((_, i) => {
        const col = i % GRID_COLS;
        const row = Math.floor(i / GRID_COLS);
        tl.to(`#st-p-${i}`, {
          left:    `${15 + col * 14}%`,
          top:     `${22 + row * 17}%`,
          scale:   0.72,
          opacity: 0.32,
          rotate:  0,
          duration: 0.75,
          ease: "power2.inOut",
        }, 1.15 + i * 0.018);
      });

      ["age", "salary", "dept", "exp", "gender", "score"].forEach((_, i) => {
        tl.fromTo(`#st-colh-${i}`,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.4 },
          1.55 + i * 0.07
        );
      });

      for (let r = 0; r < 7; r++) {
        tl.fromTo(`#st-row-${r}`,
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 0.55, ease: "power2.out" },
          1.72 + r * 0.06
        );
      }

      /* ═══ SCENE 2 → 3 : STRUCTURE → ANALYSIS  t=2.5→4.1 ═══ */

      switchScene(2, 3, 2.5);

      ["age", "salary", "dept", "exp", "gender", "score"].forEach((_, i) => {
        tl.to(`#st-colh-${i}`, { opacity: 0, scale: 0.8, duration: 0.3 }, 2.5 + i * 0.03);
      });
      for (let r = 0; r < 7; r++) {
        tl.to(`#st-row-${r}`, { opacity: 0, duration: 0.3 }, 2.5 + r * 0.03);
      }
      CHAOS_PARTICLES.forEach((_, i) => {
        tl.to(`#st-p-${i}`, { opacity: 0, scale: 0, duration: 0.28 }, 2.5 + i * 0.01);
      });

      HIST_BARS.forEach((_, i) => {
        tl.fromTo(`#st-hbar-${i}`,
          { scaleY: 0, opacity: 0 },
          { scaleY: 1, opacity: 1, duration: 0.7, ease: "power3.out" },
          2.75 + i * 0.055
        );
      });

      tl.fromTo("#st-curve",
        { strokeDashoffset: 800, opacity: 0 },
        { strokeDashoffset: 0, opacity: 1, duration: 1.1, ease: "power2.inOut" },
        2.95
      );

      tl.fromTo("#st-box-line",
        { scaleX: 0 },
        { scaleX: 1, duration: 0.65, ease: "power2.out" },
        3.25
      );
      tl.fromTo("#st-box-rect",
        { scaleX: 0 },
        { scaleX: 1, duration: 0.5, ease: "back.out(1.2)" },
        3.45
      );
      tl.fromTo("#st-box-median",
        { opacity: 0, scaleY: 0 },
        { opacity: 1, scaleY: 1, duration: 0.3 },
        3.65
      );
      [0, 1, 2].forEach((i) => {
        tl.fromTo(`#st-out-${i}`,
          { opacity: 0, scale: 0 },
          { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" },
          3.72 + i * 0.09
        );
      });

      tl.fromTo("#st-missing-badge",
        { opacity: 0, x: 18 },
        { opacity: 1, x: 0, duration: 0.45 },
        3.6
      );

      /* ═══ SCENE 3 → 4 : ANALYSIS → RELATIONSHIPS  t=4.3→5.9 ═══ */

      switchScene(3, 4, 4.3);

      HIST_BARS.forEach((_, i) => {
        tl.to(`#st-hbar-${i}`, { scaleY: 0, opacity: 0, duration: 0.28 }, 4.3 + i * 0.018);
      });
      tl.to("#st-curve", { opacity: 0, duration: 0.3 }, 4.3);
      tl.to("#st-box-line",   { opacity: 0, duration: 0.28 }, 4.35);
      tl.to("#st-box-rect",   { opacity: 0, duration: 0.28 }, 4.35);
      tl.to("#st-box-median", { opacity: 0, duration: 0.25 }, 4.35);
      [0, 1, 2].forEach(i => tl.to(`#st-out-${i}`, { opacity: 0, duration: 0.22 }, 4.3));
      tl.to("#st-missing-badge", { opacity: 0, duration: 0.25 }, 4.3);

      for (let r = 0; r < HM_SIZE; r++) {
        for (let c = 0; c < HM_SIZE; c++) {
          tl.fromTo(`#st-hm-${r}-${c}`,
            { opacity: 0, scale: 0.3 },
            { opacity: 1, scale: 1, duration: 0.32, ease: "back.out(1.4)" },
            4.55 + (r * HM_SIZE + c) * 0.011
          );
        }
      }

      HM_LABELS.forEach((_, i) => {
        tl.fromTo(`#st-hml-${i}`, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 4.65 + i * 0.04);
        tl.fromTo(`#st-hmlt-${i}`, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 4.65 + i * 0.04);
      });

      tl.fromTo("#st-corr-callout",
        { opacity: 0, scale: 0.85, y: 14 },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.3)" },
        5.55
      );

      /* ═══ SCENE 4 → 5 : RELATIONSHIPS → SIGNAL  t=6.0→7.5 ═══ */

      switchScene(4, 5, 6.0);

      for (let r = 0; r < HM_SIZE; r++) {
        for (let c = 0; c < HM_SIZE; c++) {
          tl.to(`#st-hm-${r}-${c}`,
            { opacity: 0, scale: 0, duration: 0.22 },
            6.0 + (r * HM_SIZE + c) * 0.005
          );
        }
      }
      HM_LABELS.forEach((_, i) => {
        tl.to(`#st-hml-${i}`,  { opacity: 0, duration: 0.2 }, 6.0);
        tl.to(`#st-hmlt-${i}`, { opacity: 0, duration: 0.2 }, 6.0);
      });
      tl.to("#st-corr-callout", { opacity: 0, scale: 0.8, duration: 0.28 }, 6.0);

      tl.fromTo("#st-orb",
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.9, ease: "power4.out" },
        6.28
      );

      ["#st-ring-1", "#st-ring-2", "#st-ring-3"].forEach((id, i) => {
        tl.fromTo(id,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.65, ease: "power2.out" },
          6.42 + i * 0.18
        );
      });

      SIGNAL_ITEMS.forEach((_, i) => {
        tl.fromTo(`#st-sig-${i}`,
          { opacity: 0, y: 22, scale: 0.88 },
          { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(1.3)" },
          6.72 + i * 0.14
        );
      });

      tl.fromTo("#st-final-tag",
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5 },
        7.35
      );

      // Anchor text switches to "done" when scene 5 is fully in
      tl.to("#st-anchor-processing", { opacity: 0, duration: 0.25 }, 6.5);
      tl.to("#st-anchor-done",       { opacity: 1, duration: 0.4  }, 6.7);

    }, wrap);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapRef} className="st-wrap">

      {/* Progress */}
      <div className="st-progress-track">
        <div id="st-prog" className="st-progress-fill" />
      </div>

      {/* ── ANCHOR BAR — always visible ── */}
      <div className="st-anchor">
        {/* Processing state */}
        <div id="st-anchor-processing" className="st-anchor__state">
          <div className="st-anchor__dots">
            <span className="st-anchor__dot" />
            <span className="st-anchor__dot" />
            <span className="st-anchor__dot" />
          </div>
          <span className="st-anchor__text">Datassert is processing</span>
        </div>
        {/* Done state */}
        <div id="st-anchor-done" className="st-anchor__state st-anchor__state--done">
          <span className="st-anchor__check">✓</span>
          <span className="st-anchor__text">Analysis complete</span>
        </div>
      </div>

      {/* ── LEFT ASIDE ── */}
      <aside className="st-aside">
        {SCENES.map((sc, i) => (
          <div
            key={i}
            id={`st-scene-${i + 1}`}
            className={`st-aside__scene${i > 0 ? " st-aside__scene--hidden" : ""}`}
          >
            <div id={`st-scene-${i + 1}-inner`} className="st-aside__scene-inner">
              <div className="st-aside__num">{sc.num}</div>
              <div className="st-aside__hl">
                {sc.hl.split("\n").map((line, j) => (
                  <span key={j}>{line}<br /></span>
                ))}
              </div>
              <div className="st-aside__sub">{sc.sub}</div>
            </div>
          </div>
        ))}
      </aside>

      {/* ── VISUAL STAGE ── */}
      <div className="st-stage">

        {/* ════ SCENE 1: CHAOS ════ */}
        <div className="st-canvas">
          {CHAOS_PARTICLES.map((p, i) => (
            <div
              key={i}
              id={`st-p-${i}`}
              className={`st-particle st-particle--${p.type}`}
              style={{ left: p.x, top: p.y, opacity: 0, transform: "scale(0)" }}
            >
              {p.val}
            </div>
          ))}
        </div>

        {/* ════ SCENE 2: STRUCTURE ════ */}
        <div className="st-canvas">
          {["age", "salary", "dept", "exp", "gender", "score"].map((col, i) => (
            <div
              key={i}
              id={`st-colh-${i}`}
              className="st-col-header"
              style={{ left: `${15 + i * 14}%`, top: "20%", opacity: 0 }}
            >
              {col}
            </div>
          ))}
          {Array.from({ length: 7 }, (_, r) => (
            <div
              key={r}
              id={`st-row-${r}`}
              className="st-grid-row"
              style={{ top: `${30 + r * 9}%`, opacity: 0, transform: "scaleX(0)", transformOrigin: "left" }}
            >
              {["23","74k","Eng","4yrs","M","82"].map((v, ci) => (
                <span key={ci} className="st-cell" style={{ left: `${15 + ci * 14}%` }}>{v}</span>
              ))}
            </div>
          ))}
        </div>

        {/* ════ SCENE 3: DEEP ANALYSIS ════ */}
        <div className="st-canvas">
          {/* Histogram — centered, dominant */}
          <div className="st-hist-wrap">
            <div className="st-hist-axis-y" />
            <div className="st-hist-axis-x" />
            {HIST_BARS.map((bar, i) => (
              <div
                key={i}
                id={`st-hbar-${i}`}
                className="st-hist-bar"
                style={{
                  height: `${bar.h}%`,
                  left: `${3 + i * 8}%`,
                  opacity: 0,
                  transform: "scaleY(0)",
                  transformOrigin: "bottom",
                }}
              />
            ))}
            <svg className="st-hist-svg" viewBox="0 0 120 100" preserveAspectRatio="none">
              <path
                id="st-curve"
                d="M 4 92 C 10 80, 16 55, 24 20 C 32 -10, 48 -12, 56 8 C 64 28, 72 82, 80 90 C 88 96, 100 96, 116 95"
                fill="none"
                stroke="rgba(212,175,55,0.72)"
                strokeWidth="0.9"
                strokeDasharray="800"
                strokeDashoffset="800"
                opacity="0"
              />
            </svg>
          </div>

          {/* Box plot — sits above histogram */}
          <div className="st-box-wrap">
            <div className="st-box-label">salary — distribution</div>
            <div id="st-box-line" className="st-box-line" style={{ transform: "scaleX(0)", transformOrigin: "left" }} />
            <div
              id="st-box-rect"
              className="st-box-rect"
              style={{ left: `${BOX.q1}%`, width: `${BOX.q3 - BOX.q1}%`, transform: "scaleX(0)", transformOrigin: "left" }}
            />
            <div id="st-box-median" className="st-box-median" style={{ left: `${BOX.median}%`, opacity: 0, transform: "scaleY(0)" }} />
            {BOX.outliers.map((o, i) => (
              <div
                key={i}
                id={`st-out-${i}`}
                className="st-box-outlier"
                style={{ left: `${Math.min(o, 97)}%`, opacity: 0, transform: "scale(0)" }}
              />
            ))}
          </div>

          <div id="st-missing-badge" className="st-missing-badge" style={{ opacity: 0 }}>
            <span className="st-missing-badge__dot" />
            177 missing values detected in <strong>age</strong>
          </div>
        </div>

        {/* ════ SCENE 4: HEATMAP ════ */}
        <div className="st-canvas">
          <div className="st-hm-wrap">
            {HM_LABELS.map((lbl, i) => (
              <div
                key={i}
                id={`st-hml-${i}`}
                className="st-hm-ylabel"
                style={{ top: `${i * (100 / HM_SIZE) + 100 / HM_SIZE / 2}%`, opacity: 0 }}
              >
                {lbl}
              </div>
            ))}
            {HM_LABELS.map((lbl, i) => (
              <div
                key={i}
                id={`st-hmlt-${i}`}
                className="st-hm-xlabel"
                style={{ left: `${i * (100 / HM_SIZE) + 100 / HM_SIZE / 2}%`, opacity: 0 }}
              >
                {lbl}
              </div>
            ))}
            <div className="st-hm-grid">
              {HM_DATA.map((row, r) =>
                row.map((val, c) => (
                  <div
                    key={`${r}-${c}`}
                    id={`st-hm-${r}-${c}`}
                    className="st-hm-cell"
                    style={{ background: hmColor(val), opacity: 0, transform: "scale(0.3)" }}
                  >
                    {val >= 0.55 && (
                      <span className="st-hm-cell__val">{val.toFixed(2)}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div id="st-corr-callout" className="st-corr-callout" style={{ opacity: 0 }}>
            <div className="st-corr-callout__val">r = 0.72</div>
            <div className="st-corr-callout__desc">age ↔ salary</div>
            <div className="st-corr-callout__tag">Strong positive</div>
          </div>
        </div>

        {/* ════ SCENE 5: SIGNAL ════ */}
        <div className="st-canvas">
          <div id="st-orb" className="st-orb" style={{ opacity: 0, transform: "translate(-50%, -50%) scale(0)" }}>
            <div className="st-orb__inner">
              <div className="st-orb__score">91</div>
              <div className="st-orb__label">Quality</div>
            </div>
          </div>
          <div id="st-ring-1" className="st-ring st-ring--1" style={{ opacity: 0, transform: "translate(-50%, -50%) scale(0)" }} />
          <div id="st-ring-2" className="st-ring st-ring--2" style={{ opacity: 0, transform: "translate(-50%, -50%) scale(0)" }} />
          <div id="st-ring-3" className="st-ring st-ring--3" style={{ opacity: 0, transform: "translate(-50%, -50%) scale(0)" }} />

          {SIGNAL_ITEMS.map((sig, i) => {
            // Four corners — top-left, top-right, bottom-left, bottom-right
            const positions = [
              { left: "16%", top: "20%" },
              { left: "68%", top: "20%" },
              { left: "16%", top: "70%" },
              { left: "68%", top: "70%" },
            ];
            return (
              <div
                key={i}
                id={`st-sig-${i}`}
                className={`st-sig-card st-sig-card--${sig.color}`}
                style={{ ...positions[i], opacity: 0 }}
              >
                <div className="st-sig-card__val">
                  {sig.value}<span className="st-sig-card__unit">{sig.unit}</span>
                </div>
                <div className="st-sig-card__label">{sig.label}</div>
              </div>
            );
          })}

          <div id="st-final-tag" className="st-final-tag" style={{ opacity: 0 }}>
            From raw data to understanding.
          </div>
        </div>

      </div>{/* /stage */}
    </div>
  );
}
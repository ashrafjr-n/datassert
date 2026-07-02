import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SECTIONS = [
  { id: "hero",      label: "Discover" },
  { id: "why",       label: "Insights" },
  { id: "story",     label: "Workflow" },
  { id: "cta",       label: "Analyze" },
];

export function ScrollProgress() {
  const [active, setActive] = useState("hero");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 140);

      let current = "hero";

      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);

        if (!el) continue;

        if (
          el.getBoundingClientRect().top <=
          window.innerHeight * 0.45
        ) {
          current = section.id;
        }
      }

      setActive(current);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () =>
      window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{
            position: "fixed",
            right: "24px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 200,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "14px",
            pointerEvents: "auto",
          }}
        >
          {SECTIONS.map((section) => {
            const isActive = active === section.id;

            return (
              <button
                key={section.id}
                onClick={() => scrollTo(section.id)}
                title={section.label}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.span
                      initial={{
                        opacity: 0,
                        x: 10,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      exit={{
                        opacity: 0,
                        x: 10,
                      }}
                      transition={{
                        duration: 0.22,
                      }}
                      style={{
                        fontSize: "10px",
                        fontWeight: "600",
                        color: "#D4AF37",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        background:
                          "rgba(212,175,55,0.08)",
                        border:
                          "1px solid rgba(212,175,55,0.18)",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        whiteSpace: "nowrap",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                      }}
                    >
                      {section.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                <motion.div
                  animate={{
                    width: isActive ? 22 : 5,
                    height: 5,
                    background: isActive
                      ? "#D4AF37"
                      : "rgba(255,255,255,0.18)",
                    boxShadow: isActive
                      ? "0 0 10px rgba(212,175,55,0.55)"
                      : "none",
                  }}
                  transition={{
                    duration: 0.3,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    borderRadius: "999px",
                    flexShrink: 0,
                  }}
                />
              </button>
            );
          })}
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
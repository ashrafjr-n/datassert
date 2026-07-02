import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function Header() {
  const navigate = useNavigate();

  return (
    <header style={{
      width: "100%",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 1000,
      // background: "rgba(249, 249, 249, 0.88)",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "1400px",
        marginLeft: "auto",
        marginRight: "auto",
        padding: "16px 48px",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(18,18,18,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: "16px",
          padding: "13px 22px",
          // boxShadow: "0 4px 32px rgba(0,0,0,0.4)",
        }}>

          {/* Logo */}
          <motion.div
            onClick={() => navigate("/")}
            whileHover={{ opacity: 0.8 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              cursor: "pointer",
            }}
          >
            <div style={{
              width: "30px", height: "30px", borderRadius: "9px",
              background: "linear-gradient(135deg, #D4AF37, #C89B3C)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "14px", color: "#0B0B0B", fontWeight: "800",
              flexShrink: 0, boxShadow: "0 4px 14px rgba(212,175,55,0.3)",
            }}>
              ◈
            </div>
            <span style={{
              fontSize: "15px", fontWeight: "700",
              color: "var(--text-primary)", letterSpacing: "-0.01em", whiteSpace: "nowrap",
            }}>
              Datassert
            </span>
          </motion.div>

          {/* Badge */}
          <div style={{
            fontSize: "11px", fontWeight: "600", color: "#b8932a",
            background: "rgba(212,175,55,0.09)",
            border: "1px solid rgba(212,175,55,0.2)",
            padding: "5px 14px", borderRadius: "100px",
            letterSpacing: "0.04em", whiteSpace: "nowrap",
          }}>
            Premium Beta
          </div>

        </div>
      </div>
    </header>
  );
}

export default Header;
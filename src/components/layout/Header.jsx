import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/* Fixed, full-width, edge-to-edge — NOT floating/pill-shaped. See frontend.md
   "Header" spec. Shared by every page (Home + the whole /analyze flow). */
function Header() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 z-50 w-full h-16 bg-paper/90 backdrop-blur border-b border-line">
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-6 sm:px-12">

        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gold text-sm font-bold text-paper">
            D
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Datassert
          </span>
        </button>

        <button
          type="button"
          className="group inline-flex items-center gap-1.5 rounded-md border border-gold bg-transparent px-4 py-2 text-[13px] font-semibold text-gold-ink transition-colors hover:bg-gold-tint"
        >
          Start for Free
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </button>

      </div>
    </header>
  );
}

export default Header;

import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* Route-level code splitting: the landing page (GSAP-driven story section) and the
   analyzer (PapaParse + the whole results dashboard) never load together. */
const Home    = lazy(() => import("./pages/Home"));
const Analyze = lazy(() => import("./pages/Analyze"));

/* Painted in the app's own background so a chunk fetch never flashes white. */
function RouteFallback() {
  return <div style={{ minHeight: "100vh", background: "var(--surface-base)" }} />;
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/"        element={<Home />} />
          <Route path="/home"    element={<Navigate to="/" replace />} />
          <Route path="/search"  element={<Navigate to="/" replace />} />
          <Route path="/analyze" element={<Analyze />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

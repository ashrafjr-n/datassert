import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Analyze from "./pages/Analyze";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<Home />} />
        <Route path="/home"    element={<Navigate to="/" replace />} />
        <Route path="/search"  element={<Navigate to="/" replace />} />
        <Route path="/analyze" element={<Analyze />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
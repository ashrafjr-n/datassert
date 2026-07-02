import "./home-v2.css";

import Header               from "../components/layout/Header.jsx";
import Footer               from "../components/layout/Footer.jsx";
import { ScrollProgress }   from "../components/layout/ScrollProgress.jsx";

import HeroSection          from "../components/hero/HeroSection.jsx";
import ProblemSolution      from "../components/home/ProblemSolution/ProblemSolution.jsx";
import StorySection         from "../components/home/StorySection/StorySection.jsx";
import CtaFinal             from "../components/home/CtaFinal/CtaFinal.jsx";

function Home() {
  return (
    <div style={{
      minHeight:     "100vh",
      width:         "100%",
      display:       "flex",
      flexDirection: "column",
      background:    "var(--surface-base)",
      color:         "var(--text-primary)",
    }}>
      <Header />
      <ScrollProgress />

      <main style={{ flex: 1, width: "100%" }}>
        <section id="hero">
          <HeroSection />
        </section>

        <section id="why">
          <ProblemSolution />
        </section>

        <section id="story">
          <StorySection />
        </section>

        <section id="cta">
          <CtaFinal />
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Home;
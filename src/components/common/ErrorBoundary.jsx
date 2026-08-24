import { Component } from "react";

/**
 * Catches render/lifecycle errors in the subtree and shows a recovery panel
 * instead of unmounting the whole app to a blank page.
 *
 * Must be a class: React exposes no hook equivalent — getDerivedStateFromError /
 * componentDidCatch only exist on class components, and a try/catch inside a
 * function component cannot catch errors thrown during a child's render.
 *
 * Does NOT catch: event-handler errors, async/promise rejections, or SSR errors.
 */
class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // No telemetry backend — the console is the only sink available.
    console.error("ErrorBoundary caught an error:", error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight:      "100vh",
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          gap:            "16px",
          padding:        "24px",
          textAlign:      "center",
          background:     "var(--surface-base)",
          color:          "var(--text-primary)",
        }}
      >
        <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: "14px", opacity: 0.6, margin: 0, maxWidth: "440px" }}>
          The analyzer hit an unexpected error. Your data never left the browser.
          Try again, or reload the page with a different file.
        </p>
        <button
          type="button"
          onClick={this.handleReset}
          style={{
            padding:      "9px 18px",
            fontSize:     "13px",
            fontWeight:   600,
            cursor:       "pointer",
            borderRadius: "8px",
            border:       "1px solid rgba(255,255,255,0.18)",
            background:   "transparent",
            color:        "inherit",
          }}
        >
          Try again
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;

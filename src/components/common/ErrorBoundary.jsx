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
      <div role="alert" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center text-ink">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="max-w-md text-[14px] text-ink-soft">
          The analyzer hit an unexpected error. Your data never left the browser.
          Try again, or return to the start with a different file.
        </p>
        <div className="mt-1 flex items-center gap-3">
          <button
            type="button"
            onClick={this.handleReset}
            className="rounded-lg border border-line-strong px-4 py-2 text-[13px] font-semibold text-ink hover:bg-paper-sunken"
          >
            Try again
          </button>
          {/* Full navigation, not a router push: guarantees a clean module reload
              (also clears the datasetHandoff singleton) even if the crash is
              deterministic and "Try again" would hit it again immediately. */}
          <a
            href="/"
            className="text-[13px] font-medium text-ink-soft hover:text-ink"
          >
            Return to start
          </a>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

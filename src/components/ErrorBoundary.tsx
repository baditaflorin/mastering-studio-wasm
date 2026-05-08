import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error(error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <main className="min-h-screen bg-paper px-6 py-16 text-ink">
          <section className="mx-auto max-w-2xl rounded-lg border border-coral/40 bg-panel p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-wide text-coral">
              Render error
            </p>
            <h1 className="mt-3 text-3xl font-bold">The interface needs a refresh.</h1>
            <p className="mt-3 text-sm text-neutral-700">
              {this.state.error.message ||
                'An unexpected browser error stopped the app.'}
            </p>
            <button
              className="mt-6 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
              onClick={() => window.location.reload()}
              type="button"
            >
              Reload
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

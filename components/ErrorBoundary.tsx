import * as React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const state = (this as any).state as State;
    const props = (this as any).props as Props;

    if (state.hasError) {
      let errorMessage = "Something went wrong.";
      let details = null;

      try {
        if (state.error?.message) {
          const parsed = JSON.parse(state.error.message);
          if (parsed.error) {
            errorMessage = "Database Permission Error";
            details = (
              <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-red-500/30 text-left overflow-auto max-h-60">
                <p className="text-red-400 text-xs font-mono whitespace-pre-wrap">
                  {JSON.stringify(parsed, null, 2)}
                </p>
              </div>
            );
          }
        }
      } catch (e) {
        // Not a JSON error message
      }

      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-2xl">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-2xl font-black oswald uppercase tracking-tighter text-white mb-2 italic">{errorMessage}</h2>
            <p className="text-slate-400 text-sm mb-6">
              The application encountered an error. This might be due to missing permissions or a temporary connection issue.
            </p>
            {details}
            <button
              onClick={() => window.location.reload()}
              className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-95"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return props.children;
  }
}

export default ErrorBoundary;

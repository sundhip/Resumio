import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled React Error Boundary Exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleClearSession = () => {
    try {
      localStorage.removeItem('resumio_token');
      localStorage.removeItem('resumio_user');
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#050708] text-white">
          <div className="max-w-md w-full p-8 rounded-2xl bg-[#0C1113] border border-white/10 text-center space-y-6 shadow-2xl animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto text-2xl font-bold">
              ⚠️
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-white">
                Application Interrupted
              </h2>
              <p className="text-xs text-[#8A928D] dark:text-[#9AA7AB] leading-relaxed">
                An unexpected component rendering error was intercepted. The error boundary prevented a system crash.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/50 text-[11px] font-mono text-rose-300 text-left overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1F8FA6] hover:bg-[#2BB3C9] text-white font-semibold text-xs transition-colors shadow-lg shadow-[#1F8FA6]/20 cursor-pointer"
              >
                Reload Application
              </button>
              <button
                onClick={this.handleClearSession}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#9AA7AB] hover:text-white font-medium text-xs transition-colors border border-white/10 cursor-pointer"
              >
                Reset Session & Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
          <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
          <h2 className="text-slate-100 text-xl font-bold mb-2">
            Er ging iets mis
          </h2>
          <p className="text-slate-400 text-sm text-center max-w-md mb-6">
            Er is een onverwachte fout opgetreden. Probeer de pagina opnieuw te laden.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={this.handleReset}
              variant="default"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Opnieuw proberen
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Pagina herladen
            </Button>
          </div>
          {this.state.error && (
            <p className="text-slate-600 text-xs mt-4 font-mono max-w-md text-center truncate">
              {this.state.error.message}
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

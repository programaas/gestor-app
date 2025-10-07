
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };
  props: any;

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <h1 className="font-bold text-lg mb-2">Ocorreu um erro ao carregar esta seção.</h1>
          <p>A nossa equipe de desenvolvimento já foi notificada. Por favor, tente recarregar a página.</p>
          {this.state.error && (
            <details className="mt-2 text-sm">
              <summary>Detalhes do Erro</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-gray-600 overflow-auto">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

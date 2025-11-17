import React, { ReactNode, ReactElement } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundaryRobust extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactElement {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-red-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
            <div className="text-red-600 text-3xl font-bold mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
            <p className="text-gray-600 mb-4">Une erreur est survenue dans l'application.</p>
            {this.state.error && (
              <details className="mb-6 text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                <summary className="cursor-pointer font-semibold mb-2">Détails</summary>
                <code className="break-words">{this.state.error.toString()}</code>
              </details>
            )}
            <div className="space-y-2">
              <button
                onClick={this.resetError}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
              >
                Réessayer
              </button>
              <a
                href="/"
                className="block w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded font-medium text-center"
              >
                Accueil
              </a>
            </div>
          </div>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}

/**
 * ErrorBoundary Component - ROBUST VERSION
 * Catches React errors and displays a friendly error UI instead of white screen
 * Prevents entire app from crashing when component fails
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import './ErrorBoundaryRobust.css';

class ErrorBoundaryRobust extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Log to backend
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    try {
      fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.toString(),
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(() => console.warn('Could not log error'));
    } catch (e) {
      console.error('Error logging failed:', e);
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1,
    });
  };

  handleNavigateHome = () => {
    window.location.href = '/';
  };

  handleReloadPage = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="error-boundary-robust-container">
          <div className="error-boundary-card">
            <div className="error-header">
              <div className="error-logo-wrapper">
                <img 
                  src="/assets/logos/logo.png" 
                  alt="Logo AKIG" 
                  className="error-logo"
                />
              </div>
              <div className="error-icon-wrapper">
                <AlertTriangle size={48} className="error-icon" />
              </div>
              <h1 className="error-title">⚠️ Something Went Wrong</h1>
              <p className="error-subtitle">We're working to fix this issue</p>
            </div>

            <div className="error-content">
              <div className="error-message">
                <strong>Error:</strong> {this.state.error?.toString()}
              </div>

              {isDevelopment && this.state.errorInfo && (
                <details className="error-details">
                  <summary>📋 Component Stack</summary>
                  <pre className="error-stack">{this.state.errorInfo.componentStack}</pre>
                </details>
              )}

              <div className="error-meta">
                <p><strong>Count:</strong> {this.state.errorCount}</p>
                <p><strong>Retries:</strong> {this.state.retryCount}</p>
              </div>
            </div>

            <div className="error-actions">
              <button className="btn btn-primary" onClick={this.handleRetry}>
                <RefreshCw size={18} />
                Try Again
              </button>
              <button className="btn btn-secondary" onClick={this.handleNavigateHome}>
                <Home size={18} />
                Go Home
              </button>
              <button className="btn btn-tertiary" onClick={this.handleReloadPage}>
                <RefreshCw size={18} />
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryRobust;

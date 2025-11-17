import React from 'react';

interface ErrorBoundaryRobustProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

declare const ErrorBoundaryRobust: React.ComponentType<ErrorBoundaryRobustProps>;

export default ErrorBoundaryRobust;

/**
 * Error Boundary Component
 * 
 * Catches React component errors and logs them to Sentry
 */

import React from 'react';
import * as Sentry from '@sentry/react';

/**
 * Error fallback UI
 */
function ErrorFallback({ error, resetError }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '40px',
        maxWidth: '500px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center',
      }}>
        <h1 style={{ color: '#d32f2f', marginBottom: '16px' }}>
          ⚠️ Something went wrong
        </h1>

        <p style={{ color: '#666', marginBottom: '24px', lineHeight: '1.6' }}>
          We're sorry for the inconvenience. Our team has been notified and will look into this.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details style={{
            textAlign: 'left',
            backgroundColor: '#f5f5f5',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '24px',
            maxHeight: '200px',
            overflow: 'auto',
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Error details
            </summary>
            <pre style={{
              marginTop: '12px',
              fontSize: '12px',
              overflow: 'auto',
              color: '#d32f2f',
            }}>
              {error?.message}
              {'\n\n'}
              {error?.stack}
            </pre>
          </details>
        )}

        <button
          onClick={resetError}
          style={{
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            padding: '12px 32px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#1565c0'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#1976d2'}
        >
          Try again
        </button>

        <p style={{
          marginTop: '24px',
          fontSize: '14px',
          color: '#999',
        }}>
          Error ID: {error?.eventId || 'unknown'}
        </p>
      </div>
    </div>
  );
}

/**
 * Error Boundary component
 * Wraps part of your app to catch errors
 */
const ErrorBoundary = Sentry.withErrorBoundary(
  ({ children }) => children,
  {
    fallback: <ErrorFallback />,
    showDialog: false,
    onError: (error, errorInfo) => {
      console.error('Error caught by boundary:', error, errorInfo);
    },
  }
);

export default ErrorBoundary;
export { ErrorFallback };

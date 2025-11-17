import React from 'react';

export const Toast = ({ message, type = 'info' }: any) => (
  <div style={{ padding: '10px', background: type === 'error' ? '#f8d7da' : '#d4edda' }}>
    {message}
  </div>
);

export const ErrorBoundary = class extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <div style={{ padding: '20px', color: 'red' }}>Error: {this.state.error?.message}</div>;
    }
    return this.props.children;
  }
};

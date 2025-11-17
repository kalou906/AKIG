export const ErrorBoundary = ({ children }: any) => children;
export const initializeMonitoring = () => {};
export const setupAllMonitoring = () => {};
export const useErrorTracking = () => ({ captureException: (e: Error) => {}, captureMessage: (msg: string) => {} });

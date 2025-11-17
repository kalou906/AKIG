export const initializeAnalytics = () => {};
export const trackEvent = (e: string, d?: any) => {};
export const trackConversion = (c: string, v?: number) => {};
export const trackError = (e: string, d?: any) => {};
export const identifyUser = (u: string, p?: any) => {};
export const trackPageView = (p: string) => {};
export const getBrowserInfo = () => ({ name: 'Unknown', version: '0' });
export const monitorBrowserCompatibility = () => {};
export const monitorMemoryUsage = () => {};

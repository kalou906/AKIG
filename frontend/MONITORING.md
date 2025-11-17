# 📊 Frontend Monitoring & Error Tracking

Comprehensive error tracking, performance monitoring, and user experience tracking for the AKIG frontend application.

## 🎯 Overview

This monitoring setup provides:
- **Error Tracking**: Automatic error capture and reporting via Sentry
- **Performance Metrics**: Core Web Vitals monitoring
- **User Sessions**: Track user interactions and behavior
- **API Monitoring**: Monitor API calls and failures
- **Custom Events**: Track custom application events

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install @sentry/react @sentry/tracing web-vitals
```

### 2. Configure Sentry

#### Create Sentry Account

1. Go to [https://sentry.io](https://sentry.io)
2. Create a free account
3. Create a new organization
4. Create a React project

#### Get Your DSN

1. Go to project settings
2. Copy your DSN (looks like: `https://key@org.ingest.sentry.io/12345`)
3. Add to `.env`:

```env
REACT_APP_SENTRY_DSN=https://your-key@org.ingest.sentry.io/12345
REACT_APP_SENTRY_ENABLED=true
```

### 3. Initialize Monitoring

In your `src/index.jsx` or `src/App.jsx`:

```javascript
import { initializeMonitoring } from './monitoring';
import ErrorBoundary from './components/ErrorBoundary';
import { Sentry } from './utils/sentry';

// Initialize monitoring as early as possible
initializeMonitoring();

// Wrap your app with Error Boundary
function App() {
  return (
    <ErrorBoundary>
      {/* Your app content */}
    </ErrorBoundary>
  );
}

// For Sentry integration
export default Sentry.withProfiler(App);
```

### 4. Verify Setup

Check browser console for monitoring logs:
```
✅ Sentry initialized for error tracking and performance monitoring
✅ Web Vitals monitoring initialized
✅ API monitoring configured
✅ User tracking configured
✅ Console monitoring configured
✅ Frontend monitoring initialized
```

## 📈 Monitoring Components

### 1. Sentry Error Tracking

Automatically captures:
- **JavaScript Errors**: Uncaught exceptions
- **React Errors**: Component lifecycle errors
- **Network Errors**: Failed API requests
- **Custom Errors**: Manually captured errors

#### Manual Error Capture

```javascript
import { captureException, captureMessage } from '../utils/sentry';

try {
  // Your code
} catch (error) {
  captureException(error, { 
    context: 'payment_processing',
    userId: user.id 
  });
}

// Capture informational messages
captureMessage('User completed checkout', 'info');
```

### 2. Web Vitals Monitoring

Tracks Core Web Vitals metrics:

| Metric | Target | Description |
|--------|--------|-------------|
| **LCP** | < 2.5s | Largest Contentful Paint - Load speed |
| **FID** | < 100ms | First Input Delay - Interactivity |
| **INP** | < 200ms | Interaction to Next Paint - Responsiveness |
| **CLS** | < 0.1 | Cumulative Layout Shift - Visual stability |
| **FCP** | < 1.8s | First Contentful Paint - Content appearance |
| **TTFB** | < 600ms | Time to First Byte - Server response |

#### View Metrics

Metrics are automatically sent to Sentry and visible in:
- **Dashboard**: Performance tab
- **Releases**: Release details
- **Transactions**: Transaction list

### 3. API Monitoring

Automatically monitors:
- ✅ Successful API calls
- ❌ Failed API requests
- ⏱️ Request duration
- ⚠️ Slow requests (> 3 seconds)

```javascript
// Automatically tracked, no code needed
const response = await fetch('/api/contracts');
// Breadcrumb added, duration tracked, errors captured
```

### 4. User Session Tracking

Track user actions and behavior:

```javascript
import { setUserContext, addBreadcrumb } from '../utils/sentry';

// Set user context
setUserContext(
  'user-123',
  'user@example.com',
  'johndoe'
);

// Add breadcrumb for user action
addBreadcrumb(
  'Clicked payment button',
  'user-action',
  { paymentAmount: 100 }
);
```

### 5. Error Boundary

React Error Boundary component catches and reports component errors:

```javascript
import ErrorBoundary from './components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

Features:
- ✅ Catches render errors
- ✅ Logs to Sentry
- ✅ Shows user-friendly error UI
- ✅ Error recovery option

## 🔍 Monitoring in Action

### Development Mode

In development, you'll see detailed logs:

```
📊 LCP: { value: '1234.56ms', rating: 'good', delta: '10.50ms' }
📊 FID: { value: '45.23ms', rating: 'good', delta: '2.10ms' }
⚠️ Slow API request: GET /api/contracts (3456ms)
⚠️ Long task: ScriptEvaluation (75ms)
```

### Sentry Dashboard

Monitor errors and performance:

1. **Issues Tab**:
   - List of unique errors
   - Error frequency and trends
   - First/last occurrence
   - Affected users

2. **Performance Tab**:
   - Core Web Vitals trends
   - Transaction performance
   - Slowest endpoints
   - Error rate tracking

3. **Releases Tab**:
   - Performance per release
   - Health score
   - Compared to previous release

4. **User Feedback**:
   - User-reported issues
   - Comments and feedback
   - Context screenshots

## ⚙️ Configuration

### Environment Variables

```env
# Sentry DSN (required for error tracking)
REACT_APP_SENTRY_DSN=https://key@org.ingest.sentry.io/12345

# Enable/disable monitoring
REACT_APP_SENTRY_ENABLED=true
REACT_APP_WEB_VITALS_ENABLED=true

# Performance sampling (production)
REACT_APP_SENTRY_TRACE_SAMPLE_RATE=0.1  # 10% in production

# Version tracking
REACT_APP_VERSION=1.0.0
REACT_APP_SENTRY_RELEASE=1.0.0
```

### Sentry Advanced Configuration

Edit `src/utils/sentry.js`:

```javascript
// Sample rate for error events
sampleRate: 1.0,  // 100% - capture all errors

// Sample rate for performance
tracesSampleRate: 0.1,  // 10% - sample 10% of transactions

// Session replay on errors
replaysOnErrorSampleRate: 1.0,  // Always record on error
```

## 📊 Best Practices

### 1. Environment-Specific Configuration

```javascript
// Development: Track everything
const tracesSampleRate = process.env.NODE_ENV === 'development' ? 1.0 : 0.1;

// Production: Sample transactions
// Development: Capture all
```

### 2. Set Release Version

```env
# In .env or build process
REACT_APP_VERSION=1.2.3
```

Then in Sentry, you can compare performance across releases.

### 3. Monitor Custom Metrics

```javascript
import * as Sentry from '@sentry/react';

const transaction = Sentry.startTransaction({
  name: 'checkout-flow',
  op: 'transaction'
});

// Your code...

const span = transaction.startChild({
  op: 'payment-processing',
  description: 'Processing payment',
});

// Your code...

span.finish();
transaction.finish();
```

### 4. Ignore Certain Errors

In `src/utils/sentry.js`:

```javascript
ignoreErrors: [
  'NetworkError',
  'Network request failed',
  'chrome-extension://',
  'moz-extension://',
  'ResizeObserver loop limit exceeded',
],
```

### 5. Test Error Tracking

Add test button to verify setup:

```javascript
function ErrorTestButton() {
  return (
    <button 
      onClick={() => {
        throw new Error('Test error from ErrorTestButton');
      }}
    >
      Test Error Tracking
    </button>
  );
}
```

Error should appear in Sentry within 1-2 seconds.

## 🚨 Common Issues

### Errors Not Appearing in Sentry

1. **Check DSN is correct**
   ```env
   REACT_APP_SENTRY_DSN=https://your-key@org.ingest.sentry.io/12345
   ```

2. **Verify Sentry is initialized**
   Look for success log: `✅ Sentry initialized...`

3. **Check Error Boundary**
   ```javascript
   // Must wrap app
   <ErrorBoundary>
     <App />
   </ErrorBoundary>
   ```

4. **Network issues**
   - Check browser DevTools Network tab
   - Look for requests to `ingest.sentry.io`
   - Verify not blocked by ad-blocker or proxy

### Web Vitals Not Tracked

1. **Ensure web-vitals package installed**
   ```bash
   npm install web-vitals
   ```

2. **Check console for init message**
   ```
   📊 Web Vitals monitoring initialized
   ```

3. **Verify in browser console** (dev mode)
   ```
   📊 LCP: ...
   ```

### Performance Issues

1. **High sample rate in production**
   - Set `tracesSampleRate: 0.01` for 1%
   - Or `0.1` for 10%

2. **Too many replays**
   - Set `replaysSessionSampleRate: 0.1` for 10%
   - Set `replaysOnErrorSampleRate: 1.0` to only record errors

## 📚 References

- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Core Web Vitals Optimization](https://web.dev/vitals-tools-crux-toolkit/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)

## 🔗 Related Documentation

- See `../.env` for backend monitoring setup
- See `../../.github/workflows/quality.yml` for CI/CD testing
- See `../../ops/pra/README.md` for disaster recovery

## 📝 Checklist

Production deployment checklist:

- [ ] Sentry DSN configured in `.env`
- [ ] Sentry enabled in production
- [ ] Sample rates set appropriately (0.1 for transactions)
- [ ] Error tracking tested
- [ ] Web Vitals verified in Sentry dashboard
- [ ] Performance budget set (e.g., LCP < 2.5s)
- [ ] Alert rules configured in Sentry
- [ ] Team invited to Sentry organization
- [ ] Release version tracking enabled
- [ ] User context properly set

## 🎓 Learning Resources

### Understanding Web Vitals

1. **LCP (Largest Contentful Paint)**
   - When: Measures load speed
   - Good: < 2.5s
   - Fix: Optimize images, reduce JS

2. **FID/INP (Interactivity)**
   - When: User interacts with page
   - Good: < 100ms / < 200ms
   - Fix: Reduce main thread work

3. **CLS (Visual Stability)**
   - When: Layout shifts occur
   - Good: < 0.1
   - Fix: Avoid unexpected layout changes

### Sentry Features

- Error grouping: Similar errors grouped together
- Source maps: See original code in errors
- Performance monitoring: Identify slow transactions
- Release tracking: Compare versions
- User feedback: Allow users to report issues

---

Last Updated: October 25, 2025  
Status: Production Ready ✅  
Version: 1.0.0

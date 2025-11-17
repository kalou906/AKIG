# 📊 Frontend Monitoring - TypeScript Setup Guide

Comprehensive error tracking, performance monitoring, and Web Vitals tracking using Sentry and web-vitals library.

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
cd frontend
npm install @sentry/react @sentry/tracing web-vitals
```

Or run the setup script:
```bash
bash setup-monitoring.sh
```

### Step 2: Configure Sentry DSN

1. Create free account at [https://sentry.io](https://sentry.io)
2. Create React project
3. Copy DSN from project settings
4. Add to `frontend/.env`:

```env
REACT_APP_SENTRY_DSN=https://your-key@org.ingest.sentry.io/12345
REACT_APP_VERSION=1.0.0
REACT_APP_SENTRY_ENABLED=true
```

### Step 3: Initialize in Your App

In `src/index.tsx` or top of `src/App.tsx`:

```typescript
import { initializeMonitoring } from './monitoring';

// Initialize BEFORE rendering app
initializeMonitoring();

// Then render your app
```

### Step 4: Wrap with Error Boundary

```typescript
import { Sentry } from './monitoring';

// Wrap your App component
export default Sentry.withErrorBoundary(App, {
  fallback: <ErrorFallbackUI />,
  showDialog: false,
});
```

### Step 5: Test

Verify in browser console:
```
✅ Sentry initialized for error tracking and performance monitoring
📊 Web Vitals monitoring initialized
✅ API monitoring configured
✅ Console monitoring configured
```

## 📈 What Gets Monitored

### 1. **Error Tracking**
- ✅ Uncaught JavaScript errors
- ✅ React component errors
- ✅ Fetch/XHR failures
- ✅ Errors from console.error()
- ✅ Custom error capture

### 2. **Web Vitals** (Core Web Vitals)

| Metric | Target | What It Measures |
|--------|--------|------------------|
| **LCP** | < 2.5s | Largest Contentful Paint - Load speed |
| **FID** | < 100ms | First Input Delay - Interactivity |
| **INP** | < 200ms | Interaction to Next Paint - Responsiveness |
| **CLS** | < 0.1 | Cumulative Layout Shift - Visual stability |
| **FCP** | < 1.8s | First Contentful Paint - Content visible |
| **TTFB** | < 600ms | Time to First Byte - Server response |

### 3. **Performance Monitoring**
- ✅ Page load time
- ✅ Resource loading times
- ✅ API request duration
- ✅ Slow requests (> 3s)
- ✅ Transaction tracing

### 4. **User Sessions**
- ✅ User identification
- ✅ Session tracking
- ✅ Breadcrumbs (user actions)
- ✅ Session replays (on error)

## 💻 API Reference

### Initialize Monitoring

```typescript
import { initializeMonitoring } from './monitoring';

initializeMonitoring();
```

### Capture Errors

```typescript
import { captureException, captureMessage } from './monitoring';

try {
  // your code
} catch (error) {
  captureException(error, { context: 'payment_processing' });
}

// Or messages
captureMessage('User completed checkout', 'info');
```

### User Context

```typescript
import { setUser } from './monitoring';

setUser(userId, email, username);
```

### Breadcrumbs

```typescript
import { addBreadcrumb } from './monitoring';

addBreadcrumb('User clicked payment button', 'user-action', {
  paymentAmount: 100
});
```

### Performance Transactions

```typescript
import { startTransaction } from './monitoring';

const transaction = startTransaction('checkout-flow', 'custom');

// Your code...

transaction?.finish();
```

## ⚙️ Configuration

### Environment Variables

```env
# Required
REACT_APP_SENTRY_DSN=https://key@org.ingest.sentry.io/12345

# Optional
REACT_APP_VERSION=1.0.0
REACT_APP_SENTRY_ENABLED=true
REACT_APP_SENTRY_ENVIRONMENT=development
REACT_APP_SENTRY_TRACE_SAMPLE_RATE=1.0
REACT_APP_WEB_VITALS_ENABLED=true
REACT_APP_API_URL=http://localhost:4000
```

### Advanced Configuration (in `monitoring.ts`)

```typescript
// Edit these values in Sentry.init():

// Sample rate for all errors (0.0 - 1.0)
sampleRate: 1.0,  // Capture 100% of errors

// Sample rate for performance monitoring
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
// Production: 10% of transactions
// Development: 100% of transactions

// Session replay sampling
replaysSessionSampleRate: 0.1,  // 10% of sessions
replaysOnErrorSampleRate: 1.0,   // Always on errors
```

## 🎯 Recommended Settings

### Development

```env
REACT_APP_SENTRY_TRACE_SAMPLE_RATE=1.0
REACT_APP_SENTRY_ENVIRONMENT=development
REACT_APP_DEBUG=true
```

- Capture all transactions
- Verbose logging
- Detailed error info

### Staging

```env
REACT_APP_SENTRY_TRACE_SAMPLE_RATE=0.5
REACT_APP_SENTRY_ENVIRONMENT=staging
REACT_APP_DEBUG=false
```

- Capture 50% of transactions
- Test realistic error scenarios
- Monitor production-like behavior

### Production

```env
REACT_APP_SENTRY_TRACE_SAMPLE_RATE=0.1
REACT_APP_SENTRY_ENVIRONMENT=production
REACT_APP_DEBUG=false
```

- Capture 10% of transactions
- Minimize overhead
- Focus on errors

## 📊 Monitoring Dashboard

### Access Sentry Dashboard

1. Log in to [https://sentry.io](https://sentry.io)
2. Select your project
3. View real-time data

### Key Sections

**Issues Tab**
- List of unique errors
- Frequency and trends
- First/last occurrence
- Affected users

**Performance Tab**
- Core Web Vitals trends
- Transaction performance
- Slowest endpoints
- Error rate tracking

**Releases Tab**
- Performance per release
- Health score
- Compared to previous

**User Feedback**
- User-reported issues
- Comments
- Context screenshots

## 🧪 Testing Monitoring

### Test Error Capture

```typescript
// In any component
function TestErrorButton() {
  return (
    <button 
      onClick={() => {
        throw new Error('Test error from button click');
      }}
    >
      Test Error Tracking
    </button>
  );
}
```

Error should appear in Sentry within 1-2 seconds.

### Test Web Vitals

In browser console (development):

```javascript
// Should see logs like:
✅ LCP: 1234.56ms (good)
✅ FID: 45.23ms (good)
⚠️ CLS: 0.15 (needs-improvement)
```

### Test API Monitoring

```typescript
fetch('/api/contracts')
  .then(r => r.json())
  // Automatically tracked in Sentry
```

## 🔍 Troubleshooting

### Errors Not Appearing

1. **Check DSN is correct**
   ```env
   REACT_APP_SENTRY_DSN=https://key@org.ingest.sentry.io/12345
   ```

2. **Verify initialization**
   Look for success log: `✅ Sentry initialized...`

3. **Check network requests**
   - Open DevTools → Network
   - Look for requests to `ingest.sentry.io`
   - Check response status (should be 200)

4. **Check browser console**
   - Look for errors from Sentry initialization
   - Verify DSN is accessible

### Web Vitals Not Tracked

1. **Install package**
   ```bash
   npm install web-vitals
   ```

2. **Check console for init**
   ```
   📊 Web Vitals monitoring initialized
   ```

3. **Verify in development**
   - Enable `REACT_APP_DEBUG=true`
   - Should see vital logs in console

### High Network Usage

In production, reduce sampling:

```env
# Reduce transaction sampling
REACT_APP_SENTRY_TRACE_SAMPLE_RATE=0.05  # 5%

# Reduce replay sampling
# (edit in monitoring.ts)
replaysSessionSampleRate: 0.01,  # 1%
replaysOnErrorSampleRate: 1.0,   # Still capture errors
```

## 📚 Best Practices

### 1. Set Release Version

Always set version for tracking:

```env
REACT_APP_VERSION=1.2.3
```

Compare performance across releases in Sentry.

### 2. Use Breadcrumbs

Track user actions:

```typescript
import { addBreadcrumb } from './monitoring';

// Track important actions
addBreadcrumb('User opened payment modal', 'user-action');
addBreadcrumb('Payment submitted', 'user-action', { 
  amount: 100 
});
```

### 3. Set User Context

For better debugging:

```typescript
import { setUser } from './monitoring';

// When user logs in
setUser(user.id, user.email, user.username);

// When user logs out
setUser(null);
```

### 4. Environment-Specific Configuration

```typescript
const tracesSampleRate = 
  process.env.NODE_ENV === 'production' 
    ? 0.1  // 10% in production
    : 1.0; // 100% in development
```

### 5. Ignore Noise

In `monitoring.ts`, expand `ignoreErrors`:

```typescript
ignoreErrors: [
  'ResizeObserver loop limit exceeded',
  'Network request failed',
  'chrome-extension://',
  // Add more as needed
],
```

## 🚀 Performance Optimization

### 1. Sample Rate Strategy

- **Development**: 100% (test everything)
- **Staging**: 50% (realistic testing)
- **Production**: 10% (minimize overhead)

### 2. Filter Events

Only send important errors:

```typescript
beforeSend(event, hint) {
  // Ignore certain errors
  if (hint.originalException?.name === 'AbortError') {
    return null;  // Don't send
  }
  return event;
},
```

### 3. Disable in Tests

```typescript
if (process.env.NODE_ENV === 'test') {
  // Skip Sentry initialization
} else {
  initializeMonitoring();
}
```

## 📝 Deployment Checklist

Before deploying to production:

- [ ] Sentry DSN configured
- [ ] DSN is for production project
- [ ] Sample rates optimized
- [ ] Version tracking enabled
- [ ] Error Boundary wrapped around app
- [ ] Monitoring initialized at app startup
- [ ] Web Vitals enabled
- [ ] API monitoring tested
- [ ] Error capture tested
- [ ] Console shows success logs
- [ ] Sentry dashboard accessible
- [ ] Team members invited
- [ ] Alert rules configured

## 🔗 Resources

- [Sentry React Docs](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [TypeScript Integration](https://docs.sentry.io/platforms/javascript/guides/react/typescript/)

## 📞 Support

**Issues?**
1. Check Sentry dashboard for errors
2. Review browser console logs
3. Verify `.env` configuration
4. Check network requests to `ingest.sentry.io`

**Questions?**
- See Sentry documentation
- Check GitHub issues
- Review monitoring.ts comments

---

**Last Updated**: October 25, 2025  
**Status**: Production Ready ✅  
**Version**: 1.0.0

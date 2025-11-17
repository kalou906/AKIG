# 🚀 AKIG - Robust Startup System & Deployment Guide

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [Verification System](#verification-system)
4. [Components Overview](#components-overview)
5. [Error Handling](#error-handling)
6. [Health Monitoring](#health-monitoring)
7. [Deployment Options](#deployment-options)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Quick Start

### Option 1: PowerShell Launcher (Recommended for Windows)

```powershell
# Make sure you're in the AKIG root directory
cd c:\AKIG

# Make script executable (first time only)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Launch the system
.\LAUNCH_ROBUST.ps1
```

**Features:**
- ✅ Automatic environment verification
- ✅ Dependency checking
- ✅ Port availability verification
- ✅ Automatic browser opening
- ✅ Comprehensive error reporting

### Option 2: Docker Compose (Cross-platform)

```bash
# Navigate to AKIG root
cd /path/to/AKIG

# Start all services with Docker
docker-compose -f docker-compose-robust.yml up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down
```

### Option 3: Manual Terminal Launch

```bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend
cd frontend
npm install
npm start
```

---

## 🔧 Environment Setup

### 1. Backend Environment (`.env.development`)

The system looks for these environment variables:

```bash
# Application
NODE_ENV=development
PORT=4000
API_VERSION=1.0.0

# Database
DATABASE_URL=postgresql://akig:akig_password@localhost:5432/akig_production

# Authentication
JWT_SECRET=your_jwt_secret_key_min_32_chars_required_here
JWT_EXPIRY=24h

# Security
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
LOG_FILE_ENABLED=true
LOG_FILE_PATH=./logs
```

### 2. Frontend Environment (`.env.development`)

```bash
# API
REACT_APP_API_URL=http://localhost:4000
REACT_APP_API_VERSION=v1
REACT_APP_API_TIMEOUT=30000

# Application
REACT_APP_ENV=development
REACT_APP_VERSION=1.0.0
REACT_APP_NAME=AKIG

# Features
REACT_APP_FEATURE_CSV_IMPORT=true
REACT_APP_FEATURE_PDF_EXPORT=true
REACT_APP_LOG_LEVEL=debug
```

### 3. Creating Configuration Files

**For Backend:**
```powershell
# Copy template
Copy-Item backend\.env.example backend\.env.development

# Edit with your values
notepad backend\.env.development
```

**For Frontend:**
```powershell
# Copy template
Copy-Item frontend\.env.example frontend\.env.development

# Edit with your values
notepad frontend\.env.development
```

---

## ✅ Verification System

### Automatic Environment Verification

The system runs `verify-environment.js` before startup:

```bash
node backend/verify-environment.js
```

**Checks performed:**
1. ✓ Environment variables present and valid
2. ✓ Directory structure exists
3. ✓ Node.js dependencies installed
4. ✓ PostgreSQL database connectivity
5. ✓ Port availability (4000, 3000)
6. ✓ File system permissions

### Manual Verification

```bash
# Backend verification
cd backend
npm run verify

# This will output:
# ═══ Checking environment variables ═══
# ✓ NODE_ENV = development
# ✓ PORT = 4000
# ✓ DATABASE_URL = postgresql://...
# ... (more checks)
# ═══ Environment verification summary ═══
# ✓ All checks passed! Ready to start server.
```

---

## 🏗️ Components Overview

### 1. Verification Script (`verify-environment.js`)

**Location:** `backend/verify-environment.js`

**Purpose:** Validates environment before startup

**Features:**
- Color-coded output (green=pass, red=fail, yellow=warning)
- Tests database connectivity
- Checks port availability
- Validates all required packages
- Creates missing directories

**Usage:**
```bash
npm run verify
```

### 2. Health Check Service

**Location:** `backend/src/services/HealthCheckService.js`

**Endpoints:**
- `GET /api/health` - Quick status (used by load balancers)
- `GET /api/health/full` - Detailed status (memory, CPU, uptime)
- `GET /api/health/db` - Database connectivity
- `GET /api/health/ready` - Kubernetes readiness probe
- `GET /api/health/alive` - Kubernetes liveness probe

**Example Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-29T22:47:10.914Z",
  "uptime": 501,
  "environment": "development",
  "services": {
    "database": "connected",
    "redis": "disabled",
    "smtp": "not_configured"
  }
}
```

### 3. Error Boundary Component

**Location:** `frontend/src/components/ErrorBoundaryRobust.jsx`

**Features:**
- Catches React errors globally
- Displays friendly error UI (not white screen)
- Shows dev-friendly stack traces in development
- Retry functionality
- Navigation to home page

**Usage in App.jsx:**
```jsx
import ErrorBoundaryRobust from './components/ErrorBoundaryRobust';

function App() {
  return (
    <ErrorBoundaryRobust>
      {/* Your app content */}
    </ErrorBoundaryRobust>
  );
}
```

### 4. Health Status Badge

**Location:** `frontend/src/components/HealthStatus.jsx`

**Features:**
- Real-time backend connectivity status
- Green/red indicator
- Clickable for detailed status
- Shows system metrics (memory, CPU, uptime)
- Auto-refresh every 10 seconds

**Usage in Header:**
```jsx
import HealthStatus from './components/HealthStatus';

function Header() {
  return (
    <>
      <HealthStatus />
      {/* Other header content */}
    </>
  );
}
```

### 5. Winston Logger

**Location:** `backend/src/config/logger.js`

**Features:**
- Console + file logging
- Multiple log levels (error, warn, info, http, debug)
- Log rotation (5 files, 5MB each)
- Separate error and combined logs
- Exception handling

**Usage:**
```javascript
const logger = require('./config/logger');

logger.info('Application started');
logger.error('Something went wrong', { error: err });
logger.debug('Debug information', { data: obj });
```

---

## 🚨 Error Handling

### Frontend Error Handling

#### Network Errors

```javascript
// In any component
try {
  const response = await fetch(`${process.env.REACT_APP_API_URL}/api/data`);
  const data = await response.json();
} catch (error) {
  // Error boundary will catch and display
  console.error('Network error:', error);
}
```

#### Component Errors

```javascript
// ErrorBoundary automatically catches these
throw new Error('Something went wrong');
// User sees friendly error UI instead of blank screen
```

### Backend Error Handling

#### Database Errors

```javascript
try {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
} catch (error) {
  logger.error('Database query failed', { 
    error: error.message,
    query: 'SELECT * FROM users'
  });
  res.status(500).json({ error: 'Database error' });
}
```

#### Express Error Middleware

```javascript
// Add to index.js
app.use((error, req, res, next) => {
  logger.error('Unhandled error', {
    message: error.message,
    stack: error.stack,
    url: req.url,
  });
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again'
  });
});
```

---

## 🔍 Health Monitoring

### Real-time Status Monitoring

1. **Frontend Badge**: Green/red indicator in bottom-right corner
2. **Click for Details**: Shows memory, CPU, database status
3. **Auto-refresh**: Updates every 10 seconds

### Log Files

```bash
# Backend logs location
logs/
├── combined.log    # All logs
├── error.log       # Errors only
├── http.log        # HTTP requests
├── exceptions.log  # Uncaught exceptions
└── rejections.log  # Promise rejections
```

### Monitoring Dashboard

```bash
# View real-time logs
docker-compose logs -f backend

# Or on your machine
tail -f backend/logs/combined.log
```

### Health Check Commands

```bash
# Quick health check
curl http://localhost:4000/api/health

# Detailed health check
curl http://localhost:4000/api/health/full

# Database connectivity
curl http://localhost:4000/api/health/db
```

---

## 🐳 Deployment Options

### Option 1: Docker (Recommended for Production)

```bash
# Build and start all services
docker-compose -f docker-compose-robust.yml up -d

# Services start in correct order:
# 1. PostgreSQL (with health check)
# 2. Backend (waits for DB)
# 3. Frontend (waits for backend)

# View status
docker ps

# View logs
docker logs akig_backend
docker logs akig_frontend

# Stop
docker-compose -f docker-compose-robust.yml down
```

### Option 2: PM2 (Node Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
cd backend
pm2 start "npm start" --name "akig-backend"

# Start frontend
cd ../frontend
pm2 start "npm start" --name "akig-frontend"

# Monitor
pm2 monit

# View logs
pm2 logs akig-backend
pm2 logs akig-frontend

# Stop
pm2 stop akig-backend akig-frontend
```

### Option 3: Kubernetes

```yaml
# Simple Kubernetes deployment (add to backend/k8s/deployment.yaml)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: akig-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: akig-backend
  template:
    metadata:
      labels:
        app: akig-backend
    spec:
      containers:
      - name: akig-backend
        image: akig:latest
        ports:
        - containerPort: 4000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: akig-secrets
              key: database-url
        livenessProbe:
          httpGet:
            path: /api/health/alive
            port: 4000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 4000
          initialDelaySeconds: 10
          periodSeconds: 5
```

---

## 🔧 Troubleshooting

### Problem: Port Already in Use

**Symptoms:** "Port 4000 is already in use"

**Solutions:**
```bash
# Find process using port 4000
netstat -ano | findstr :4000

# Kill process (replace PID)
taskkill /PID 12345 /F

# Or change port in .env
PORT=4001
```

### Problem: Database Connection Failed

**Symptoms:** "Error: connect ECONNREFUSED 127.0.0.1:5432"

**Solutions:**
```bash
# Check PostgreSQL is running
pg_isready

# Start PostgreSQL
brew services start postgresql  # macOS
service postgresql start         # Linux
# Windows: Start from Services

# Check connection string
# DATABASE_URL=postgresql://user:password@localhost:5432/akig_production
```

### Problem: npm install Fails

**Symptoms:** "npm ERR! code ERESOLVE"

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -r node_modules
npm install

# Or use legacy peer deps
npm install --legacy-peer-deps
```

### Problem: Frontend shows Blank Page

**Symptoms:** White/blank screen in browser

**Checks:**
```bash
# 1. Check browser console (F12)
# 2. Verify backend is running
curl http://localhost:4000/api/health

# 3. Check frontend logs
# Terminal where npm start is running

# 4. Check .env configuration
cat frontend/.env.development
```

### Problem: Backend Crashes on Startup

**Symptoms:** Process exits immediately

**Solutions:**
```bash
# 1. Run verification
cd backend
npm run verify

# 2. Check logs
cat logs/exceptions.log

# 3. Validate .env
npm run verify

# 4. Check database
npm run verify
```

### Problem: Health Badge Always Red

**Symptoms:** ❌ Offline indicator in frontend

**Solutions:**
```bash
# 1. Verify API URL
# Check frontend/.env.development
REACT_APP_API_URL=http://localhost:4000

# 2. Test API connectivity
curl http://localhost:4000/api/health

# 3. Check CORS settings
# backend/.env.development
CORS_ORIGIN=http://localhost:3000

# 4. Check browser console for errors
```

---

## 📊 Performance Tips

### Backend Optimization

```javascript
// Use connection pooling (already configured)
const pool = new Pool({
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Enable compression
app.use(compression());

// Cache responses
app.use(cacheMiddleware);
```

### Frontend Optimization

```javascript
// Code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Memoization for expensive components
const MemoizedComponent = memo(Component);

// Virtual scrolling for large lists
import { FixedSizeList } from 'react-window';
```

### Database Optimization

```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_transactions_date ON transactions(created_at);

-- Use prepared statements (already doing this with $1, $2, etc)
```

---

## 📈 Monitoring & Alerts

### Setting up Sentry (Error Tracking)

```javascript
// backend/src/config/sentry.js
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

module.exports = Sentry;
```

### Health Check Alerts

```javascript
// backend/src/services/HealthCheckService.js
// Add webhook/email alerts when unhealthy
if (!isHealthy) {
  // Send alert
  await notificationService.sendAlert({
    title: 'AKIG System Unhealthy',
    message: 'Backend health check failed',
  });
}
```

---

## 📚 Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Winston Logger](https://github.com/winstonjs/winston)

---

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review logs in `backend/logs/`
3. Run verification: `npm run verify`
4. Check GitHub issues: [AKIG Issues](https://github.com/akig/issues)

---

**Last Updated:** October 29, 2025  
**Version:** 1.0.0  
**Status:** Production Ready ✅

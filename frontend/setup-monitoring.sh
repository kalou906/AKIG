#!/bin/bash
# ===================================================================
# AKIG Frontend Monitoring Setup Script
# ===================================================================
# Installs and configures Sentry error tracking and Web Vitals
# monitoring for the frontend application
#
# Usage: bash setup-monitoring.sh
# ===================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
  echo -e "${RED}[✗]${NC} $1"
}

# Main setup
main() {
  echo -e "\n${BLUE}╔════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC} AKIG Frontend Monitoring Setup"
  echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

  # Check if npm is available
  if ! command -v npm &> /dev/null; then
    log_error "npm is not installed"
    exit 1
  fi

  log_info "npm version: $(npm --version)"

  # Navigate to frontend directory
  cd frontend || {
    log_error "frontend directory not found"
    exit 1
  }

  log_info "Installing Sentry packages..."
  npm install @sentry/react @sentry/tracing web-vitals

  if [ $? -eq 0 ]; then
    log_success "Packages installed successfully"
  else
    log_error "Failed to install packages"
    exit 1
  fi

  log_info "Creating .env configuration..."
  
  # Create .env if it doesn't exist
  if [ ! -f .env ]; then
    cat > .env << 'EOF'
# Application
REACT_APP_VERSION=1.0.0
REACT_APP_NAME=AKIG

# API
REACT_APP_API_URL=http://localhost:4000
REACT_APP_API_TIMEOUT=30000

# ===================================================================
# Error Tracking & Monitoring (Sentry)
# ===================================================================
# Get your DSN from https://sentry.io
REACT_APP_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0

# Enable/disable Sentry
REACT_APP_SENTRY_ENABLED=true

# Sentry environment
REACT_APP_SENTRY_ENVIRONMENT=development

# Trace sample rate (0.0 to 1.0)
REACT_APP_SENTRY_TRACE_SAMPLE_RATE=1.0

# Release tracking
REACT_APP_SENTRY_RELEASE=1.0.0

# ===================================================================
# Performance Monitoring (Web Vitals)
# ===================================================================
REACT_APP_WEB_VITALS_ENABLED=true

# ===================================================================
# Debug Settings
# ===================================================================
REACT_APP_DEBUG=false
EOF
    log_success ".env file created"
  else
    log_warning ".env file already exists"
  fi

  log_info "Setup instructions:"
  echo -e "${YELLOW}1. Get Sentry DSN:${NC}"
  echo "   - Go to https://sentry.io"
  echo "   - Create account (free)"
  echo "   - Create React project"
  echo "   - Copy DSN from project settings"
  echo ""
  echo -e "${YELLOW}2. Update .env:${NC}"
  echo "   - Edit frontend/.env"
  echo "   - Set REACT_APP_SENTRY_DSN=your-dsn-here"
  echo ""
  echo -e "${YELLOW}3. Initialize in App.jsx:${NC}"
  echo "   import { initializeMonitoring } from './monitoring';"
  echo "   initializeMonitoring();"
  echo ""
  echo -e "${YELLOW}4. Wrap app with error boundary:${NC}"
  echo "   import { Sentry } from './monitoring';"
  echo "   export default Sentry.withErrorBoundary(App);"
  echo ""

  log_success "Frontend monitoring setup completed!"
}

# Run main function
main

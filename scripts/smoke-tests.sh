#!/bin/bash
set -e

SERVICE_URL=$1

if [ -z "$SERVICE_URL" ]; then
  echo "Usage: $0 <service-url>"
  exit 1
fi

echo "🧪 Running smoke tests against $SERVICE_URL"

# Test health endpoint
echo "Testing /health..."
if ! curl -f -s "${SERVICE_URL}/health" > /dev/null; then
  echo "❌ Health check failed"
  exit 1
fi

echo "✅ Health check passed"

# Test solvency endpoint (need valid token)
echo "Testing /tenants/:id/solvency..."
if [ -n "$API_TOKEN" ]; then
  if ! curl -f -s -H "Authorization: Bearer ${API_TOKEN}" \
    "${SERVICE_URL}/tenants/demo-tenant-1/solvency" > /dev/null; then
    echo "❌ Solvency endpoint failed"
    exit 1
  fi
  echo "✅ Solvency endpoint passed"
else
  echo "⏭️  Skipping solvency test (no API_TOKEN set)"
fi

echo "✅ All smoke tests passed!"

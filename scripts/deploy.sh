#!/bin/bash
set -e

ENVIRONMENT=${1:-dev}
IMAGE_TAG=${2:-latest}
ECR_REGISTRY="123456789012.dkr.ecr.eu-west-1.amazonaws.com"

echo "🚀 Deploying to ${ENVIRONMENT}..."

# 1. Login AWS
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin $ECR_REGISTRY

# 2. Build & Push
docker build -t solvency-api:${IMAGE_TAG} ./backend
docker tag solvency-api:${IMAGE_TAG} ${ECR_REGISTRY}/solvency-api:${IMAGE_TAG}
docker push ${ECR_REGISTRY}/solvency-api:${IMAGE_TAG}

# 3. Update image in K8s
kubectl set image deployment/solvency-api api=${ECR_REGISTRY}/solvency-api:${IMAGE_TAG} -n solvency-ai

# 4. Wait for rollout
kubectl rollout status deployment/solvency-api -n solvency-ai --timeout=300s

# 5. Run smoke tests
echo "🧪 Running smoke tests..."
sleep 10
kubectl run smoke-test --rm -i --tty --image=curlimages/curl:latest --restart=Never -- \
  curl -f http://solvency-api-service.solvency-ai/health

echo "✅ Deployment successful!"

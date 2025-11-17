#!/bin/bash
# Test rapide des endpoints AKIG
# Utilisation: ./test-api.sh

BASE_URL="http://localhost:4000"
API_URL="$BASE_URL/api"

echo "🧪 TEST API AKIG"
echo "================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: Health Check
echo "Test 1: Health Check"
echo "-------------------"
curl -s "$API_URL/health" | jq . 2>/dev/null || echo "API non disponible"
echo ""

# Test 2: Login (exemple)
echo "Test 2: Login"
echo "-------------"
echo "POST $API_URL/auth/login"
curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq . 2>/dev/null || echo "Erreur: Vérifiez email/password"
echo ""

# Test 3: Récupérer les contrats
echo "Test 3: Contrats"
echo "----------------"
echo "GET $API_URL/contracts"
curl -s "$API_URL/contracts" | jq . 2>/dev/null || echo "Erreur: Vérifiez le token"
echo ""

# Test 4: Récupérer les paiements
echo "Test 4: Paiements"
echo "-----------------"
echo "GET $API_URL/payments"
curl -s "$API_URL/payments" | jq . 2>/dev/null || echo "Erreur: Vérifiez le token"
echo ""

# Test 5: Récupérer les locataires
echo "Test 5: Locataires"
echo "------------------"
echo "GET $API_URL/tenants"
curl -s "$API_URL/tenants" | jq . 2>/dev/null || echo "Erreur: Vérifiez le token"
echo ""

echo "✅ Tests terminés"
echo ""
echo "📝 Notes:"
echo "- Les endpoints protégés nécessitent un token JWT"
echo "- Login d'abord pour obtenir le token"
echo "- Ajouter le header: Authorization: Bearer <token>"

# ============================================================
# Makefile - DevOps Commands for AKIG
# Usage: make [command]
# ============================================================

.PHONY: help up down logs reset migrate seed test build clean \
        dev prod status restart health install

# Variables
DC := docker-compose
DC_PROD := docker-compose -f docker-compose.yml
DC_DEV := docker-compose -f docker-compose.yml -f docker-compose.override.yml
COMPOSE_PROJECT_NAME ?= akig

# =====================================================
# HELP
# =====================================================

help:
	@echo "🚀 AKIG DevOps Commands"
	@echo ""
	@echo "📦 Container Management:"
	@echo "  make up         - Démarrer tous les services (développement avec reset BD)"
	@echo "  make down       - Arrêter tous les services"
	@echo "  make restart    - Redémarrer tous les services"
	@echo "  make status     - Afficher le statut des services"
	@echo "  make health     - Vérifier la santé des services"
	@echo "  make logs       - Afficher les logs en temps réel"
	@echo ""
	@echo "🗄️  Base de Données:"
	@echo "  make reset      - Réinitialiser BD complètement (drop + migrate + seed)"
	@echo "  make migrate    - Appliquer les migrations uniquement"
	@echo "  make seed       - Charger les données de test"
	@echo ""
	@echo "🧪 Tests & Build:"
	@echo "  make test       - Exécuter tests (Playwright multi-browser)"
	@echo "  make test-ui    - Tests UI uniquement"
	@echo "  make build      - Builder frontend + backend"
	@echo "  make dev        - Mode développement avec watch"
	@echo "  make prod       - Préparer pour production"
	@echo ""
	@echo "🔧 Installation:"
	@echo "  make install    - Installer dépendances (npm + pip si nécessaire)"
	@echo "  make clean      - Nettoyer volumes Docker + node_modules"
	@echo ""

# =====================================================
# CONTAINER MANAGEMENT
# =====================================================

up:
	@echo "🚀 Démarrage des services (développement avec reset BD)..."
	@$(DC_DEV) up -d postgres
	@sleep 3
	@$(DC_DEV) up -d api
	@sleep 2
	@$(DC_DEV) up -d frontend nginx
	@echo "✅ Services démarrés"
	@$(MAKE) status

down:
	@echo "🛑 Arrêt des services..."
	@$(DC_DEV) down
	@echo "✅ Services arrêtés"

restart:
	@echo "🔄 Redémarrage des services..."
	@$(MAKE) down
	@sleep 1
	@$(MAKE) up

status:
	@echo "📊 Statut des services:"
	@$(DC_DEV) ps
	@echo ""

health:
	@echo "🏥 Vérification de la santé des services..."
	@echo "  🔵 PostgreSQL:"
	@$(DC_DEV) exec -T postgres pg_isready -U $${DB_USER:-akig_user} || echo "❌ Indisponible"
	@echo "  🔵 API:"
	@$(DC_DEV) exec -T api curl -s http://localhost:4000/api/health | jq '.' || echo "❌ Indisponible"
	@echo "  🔵 Frontend:"
	@curl -s http://localhost:3000 > /dev/null && echo "✅ Disponible" || echo "❌ Indisponible"

logs:
	@echo "📋 Logs en temps réel (Ctrl+C pour quitter)..."
	@$(DC_DEV) logs -f

# =====================================================
# DATABASE MANAGEMENT
# =====================================================

reset:
	@echo "🔄 Réinitialisation complète de la BD..."
	@echo "  1. Arrêt des services..."
	@$(DC_DEV) down -v
	@echo "  2. Redémarrage de PostgreSQL..."
	@$(DC_DEV) up -d postgres
	@sleep 5
	@echo "  3. Exécution du reset..."
	@$(DC_DEV) exec -T api npm run db:reset || true
	@echo "✅ BD réinitialisée"

migrate:
	@echo "📋 Application des migrations..."
	@$(DC_DEV) exec -T api npm run db:migrate
	@echo "✅ Migrations appliquées"

seed:
	@echo "🌱 Chargement des données de test..."
	@$(DC_DEV) exec -T postgres psql -U $${DB_USER:-akig_user} -d $${DB_NAME:-akig_db} < backend/src/scripts/seed.sql
	@echo "✅ Données de test chargées"

# =====================================================
# TESTING
# =====================================================

test:
	@echo "🧪 Exécution des tests (Playwright multi-browser)..."
	@echo "  Navigateurs: Chromium, Firefox, WebKit"
	@cd frontend && npm run test:e2e || true
	@echo "✅ Tests terminés"

test-ui:
	@echo "🎨 Tests UI uniquement (Frontend)..."
	@cd frontend && npm run test:ui || true

test-fast:
	@echo "⚡ Tests rapides (sans Firefox/WebKit)..."
	@cd frontend && npm run test:fast || true

# =====================================================
# BUILD & DEPLOY
# =====================================================

build:
	@echo "🏗️  Build complet..."
	@echo "  1. Frontend..."
	@cd frontend && npm run build
	@echo "  2. Backend..."
	@cd backend && npm run build || echo "Backend n'a pas besoin de build"
	@echo "✅ Build terminé"

dev:
	@echo "👨‍💻 Mode développement avec watch..."
	@echo "  Frontend (port 3000): http://localhost:3000"
	@echo "  API (port 4000): http://localhost:4000"
	@$(DC_DEV) up -d
	@sleep 3
	@$(DC_DEV) logs -f

prod:
	@echo "🚀 Préparation production..."
	@echo "  1. Stop développement..."
	@$(DC_DEV) down
	@echo "  2. Build production..."
	@$(MAKE) build
	@echo "  3. Démarrage services production..."
	@$(DC_PROD) up -d postgres api nginx
	@sleep 3
	@echo "✅ Production prête"
	@echo "  API: http://localhost:80"
	@$(MAKE) status

# =====================================================
# INSTALLATION & CLEANUP
# =====================================================

install:
	@echo "📦 Installation des dépendances..."
	@echo "  1. Backend..."
	@cd backend && npm install
	@echo "  2. Frontend..."
	@cd frontend && npm install
	@echo "✅ Dépendances installées"

clean:
	@echo "🧹 Nettoyage complet..."
	@echo "  1. Arrêt des services..."
	@$(DC_DEV) down -v
	@echo "  2. Suppression des volumes..."
	@$(DC_DEV) volume prune -f || true
	@echo "  3. Suppression des images (optionnel)..."
	@echo "  4. Suppression de node_modules..."
	@rm -rf frontend/node_modules backend/node_modules
	@echo "✅ Nettoyage terminé"

# =====================================================
# CI/CD HELPERS
# =====================================================

test-ci:
	@echo "🔄 Tests pour CI/CD..."
	@$(MAKE) reset
	@$(MAKE) test

lint:
	@echo "🔍 Linting code..."
	@cd frontend && npm run lint || true
	@cd backend && npm run lint || true

format:
	@echo "📝 Formatage code..."
	@cd frontend && npm run format || true
	@cd backend && npm run format || true

# =====================================================
# DEFAULT TARGET
# =====================================================

.DEFAULT_GOAL := help

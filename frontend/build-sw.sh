#!/bin/bash
# Script pour compiler le Service Worker avec TypeScript
# Ce script est appelé après le build React

echo "🔨 Compilation du Service Worker..."

# Utiliser tsc pour compiler sw.ts
npx tsc src/sw.ts \
  --outDir public \
  --target ES2020 \
  --module ESNext \
  --lib ES2020,DOM,WebWorker \
  --skipLibCheck \
  --esModuleInterop \
  --allowJs \
  --declaration false \
  --sourceMap false

# Renommer le fichier
if [ -f "public/sw.js" ]; then
  echo "✅ Service Worker compilé: public/sw.js"
else
  echo "❌ Erreur lors de la compilation du Service Worker"
  exit 1
fi

echo "✅ Service Worker prêt pour la production!"

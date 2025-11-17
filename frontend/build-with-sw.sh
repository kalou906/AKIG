#!/bin/bash
# Script de build personnalisé qui compile React + Service Worker

echo "📦 Build AKIG avec Service Worker..."

# Build React normal
echo "🔨 Compilation React..."
react-scripts build

# Vérifier si le build a réussi
if [ $? -ne 0 ]; then
  echo "❌ Erreur lors du build React"
  exit 1
fi

# Compiler le Service Worker
echo "🔨 Compilation du Service Worker..."
npx tsc src/sw.ts \
  --outDir build \
  --target ES2020 \
  --module ESNext \
  --lib ES2020,DOM,WebWorker \
  --skipLibCheck \
  --esModuleInterop \
  --allowJs \
  --declaration false \
  --sourceMap false \
  --removeComments

# Vérifier si la compilation SW a réussi
if [ $? -ne 0 ]; then
  echo "❌ Erreur lors de la compilation du Service Worker"
  exit 1
fi

if [ -f "build/sw.js" ]; then
  echo "✅ Service Worker compilé: build/sw.js"
else
  echo "❌ Fichier build/sw.js non trouvé"
  exit 1
fi

echo "✅ Build complet (React + Service Worker) terminé!"
ls -lah build/sw.js

#!/usr/bin/env node

/**
 * Script de diagnostic des routes
 * Identifie les doublons et consolide les routes
 */

const fs = require('fs');
const path = require('path');

const ROUTES_DIR = path.join(__dirname, '../routes');

console.log('\n📊 ANALYSE DES ROUTES\n');
console.log('='.repeat(60));

const files = fs.readdirSync(ROUTES_DIR).filter((f) => f.endsWith('.js'));

// Grouper par nom de module (sans extension et variante)
const moduleMap = new Map();

files.forEach((file) => {
  // Extraire le nom de base (avant .routes, -new, .ts, etc.)
  const baseName = file
    .replace('.js', '')
    .replace('.ts', '')
    .replace('.routes', '')
    .replace('-new', '')
    .replace('-old', '')
    .toLowerCase();

  if (!moduleMap.has(baseName)) {
    moduleMap.set(baseName, []);
  }
  moduleMap.set(baseName, [...moduleMap.get(baseName), file]);
});

// Afficher les doublons
let duplicateCount = 0;
const duplicates = [];

moduleMap.forEach((files, moduleName) => {
  if (files.length > 1) {
    duplicateCount += files.length - 1;
    duplicates.push({ module: moduleName, files });
    console.log(`\n⚠️  DOUBLON: ${moduleName}`);
    files.forEach((f, i) => {
      console.log(`   ${i + 1}. ${f}`);
    });
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📈 RÉSUMÉ:`);
console.log(`   Total fichiers: ${files.length}`);
console.log(`   Modules uniques: ${moduleMap.size}`);
console.log(`   Doublons détectés: ${duplicateCount}`);
console.log(`   Groupes redondants: ${duplicates.length}`);

if (duplicates.length > 0) {
  console.log('\n🔧 RECOMMANDATIONS DE CONSOLIDATION:\n');
  duplicates.forEach(({ module, files }, i) => {
    console.log(`${i + 1}. Combiner en UN SEUL fichier: ${module}.js`);
    console.log(`   Fusionner le contenu de: ${files.join(', ')}`);
    console.log(`   Puis supprimer les autres fichiers\n`);
  });
}

console.log('='.repeat(60) + '\n');

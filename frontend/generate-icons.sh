#!/bin/bash
# Script pour générer les icônes PWA avec ImageMagick
# Installation: brew install imagemagick || apt-get install imagemagick

mkdir -p public/icons

# Couleur de base du logo AKIG
BRAND_COLOR="#0f766e"
BG_COLOR="white"

echo "🎨 Génération des icônes PWA..."

# Fonction pour créer une icône SVG
create_svg_icon() {
  local size=$1
  local filename=$2
  
  cat > "public/icons/$filename.svg" <<EOF
<svg width="$size" height="$size" viewBox="0 0 $size $size" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f766e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#155e53;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="$size" height="$size" fill="white"/>
  <circle cx="$((size/2))" cy="$((size/2))" r="$((size/2 - 10))" fill="url(#grad)"/>
  <text x="50%" y="50%" font-size="$((size/3))" font-weight="bold" fill="white" text-anchor="middle" dy="0.3em" font-family="Arial">A</text>
</svg>
EOF
  
  # Convertir SVG en PNG avec ImageMagick
  if command -v convert &> /dev/null; then
    convert "public/icons/$filename.svg" -background white -alpha off "public/icons/$filename.png"
    rm "public/icons/$filename.svg"
    echo "✅ $filename.png ($size×$size)"
  else
    echo "⚠️  ImageMagick non trouvé - Gardez le SVG"
  fi
}

# Créer les icônes requises
create_svg_icon 192 "icon-192"
create_svg_icon 512 "icon-512"
create_svg_icon 192 "icon-maskable-192"
create_svg_icon 512 "icon-maskable-512"

# Créer les raccourcis (petits)
create_svg_icon 96 "shortcut-tenants"
create_svg_icon 96 "shortcut-contracts"

echo "✅ Génération des icônes terminée!"
echo "📁 Les icônes sont dans public/icons/"
echo ""
echo "Pour utiliser des vraies icônes, vous pouvez:"
echo "1. Utiliser un design tool (Figma, Adobe XD)"
echo "2. Télécharger depuis une librairie d'icônes"
echo "3. Utiliser ImageMagick manuellement avec des images source"

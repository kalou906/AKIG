#!/usr/bin/env python3
"""
Favicon Generator for AKIG
Generates multiple favicon sizes from logo.png using PIL
Usage: python generate_favicons.py
"""

from PIL import Image
import os
import json
from pathlib import Path

# Configuration
LOGO_PATH = "frontend/public/assets/logos/logo.png"
OUTPUT_DIR = "frontend/public"
ICON_SIZES = [32, 192, 512]
FAVICON_FILENAME = "favicon.ico"

def generate_favicons():
    """Generate favicon versions from logo.png"""
    
    try:
        # Vérifier si logo.png existe
        if not os.path.exists(LOGO_PATH):
            print(f"❌ Logo not found: {LOGO_PATH}")
            return False
        
        # Ouvrir l'image
        logo = Image.open(LOGO_PATH)
        print(f"✓ Logo chargé: {LOGO_PATH} ({logo.size})")
        
        # Générer les favicons
        for size in ICON_SIZES:
            # Créer une image carrée avec fond blanc
            favicon = Image.new('RGBA', (size, size), (255, 255, 255, 0))
            
            # Redimensionner le logo
            logo_resized = logo.copy()
            logo_resized.thumbnail((size - 8, size - 8), Image.Resampling.LANCZOS)
            
            # Calculer les positions pour centrer
            x = (size - logo_resized.width) // 2
            y = (size - logo_resized.height) // 2
            
            # Coller le logo
            if logo_resized.mode == 'RGBA':
                favicon.paste(logo_resized, (x, y), logo_resized)
            else:
                favicon.paste(logo_resized, (x, y))
            
            # Sauvegarder le favicon
            output_path = os.path.join(OUTPUT_DIR, f"favicon-{size}x{size}.png")
            favicon.save(output_path, 'PNG')
            print(f"✓ Favicon généré: {output_path} ({size}x{size}px)")
        
        # Générer aussi favicon.ico (32x32)
        favicon_ico = Image.new('RGBA', (32, 32), (255, 255, 255, 0))
        logo_resized = logo.copy()
        logo_resized.thumbnail((24, 24), Image.Resampling.LANCZOS)
        x = (32 - logo_resized.width) // 2
        y = (32 - logo_resized.height) // 2
        if logo_resized.mode == 'RGBA':
            favicon_ico.paste(logo_resized, (x, y), logo_resized)
        else:
            favicon_ico.paste(logo_resized, (x, y))
        favicon_ico_path = os.path.join(OUTPUT_DIR, FAVICON_FILENAME)
        favicon_ico.save(favicon_ico_path, 'ICO')
        print(f"✓ Favicon ICO généré: {favicon_ico_path} (32x32px)")
        
        return True
    
    except Exception as e:
        print(f"❌ Erreur lors de la génération: {e}")
        return False

def update_manifest():
    """Update manifest.json with new favicon icons"""
    
    manifest_path = os.path.join(OUTPUT_DIR, "manifest.json")
    
    try:
        # Lire le manifest existant
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
        
        # Mettre à jour les icônes
        manifest['icons'] = [
            {
                "src": "/favicon-32x32.png",
                "sizes": "32x32",
                "type": "image/png",
                "purpose": "any"
            },
            {
                "src": "/favicon-192x192.png",
                "sizes": "192x192",
                "type": "image/png",
                "purpose": "any"
            },
            {
                "src": "/favicon-512x512.png",
                "sizes": "512x512",
                "type": "image/png",
                "purpose": "any"
            },
            {
                "src": "/favicon-192x192.png",
                "sizes": "192x192",
                "type": "image/png",
                "purpose": "maskable"
            }
        ]
        
        # Sauvegarder le manifest
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Manifest.json mis à jour avec nouveaux icônes")
        return True
    
    except Exception as e:
        print(f"❌ Erreur lors de la mise à jour du manifest: {e}")
        return False

def print_html_tags():
    """Print HTML tags to add to index.html"""
    
    print("\n" + "="*60)
    print("📝 Ajoutez ces tags à <head> dans public/index.html:")
    print("="*60)
    
    html = """
    <!-- Favicons -->
    <link rel="icon" type="image/x-icon" href="%PUBLIC_URL%/favicon.ico">
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/favicon-192x192.png">
    <link rel="icon" type="image/png" sizes="32x32" href="%PUBLIC_URL%/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="192x192" href="%PUBLIC_URL%/favicon-192x192.png">
    <link rel="icon" type="image/png" sizes="512x512" href="%PUBLIC_URL%/favicon-512x512.png">
"""
    print(html)
    print("="*60 + "\n")

def main():
    """Main execution"""
    
    print("\n" + "="*60)
    print("🎨 AKIG Favicon Generator")
    print("="*60 + "\n")
    
    # Générer les favicons
    if not generate_favicons():
        return False
    
    print()
    
    # Mettre à jour le manifest
    if not update_manifest():
        return False
    
    print()
    
    # Afficher les tags HTML
    print_html_tags()
    
    print("✅ Favicons générés avec succès!")
    print("📝 Prochaine étape: Ajouter les tags HTML et redémarrer le serveur\n")
    
    return True

if __name__ == "__main__":
    main()

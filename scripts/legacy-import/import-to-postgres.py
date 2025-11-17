#!/usr/bin/env python3
"""
AKIG - Import de Données Legacy vers PostgreSQL
Import sécurisé avec transactions, validation et rollback
Author: AKIG Dev Team
"""

import json
import sys
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any
import psycopg2
from psycopg2 import sql
from psycopg2.extras import execute_batch

class LegacyDataImporter:
    """Importeur de données legacy vers PostgreSQL"""
    
    # Ordre d'import (respecte les contraintes FK)
    IMPORT_ORDER = [
        ("proprietaires", "owners"),
        ("immeubles", "sites"),
        ("locaux", "properties"),
        ("locataires", "tenants"),
        ("contrats", "contracts"),
        ("loyers", "rent_payments"),
        ("paiements", "payments"),
        ("charges", "charges")
    ]
    
    def __init__(self, database_url: str, categorized_data_dir: str, dry_run: bool = False):
        """
        Initialise l'importeur
        
        Args:
            database_url: URL de connexion PostgreSQL
            categorized_data_dir: Répertoire contenant les fichiers JSON catégorisés
            dry_run: Si True, simule l'import sans écrire en base
        """
        self.database_url = database_url
        self.data_dir = Path(categorized_data_dir)
        self.dry_run = dry_run
        self.conn = None
        self.cursor = None
        
        self.import_stats = {
            "start_time": datetime.now().isoformat(),
            "dry_run": dry_run,
            "imported": {},
            "errors": {},
            "warnings": []
        }
        
    def connect(self):
        """Établit la connexion à la base de données"""
        print(f"🔌 Connexion à la base de données...")
        
        if self.dry_run:
            print("  ⚠️  MODE DRY-RUN activé (aucune modification réelle)")
        
        try:
            self.conn = psycopg2.connect(self.database_url)
            self.conn.autocommit = False  # Transactions manuelles
            self.cursor = self.conn.cursor()
            print("  ✅ Connexion établie")
            
            # Vérifier les tables existantes
            self._check_target_tables()
            
        except Exception as e:
            print(f"  ❌ Erreur de connexion: {e}")
            raise
    
    def _check_target_tables(self):
        """Vérifie que les tables cibles existent"""
        print("\n🔍 Vérification des tables cibles...")
        
        for source_category, target_table in self.IMPORT_ORDER:
            self.cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = %s
                )
            """, (target_table,))
            
            exists = self.cursor.fetchone()[0]
            
            if exists:
                print(f"  ✓ {target_table}")
            else:
                print(f"  ❌ Table manquante: {target_table}")
                raise Exception(f"Table {target_table} non trouvée. Exécutez les migrations d'abord.")
    
    def import_all(self):
        """Importe toutes les catégories"""
        print("\n" + "=" * 80)
        print("📦 IMPORT DES DONNÉES LEGACY")
        print("=" * 80)
        
        try:
            for source_category, target_table in self.IMPORT_ORDER:
                json_file = self.data_dir / f"{source_category}.json"
                
                if not json_file.exists():
                    print(f"\n⏭️  Fichier non trouvé: {json_file.name}, passage à la suite")
                    continue
                
                print(f"\n{'='*60}")
                print(f"📂 Import: {source_category} → {target_table}")
                print(f"{'='*60}")
                
                self._import_category(source_category, target_table, json_file)
            
            if not self.dry_run:
                print("\n✅ Commit des transactions...")
                self.conn.commit()
                print("  ✓ Toutes les données importées avec succès")
            else:
                print("\n⚠️  Rollback (dry-run mode)")
                self.conn.rollback()
            
            self._generate_import_report()
            
        except Exception as e:
            print(f"\n❌ ERREUR CRITIQUE: {e}")
            if self.conn:
                print("  ↩️  Rollback de toutes les transactions...")
                self.conn.rollback()
            raise
        finally:
            if self.cursor:
                self.cursor.close()
            if self.conn:
                self.conn.close()
    
    def _import_category(self, source_category: str, target_table: str, json_file: Path):
        """Importe une catégorie de données"""
        
        # Charger les données
        with open(json_file, 'r', encoding='utf-8') as f:
            records = json.load(f)
        
        if not records:
            print(f"  ⚠️  Aucune donnée à importer")
            return
        
        print(f"  📊 {len(records)} enregistrements à importer")
        
        # Préparer les colonnes et valeurs
        if not records:
            return
        
        # Extraire les colonnes communes (exclure les metadata)
        sample_record = records[0]
        columns = [col for col in sample_record.keys() if not col.startswith('_')]
        
        print(f"  📋 Colonnes: {', '.join(columns)}")
        
        # Préparer la requête INSERT
        placeholders = ', '.join(['%s'] * len(columns))
        insert_query = sql.SQL("""
            INSERT INTO {} ({})
            VALUES ({})
            ON CONFLICT (id) DO UPDATE SET {}
        """).format(
            sql.Identifier(target_table),
            sql.SQL(', ').join(map(sql.Identifier, columns)),
            sql.SQL(placeholders),
            sql.SQL(', ').join([
                sql.SQL("{} = EXCLUDED.{}").format(sql.Identifier(col), sql.Identifier(col))
                for col in columns if col != 'id'
            ])
        )
        
        # Préparer les valeurs
        values_list = []
        errors_count = 0
        
        for idx, record in enumerate(records, 1):
            try:
                values = [record.get(col) for col in columns]
                values_list.append(values)
            except Exception as e:
                errors_count += 1
                if source_category not in self.import_stats["errors"]:
                    self.import_stats["errors"][source_category] = []
                self.import_stats["errors"][source_category].append({
                    "record_index": idx,
                    "error": str(e),
                    "record": record
                })
        
        if errors_count > 0:
            print(f"  ⚠️  {errors_count} enregistrements avec erreurs (ignorés)")
        
        # Import par batch
        if values_list:
            try:
                if self.dry_run:
                    print(f"  🔄 [DRY-RUN] Importerait {len(values_list)} enregistrements")
                    print(f"  🔍 Exemple de requête:")
                    print(f"    {insert_query.as_string(self.conn)[:200]}...")
                else:
                    print(f"  🔄 Import en cours...")
                    execute_batch(self.cursor, insert_query, values_list, page_size=100)
                    print(f"  ✅ {len(values_list)} enregistrements importés")
                
                self.import_stats["imported"][source_category] = {
                    "table": target_table,
                    "count": len(values_list),
                    "errors": errors_count
                }
                
            except Exception as e:
                print(f"  ❌ Erreur d'import: {e}")
                raise
    
    def _generate_import_report(self):
        """Génère le rapport d'import"""
        self.import_stats["end_time"] = datetime.now().isoformat()
        
        report_path = Path("c:/AKIG/scripts/legacy-import/import-report.json")
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(self.import_stats, f, indent=2, ensure_ascii=False)
        
        print("\n" + "=" * 80)
        print("📊 RAPPORT D'IMPORT - RÉSUMÉ")
        print("=" * 80)
        
        if self.import_stats["imported"]:
            total_imported = sum(cat["count"] for cat in self.import_stats["imported"].values())
            total_errors = sum(cat["errors"] for cat in self.import_stats["imported"].values())
            
            print(f"\n✅ Total importé: {total_imported} enregistrements")
            if total_errors > 0:
                print(f"⚠️  Total erreurs: {total_errors}")
            
            print(f"\n📂 Détails par catégorie:")
            for category, stats in self.import_stats["imported"].items():
                print(f"  • {category} → {stats['table']}: {stats['count']} enregistrements")
                if stats['errors'] > 0:
                    print(f"    ⚠️  {stats['errors']} erreurs")
        
        if self.import_stats["errors"]:
            print(f"\n❌ Catégories avec erreurs:")
            for category in self.import_stats["errors"]:
                print(f"  • {category}: {len(self.import_stats['errors'][category])} erreurs")
        
        print(f"\n💾 Rapport sauvegardé: {report_path}")
        
        print("\n" + "=" * 80)
        print("🎯 PROCHAINES ÉTAPES:")
        print("=" * 80)
        print("1. Vérifier les données importées dans la base")
        print("2. Exécuter les tests de cohérence")
        print("3. Vérifier les relations FK")
        print("4. Tester l'application avec les nouvelles données")
        print("\n✨ Import terminé !\n")

def main():
    if len(sys.argv) < 3:
        print("Usage: python import-to-postgres.py <database-url> <categorized-data-dir> [--dry-run]")
        print("\nExemple:")
        print("  python import-to-postgres.py")
        print("    postgresql://user:pass@localhost:5432/akig_db")
        print("    c:/AKIG/scripts/legacy-import/categorized-data")
        print("    --dry-run")
        sys.exit(1)
    
    database_url = sys.argv[1]
    categorized_data_dir = sys.argv[2]
    dry_run = "--dry-run" in sys.argv
    
    # Vérifier que le répertoire existe
    if not Path(categorized_data_dir).exists():
        print(f"❌ Répertoire introuvable: {categorized_data_dir}")
        sys.exit(1)
    
    importer = LegacyDataImporter(database_url, categorized_data_dir, dry_run=dry_run)
    
    try:
        importer.connect()
        importer.import_all()
    except KeyboardInterrupt:
        print("\n\n⚠️  Import interrompu par l'utilisateur")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erreur fatale: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

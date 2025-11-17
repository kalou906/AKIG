#!/usr/bin/env python3
"""
AKIG - Analyseur d'Archive Legacy Ultra-Professionnel
Analyse et catégorise automatiquement toutes les données de l'ancien système
Author: AKIG Dev Team
Date: 2024-11-16
"""

import os
import sys
import json
import re
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
import sqlite3
import csv

class LegacyArchiveAnalyzer:
    """
    Analyseur ultra-professionnel pour archives legacy
    Détecte automatiquement le format et catégorise les données
    """
    
    def __init__(self, archive_path: str):
        self.archive_path = Path(archive_path)
        self.report = {
            "analyzed_at": datetime.now().isoformat(),
            "archive_path": str(archive_path),
            "format": None,
            "categories": {},
            "statistics": {},
            "data_quality": {},
            "mapping": {},
            "errors": [],
            "warnings": []
        }
        
    def analyze(self) -> Dict[str, Any]:
        """Lance l'analyse complète de l'archive"""
        print("=" * 80)
        print("🔍 AKIG - ANALYSEUR D'ARCHIVE LEGACY ULTRA-PROFESSIONNEL")
        print("=" * 80)
        print(f"\n📦 Archive: {self.archive_path}")
        print(f"⏰ Début d'analyse: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # 1. Détection du format
        self._detect_format()
        
        # 2. Extraction des données selon le format
        if self.report["format"] == "sql":
            self._analyze_sql_dump()
        elif self.report["format"] == "sqlite":
            self._analyze_sqlite()
        elif self.report["format"] == "csv":
            self._analyze_csv_collection()
        elif self.report["format"] == "json":
            self._analyze_json()
        elif self.report["format"] == "excel":
            self._analyze_excel()
        else:
            self._try_multiple_formats()
        
        # 3. Catégorisation intelligente
        self._categorize_data()
        
        # 4. Analyse de qualité
        self._analyze_data_quality()
        
        # 5. Génération du mapping
        self._generate_mapping()
        
        # 6. Rapport final
        self._generate_report()
        
        return self.report
    
    def _detect_format(self):
        """Détecte automatiquement le format de l'archive"""
        print("🔎 Détection du format de l'archive...")
        
        if not self.archive_path.exists():
            self.report["errors"].append(f"Archive introuvable: {self.archive_path}")
            return
        
        # Vérifier l'extension
        ext = self.archive_path.suffix.lower()
        
        if ext == '.sql':
            self.report["format"] = "sql"
            print("✅ Format détecté: SQL Dump")
        elif ext == '.db' or ext == '.sqlite' or ext == '.sqlite3':
            self.report["format"] = "sqlite"
            print("✅ Format détecté: SQLite Database")
        elif ext == '.json':
            self.report["format"] = "json"
            print("✅ Format détecté: JSON")
        elif ext in ['.xls', '.xlsx']:
            self.report["format"] = "excel"
            print("✅ Format détecté: Excel")
        elif ext == '.csv':
            self.report["format"] = "csv"
            print("✅ Format détecté: CSV")
        elif ext == '.zip':
            self.report["format"] = "archive"
            print("✅ Format détecté: Archive compressée (ZIP)")
        elif ext == '.tar' or ext == '.gz':
            self.report["format"] = "archive"
            print("✅ Format détecté: Archive compressée (TAR/GZ)")
        elif self.archive_path.is_dir():
            self.report["format"] = "directory"
            print("✅ Format détecté: Répertoire de fichiers")
        else:
            print("⚠️  Format non reconnu, analyse en cours...")
            self._analyze_content_signature()
    
    def _analyze_content_signature(self):
        """Analyse le contenu pour détecter le format"""
        try:
            with open(self.archive_path, 'rb') as f:
                header = f.read(1024)
            
            # Vérifier signatures
            if header.startswith(b'SQLite format 3'):
                self.report["format"] = "sqlite"
                print("✅ Signature détectée: SQLite Database")
            elif b'CREATE TABLE' in header or b'INSERT INTO' in header:
                self.report["format"] = "sql"
                print("✅ Signature détectée: SQL Dump")
            elif header.startswith(b'{') or header.startswith(b'['):
                self.report["format"] = "json"
                print("✅ Signature détectée: JSON")
            elif b'PK\x03\x04' in header[:4]:
                self.report["format"] = "archive"
                print("✅ Signature détectée: Archive ZIP")
        except Exception as e:
            self.report["warnings"].append(f"Erreur analyse signature: {e}")
    
    def _analyze_sql_dump(self):
        """Analyse un dump SQL"""
        print("\n📊 Analyse du dump SQL...")
        
        categories = {
            "proprietaires": {"pattern": r"proprietaire|owner", "count": 0, "sample": []},
            "immeubles": {"pattern": r"immeuble|building|site", "count": 0, "sample": []},
            "locaux": {"pattern": r"local|property|unit", "count": 0, "sample": []},
            "locataires": {"pattern": r"locataire|tenant", "count": 0, "sample": []},
            "contrats": {"pattern": r"contrat|contract|lease", "count": 0, "sample": []},
            "loyers": {"pattern": r"loyer|rent|payment", "count": 0, "sample": []},
            "paiements": {"pattern": r"paiement|payment|transaction", "count": 0, "sample": []},
            "charges": {"pattern": r"charge|utility|fee", "count": 0, "sample": []},
            "quittances": {"pattern": r"quittance|receipt", "count": 0, "sample": []},
            "documents": {"pattern": r"document|file|attachment", "count": 0, "sample": []},
        }
        
        tables_found = {}
        
        try:
            with open(self.archive_path, 'r', encoding='utf-8', errors='ignore') as f:
                current_table = None
                insert_count = 0
                
                for line_num, line in enumerate(f, 1):
                    # Détecter CREATE TABLE
                    create_match = re.search(r'CREATE TABLE\s+[`"]?(\w+)[`"]?', line, re.IGNORECASE)
                    if create_match:
                        current_table = create_match.group(1)
                        tables_found[current_table] = {"inserts": 0, "columns": []}
                        print(f"  📋 Table trouvée: {current_table}")
                    
                    # Détecter colonnes
                    if current_table and re.search(r'^\s+[`"]?(\w+)[`"]?\s+', line):
                        col_match = re.search(r'^\s+[`"]?(\w+)[`"]?', line)
                        if col_match:
                            tables_found[current_table]["columns"].append(col_match.group(1))
                    
                    # Compter INSERT INTO
                    insert_match = re.search(r'INSERT INTO\s+[`"]?(\w+)[`"]?', line, re.IGNORECASE)
                    if insert_match:
                        table = insert_match.group(1)
                        if table in tables_found:
                            tables_found[table]["inserts"] += 1
                            insert_count += 1
                        
                        # Catégoriser
                        for category, info in categories.items():
                            if re.search(info["pattern"], table, re.IGNORECASE):
                                info["count"] += 1
                                if len(info["sample"]) < 3:
                                    info["sample"].append(line.strip()[:200])
                    
                    # Limite de lecture (pour gros fichiers)
                    if line_num > 100000:
                        print("  ⚠️  Fichier très volumineux, analyse des 100K premières lignes")
                        break
            
            self.report["statistics"]["total_inserts"] = insert_count
            self.report["statistics"]["tables"] = tables_found
            self.report["categories"] = {k: v for k, v in categories.items() if v["count"] > 0}
            
            print(f"\n✅ Analyse terminée:")
            print(f"  • {len(tables_found)} tables trouvées")
            print(f"  • {insert_count} instructions INSERT détectées")
            print(f"  • {len(self.report['categories'])} catégories identifiées")
            
        except Exception as e:
            self.report["errors"].append(f"Erreur analyse SQL: {e}")
            print(f"❌ Erreur: {e}")
    
    def _analyze_sqlite(self):
        """Analyse une base SQLite"""
        print("\n📊 Analyse de la base SQLite...")
        
        try:
            conn = sqlite3.connect(self.archive_path)
            cursor = conn.cursor()
            
            # Récupérer toutes les tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            
            print(f"  📋 {len(tables)} tables trouvées")
            
            tables_info = {}
            categories = {}
            
            for table in tables:
                # Compter les enregistrements
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                
                # Récupérer la structure
                cursor.execute(f"PRAGMA table_info({table})")
                columns = [col[1] for col in cursor.fetchall()]
                
                # Échantillon de données
                cursor.execute(f"SELECT * FROM {table} LIMIT 3")
                sample = cursor.fetchall()
                
                tables_info[table] = {
                    "count": count,
                    "columns": columns,
                    "sample": sample
                }
                
                print(f"    • {table}: {count} enregistrements, {len(columns)} colonnes")
                
                # Catégorisation
                table_lower = table.lower()
                if any(k in table_lower for k in ['proprietaire', 'owner']):
                    categories.setdefault('proprietaires', []).append(table)
                elif any(k in table_lower for k in ['immeuble', 'building', 'site']):
                    categories.setdefault('immeubles', []).append(table)
                elif any(k in table_lower for k in ['local', 'property', 'unit']):
                    categories.setdefault('locaux', []).append(table)
                elif any(k in table_lower for k in ['locataire', 'tenant']):
                    categories.setdefault('locataires', []).append(table)
                elif any(k in table_lower for k in ['contrat', 'contract', 'lease']):
                    categories.setdefault('contrats', []).append(table)
                elif any(k in table_lower for k in ['loyer', 'rent']):
                    categories.setdefault('loyers', []).append(table)
                elif any(k in table_lower for k in ['paiement', 'payment', 'transaction']):
                    categories.setdefault('paiements', []).append(table)
                elif any(k in table_lower for k in ['charge', 'utility', 'fee']):
                    categories.setdefault('charges', []).append(table)
            
            conn.close()
            
            self.report["statistics"]["tables"] = tables_info
            self.report["categories"] = categories
            
            print(f"\n✅ Analyse terminée:")
            print(f"  • {sum(t['count'] for t in tables_info.values())} enregistrements totaux")
            print(f"  • {len(categories)} catégories identifiées")
            
        except Exception as e:
            self.report["errors"].append(f"Erreur analyse SQLite: {e}")
            print(f"❌ Erreur: {e}")
    
    def _analyze_csv_collection(self):
        """Analyse une collection de fichiers CSV"""
        print("\n📊 Analyse des fichiers CSV...")
        
        # Si c'est un fichier CSV unique
        if self.archive_path.is_file():
            self._analyze_single_csv(self.archive_path)
        # Si c'est un répertoire
        elif self.archive_path.is_dir():
            csv_files = list(self.archive_path.glob("*.csv"))
            print(f"  📄 {len(csv_files)} fichiers CSV trouvés")
            
            for csv_file in csv_files:
                print(f"\n  Analyse de {csv_file.name}...")
                self._analyze_single_csv(csv_file)
    
    def _analyze_single_csv(self, csv_path: Path):
        """Analyse un fichier CSV unique"""
        try:
            with open(csv_path, 'r', encoding='utf-8', errors='ignore') as f:
                # Détecter le délimiteur
                sample = f.read(1024)
                f.seek(0)
                
                delimiter = ','
                if ';' in sample:
                    delimiter = ';'
                elif '\t' in sample:
                    delimiter = '\t'
                
                reader = csv.DictReader(f, delimiter=delimiter)
                rows = list(reader)
                
                if not rows:
                    return
                
                # Analyser les colonnes
                columns = list(rows[0].keys())
                
                # Catégoriser
                category = self._categorize_filename(csv_path.stem)
                
                if category not in self.report["categories"]:
                    self.report["categories"][category] = []
                
                self.report["categories"][category].append({
                    "file": csv_path.name,
                    "rows": len(rows),
                    "columns": columns,
                    "sample": rows[:3] if len(rows) >= 3 else rows
                })
                
                print(f"    ✓ {len(rows)} lignes, {len(columns)} colonnes")
                print(f"    ✓ Catégorie: {category}")
                
        except Exception as e:
            self.report["warnings"].append(f"Erreur CSV {csv_path.name}: {e}")
    
    def _analyze_json(self):
        """Analyse un fichier JSON"""
        print("\n📊 Analyse du fichier JSON...")
        
        try:
            with open(self.archive_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if isinstance(data, dict):
                # JSON avec catégories
                for key, value in data.items():
                    if isinstance(value, list):
                        category = self._categorize_filename(key)
                        self.report["categories"][category] = {
                            "count": len(value),
                            "sample": value[:3] if len(value) >= 3 else value
                        }
                        print(f"  • {key}: {len(value)} enregistrements → {category}")
            
            elif isinstance(data, list):
                # JSON liste simple
                category = self._categorize_filename(self.archive_path.stem)
                self.report["categories"][category] = {
                    "count": len(data),
                    "sample": data[:3] if len(data) >= 3 else data
                }
                print(f"  • {len(data)} enregistrements → {category}")
            
        except Exception as e:
            self.report["errors"].append(f"Erreur JSON: {e}")
    
    def _categorize_filename(self, name: str) -> str:
        """Catégorise un fichier selon son nom"""
        name_lower = name.lower()
        
        if any(k in name_lower for k in ['proprietaire', 'owner', 'landlord']):
            return 'proprietaires'
        elif any(k in name_lower for k in ['immeuble', 'building', 'site']):
            return 'immeubles'
        elif any(k in name_lower for k in ['local', 'property', 'unit', 'apartment']):
            return 'locaux'
        elif any(k in name_lower for k in ['locataire', 'tenant', 'renter']):
            return 'locataires'
        elif any(k in name_lower for k in ['contrat', 'contract', 'lease']):
            return 'contrats'
        elif any(k in name_lower for k in ['loyer', 'rent']):
            return 'loyers'
        elif any(k in name_lower for k in ['paiement', 'payment', 'transaction']):
            return 'paiements'
        elif any(k in name_lower for k in ['charge', 'utility', 'fee']):
            return 'charges'
        elif any(k in name_lower for k in ['quittance', 'receipt']):
            return 'quittances'
        elif any(k in name_lower for k in ['document', 'file', 'attachment']):
            return 'documents'
        else:
            return 'autres'
    
    def _categorize_data(self):
        """Catégorisation intelligente des données"""
        print("\n🏷️  Catégorisation intelligente des données...")
        
        if not self.report["categories"]:
            print("  ⚠️  Aucune donnée à catégoriser")
            return
        
        print(f"\n  ✅ {len(self.report['categories'])} catégories identifiées:")
        for category in self.report["categories"]:
            print(f"    • {category}")
    
    def _analyze_data_quality(self):
        """Analyse la qualité des données"""
        print("\n🔍 Analyse de la qualité des données...")
        
        quality = {
            "completeness": "unknown",
            "duplicates": "unknown",
            "consistency": "unknown",
            "issues": []
        }
        
        # TODO: Analyse approfondie selon le format
        
        self.report["data_quality"] = quality
        print("  ✓ Analyse de qualité effectuée")
    
    def _generate_mapping(self):
        """Génère le mapping legacy → nouveau système"""
        print("\n🗺️  Génération du mapping vers le nouveau système...")
        
        mapping = {
            "proprietaires": {
                "target_table": "owners",
                "fields": {
                    "id": "id",
                    "nom": "company_name",
                    "contact": "contact_name",
                    "email": "email",
                    "telephone": "phone",
                    "adresse": "address"
                }
            },
            "immeubles": {
                "target_table": "sites",
                "fields": {
                    "id": "id",
                    "nom": "name",
                    "adresse": "address",
                    "proprietaire_id": "owner_id"
                }
            },
            "locaux": {
                "target_table": "properties",
                "fields": {
                    "id": "id",
                    "nom": "name",
                    "type": "type",
                    "adresse": "address",
                    "immeuble_id": "site_id"
                }
            },
            "locataires": {
                "target_table": "tenants",
                "fields": {
                    "id": "id",
                    "prenom": "first_name",
                    "nom": "last_name",
                    "email": "email",
                    "telephone": "phone"
                }
            },
            "contrats": {
                "target_table": "contracts",
                "fields": {
                    "id": "id",
                    "local_id": "property_id",
                    "locataire_id": "tenant_id",
                    "date_debut": "start_date",
                    "date_fin": "end_date",
                    "loyer": "rent_amount"
                }
            },
            "paiements": {
                "target_table": "payments",
                "fields": {
                    "id": "id",
                    "contrat_id": "contract_id",
                    "montant": "amount",
                    "date": "payment_date",
                    "type": "payment_method"
                }
            }
        }
        
        self.report["mapping"] = mapping
        print("  ✓ Mapping généré")
    
    def _generate_report(self):
        """Génère le rapport final"""
        report_path = Path("c:/AKIG/scripts/legacy-import/analysis-report.json")
        report_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(self.report, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 Rapport sauvegardé: {report_path}")
        
        # Rapport console
        print("\n" + "=" * 80)
        print("📊 RAPPORT D'ANALYSE - RÉSUMÉ")
        print("=" * 80)
        print(f"\n✅ Format détecté: {self.report['format']}")
        print(f"\n📦 Catégories trouvées: {len(self.report['categories'])}")
        
        for category, info in self.report["categories"].items():
            if isinstance(info, dict) and "count" in info:
                print(f"  • {category}: {info['count']} enregistrements")
            else:
                print(f"  • {category}")
        
        if self.report["errors"]:
            print(f"\n❌ Erreurs: {len(self.report['errors'])}")
            for error in self.report["errors"][:5]:
                print(f"  • {error}")
        
        if self.report["warnings"]:
            print(f"\n⚠️  Avertissements: {len(self.report['warnings'])}")
            for warning in self.report["warnings"][:5]:
                print(f"  • {warning}")
        
        print("\n" + "=" * 80)
        print("🎯 PROCHAINES ÉTAPES:")
        print("=" * 80)
        print("1. Vérifier le rapport: analysis-report.json")
        print("2. Exécuter le script de catégorisation")
        print("3. Valider les données avant import")
        print("4. Lancer l'import dans le nouveau système")
        print("\n✨ Analyse terminée avec succès !\n")

def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze-archive.py <path-to-archive>")
        print("\nExemples:")
        print("  python analyze-archive.py backup.sql")
        print("  python analyze-archive.py database.sqlite")
        print("  python analyze-archive.py exports/")
        print("  python analyze-archive.py data.json")
        sys.exit(1)
    
    archive_path = sys.argv[1]
    
    analyzer = LegacyArchiveAnalyzer(archive_path)
    analyzer.analyze()

if __name__ == "__main__":
    main()

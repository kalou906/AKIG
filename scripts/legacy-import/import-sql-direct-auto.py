#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AKIG - Import SQL Legacy Auto-Complet
Crée automatiquement les tables manquantes et mappe intelligemment les données
"""

import sys
import os
import re
from datetime import datetime
from typing import Dict, List, Any, Optional
from collections import defaultdict
from pathlib import Path

try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("❌ psycopg2 non installé : pip install psycopg2-binary")
    sys.exit(1)

try:
    import chardet  # optional
except ImportError:
    chardet = None


# ==============================================================================
# MAPPINGS LEGACY → MODERNE (8 tables de base + conventions auto)
# ==============================================================================
FIELD_MAPPING = {
    'proprietaire': {
        'table': 'owners',
        'mapping': {
            'id': 'id',
            'nom_proprio': 'company_name',
            'rue_proprio': 'address',
            'telephone': 'phone',
            'email': 'email',
        }
    },
    'immeuble': {
        'table': 'sites',
        'mapping': {
            'id': 'id',
            'adresse': 'address',
            'typo': 'type',
            'commentaire': 'notes',
        }
    },
    'local': {
        'table': 'properties',
        'mapping': {
            'id': 'id',
            'nom': 'name',
            'adresse': 'address',
            'immeuble_id': 'site_id',
            'proprietaire_id': 'owner_id',
            'surface': 'surface_area',
            'statut': 'status',
        }
    },
    'locataire': {
        'table': 'tenants',
        'mapping': {
            'id': 'id',
            'nom': 'full_name',
            'telephone': 'phone',
            'email': 'email',
            'adresse': 'address',
        }
    },
    'contrat': {
        'table': 'contracts',
        'mapping': {
            'id': 'id',
            'local_id': 'property_id',
            'locataire_id': 'tenant_id',
            'date_entree': 'start_date',
            'date_fin_preavis': 'end_date',
            'loy': 'rent_amount',
            'charges': 'charges_amount',
        }
    },
    'loyer': {
        'table': 'rent_payments',
        'mapping': {
            'id': 'id',
            'num': 'invoice_number',
            'contrat_id': 'contract_id',
            'local_id': 'property_id',
            'locataire_id': 'tenant_id',
            'proprietaire_id': 'owner_id',
            'montant_tot': 'total_amount',
            'loy': 'rent_amount',
            'charges': 'charges_amount',
            'caf': 'housing_benefit',
            'tva': 'vat_amount',
            'solde': 'balance',
            'echeance': 'due_date',
            'periode_du': 'period_start',
            'periode_au': 'period_end',
            'statut': 'status',
            'paiement': 'payment_status',
            'commentaire': 'notes',
        }
    },
    'paiement': {
        'table': 'payments',
        'mapping': {
            'p_id': 'id',
            'orig': 'origin',
            'locataire_id': 'tenant_id',
            'contrat_id': 'contract_id',
            'local_id': 'property_id',
            'reglement_mode': 'payment_method',
            'reglement_detail': 'payment_details',
            'grc_encaissement': 'collection_date',
        }
    },
    'charge': {
        'table': 'charges',
        'mapping': {
            'id': 'id',
            'local_id': 'property_id',
            'proprietaire_id': 'owner_id',
            'type': 'charge_type',
            'libelle': 'description',
            'fournisseur': 'supplier',
            'montant_ht': 'amount_excl_tax',
            'montant_tva': 'vat_amount',
            'montant_ttc': 'amount_incl_tax',
            'date_acq': 'acquisition_date',
            'periode_du': 'period_start',
            'periode_au': 'period_end',
            'commentaire': 'notes',
            'reglement_mode': 'payment_method',
        }
    },
}


# ==============================================================================
# CLASSE IMPORTER
# ==============================================================================
class LegacySQLImporter:
    def __init__(self, sql_file: str, database_url: str, dry_run: bool = False):
        self.sql_file = Path(sql_file)
        self.database_url = database_url
        self.dry_run = dry_run
        self.conn = None
        self.cursor = None
        self.stats = {
            'total_inserts': 0,
            'successful': 0,
            'errors': 0,
            'by_table': defaultdict(lambda: {'success': 0, 'errors': 0})
        }
        self.chardet = chardet

    # ----------------------------------------------------------------------
    # ENCODING HELPERS
    # ----------------------------------------------------------------------
    def _detect_file_encoding(self) -> str:
        """Détection intelligente de l'encodage"""
        if self.chardet:
            try:
                with open(self.sql_file, 'rb') as f:
                    sample = f.read(100_000)
                detected = self.chardet.detect(sample)
                enc = (detected or {}).get('encoding')
                if enc:
                    return enc
            except Exception:
                pass
        return 'utf-8'

    def _read_sql_lines(self) -> List[str]:
        """Lecture robuste avec multiples fallbacks"""
        candidates = [self._detect_file_encoding(), 'utf-8', 'cp1252', 'latin-1', 'iso-8859-1']
        tried = set()
        
        for enc in candidates:
            if not enc:
                continue
            key = enc.lower()
            if key in tried:
                continue
            tried.add(key)
            
            try:
                with open(self.sql_file, 'r', encoding=enc) as f:
                    lines = f.readlines()
                print(f"✅ Fichier lu avec encodage: {enc}\n")
                return lines
            except UnicodeDecodeError:
                continue
            except Exception:
                continue
        
        # Dernier recours
        with open(self.sql_file, 'r', encoding='utf-8', errors='ignore') as f:
            print("⚠️ Lecture avec utf-8 (erreurs ignorées)\n")
            return f.readlines()

    # ----------------------------------------------------------------------
    # AUTO-MAPPING & TABLE CREATION
    # ----------------------------------------------------------------------
    def _get_all_legacy_tables(self, lines: List[str]) -> set:
        """Extraction rapide des tables du dump (regex simple)"""
        tables = set()
        # Regex simple pour extraire juste le nom de table (sans parser les valeurs)
        table_pattern = re.compile(r'^INSERT\s+INTO\s+`?(\w+)`?\s*\(', re.IGNORECASE)
        
        for line in lines:
            stripped = line.strip()
            if stripped.lower().startswith('insert'):
                match = table_pattern.match(stripped)
                if match:
                    tables.add(match.group(1))
        
        return tables

    def _extract_table_columns(self, table: str, lines: List[str]) -> Optional[List[str]]:
        """Extraction rapide des colonnes pour une table spécifique"""
        # Regex pour extraire liste de colonnes (entre les premières parenthèses)
        col_pattern = re.compile(
            r'^INSERT\s+INTO\s+`?' + re.escape(table) + r'`?\s*\(([^)]+)\)',
            re.IGNORECASE
        )
        
        for line in lines:
            stripped = line.strip()
            if stripped.lower().startswith('insert'):
                match = col_pattern.match(stripped)
                if match:
                    cols_str = match.group(1)
                    # Extraire noms de colonnes (enlever backticks/quotes)
                    cols = [c.strip().strip('`').strip('"').strip("'") for c in cols_str.split(',')]
                    return cols
        return None

    def _generate_auto_mapping(self, table: str, legacy_cols: List[str]) -> Dict[str, Any]:
        """Génération intelligente de mapping par convention"""
        conventions = {
            'historique': 'audit_logs',
            'versement': 'disbursements',
            'log': 'system_logs',
            'attachement': 'attachments',
            'edl': 'inventory_reports',
            'gerance': 'management_fees',
            'variables': 'system_variables',
            'typologie': 'property_types',
            'modele': 'document_templates',
            'indice': 'index_values',
            'divers': 'miscellaneous',
        }
        
        target_table = conventions.get(table, f'legacy_{table}')
        
        # Mapping colonnes : snake_case standard
        mapping = {}
        for col in legacy_cols:
            clean_col = col.strip('`').strip("'").strip()
            snake_col = clean_col.lower().replace(' ', '_').replace('-', '_').replace('é', 'e').replace('è', 'e')
            mapping[clean_col] = snake_col
        
        return {'table': target_table, 'mapping': mapping}

    def _infer_column_type(self, col_name: str) -> str:
        """Inférence de type PostgreSQL à partir du nom de colonne"""
        col_low = col_name.lower()
        
        if col_low in ['id', 'p_id'] or col_low.endswith('_id'):
            return 'INTEGER'
        elif any(x in col_low for x in ['date', 'timestamp', 'echeance', 'periode']):
            return 'TIMESTAMP'
        elif any(x in col_low for x in ['montant', 'taux', 'prix', 'cout', 'solde', 'amount', 'loy', 'charges', 'caf', 'tva']):
            return 'DECIMAL(15,2)'
        elif any(x in col_low for x in ['statut', 'status', 'type', 'mode', 'orig', 'code']):
            return 'VARCHAR(100)'
        elif any(x in col_low for x in ['email']):
            return 'VARCHAR(255)'
        elif any(x in col_low for x in ['telephone', 'phone']):
            return 'VARCHAR(50)'
        elif any(x in col_low for x in ['commentaire', 'description', 'libelle', 'message', 'details', 'notes']):
            return 'TEXT'
        else:
            return 'VARCHAR(255)'

    def _create_missing_table(self, target_table: str, mapping: Dict[str, str]):
        """Création automatique de table PostgreSQL"""
        if self.dry_run:
            print(f"   [DRY-RUN] Créerait table: {target_table}")
            return
        
        pg_cols = []
        for legacy_col, target_col in mapping.items():
            col_type = self._infer_column_type(target_col)
            pg_cols.append(f'"{target_col}" {col_type}')
        
        create_sql = f'CREATE TABLE IF NOT EXISTS "{target_table}" (\n    {",\n    ".join(pg_cols)}\n);'
        
        try:
            self.cursor.execute(create_sql)
            print(f"   🆗 Table créée: {target_table}")
        except Exception as e:
            print(f"   ⚠️ Erreur création {target_table}: {e}")

    def _ensure_all_tables_exist(self, lines: List[str]):
        """Analyse complète et création des tables manquantes"""
        all_tables = self._get_all_legacy_tables(lines)
        print(f"\n📊 Tables détectées dans le dump: {len(all_tables)}")
        
        # Vérifier tables existantes
        if not self.dry_run:
            self.cursor.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            existing_tables = {row[0] for row in self.cursor.fetchall()}
        else:
            existing_tables = set()
        
        for table in sorted(all_tables):
            if table in FIELD_MAPPING:
                target_table = FIELD_MAPPING[table]['table']
                if not self.dry_run and target_table not in existing_tables:
                    print(f"   ⚠️ Table manquante (définie dans FIELD_MAPPING): {target_table}")
            else:
                cols = self._extract_table_columns(table, lines)
                if not cols:
                    continue
                
                auto_map = self._generate_auto_mapping(table, cols)
                FIELD_MAPPING[table] = auto_map
                target_table = auto_map['table']
                
                print(f"   🆕 Mapping auto: {table} → {target_table}")
                
                if not self.dry_run and target_table not in existing_tables:
                    self._create_missing_table(target_table, auto_map['mapping'])
                    existing_tables.add(target_table)

    # ----------------------------------------------------------------------
    # PARSING
    # ----------------------------------------------------------------------
    def parse_insert_statement(self, line: str):
        """Parse une ligne INSERT INTO"""
        match = re.match(r"insert into\s+`?(\w+)`?\s*\(([^)]+)\)\s*values\s*\((.+)\)\s*;?\s*$",
                         line, re.IGNORECASE)
        if not match:
            return None

        table = match.group(1).lower()
        columns_str = match.group(2)
        values_str = match.group(3)

        columns = [col.strip().strip('`').strip("'") for col in columns_str.split(',')]

        # Parser valeurs
        values: List[str] = []
        in_string = False
        current_value = ''
        escape_next = False
        
        for ch in values_str:
            if escape_next:
                current_value += ch
                escape_next = False
                continue
            if ch == '\\':
                escape_next = True
                continue
            if ch == "'":
                in_string = not in_string
                continue
            if ch == ',' and not in_string:
                values.append(current_value.strip())
                current_value = ''
                continue
            current_value += ch
        
        if current_value:
            values.append(current_value.strip())

        record = {}
        for i, col in enumerate(columns):
            if i >= len(values):
                record[col] = None
            else:
                val = values[i].strip()
                if val.upper() == 'NULL' or val == '':
                    record[col] = None
                else:
                    record[col] = val

        return {'table': table, 'columns': columns, 'values': values, 'record': record}

    def transform_record(self, legacy_table: str, legacy_record: dict):
        """Transforme un enregistrement legacy vers nouveau schéma"""
        if legacy_table not in FIELD_MAPPING:
            return None
        
        mapping = FIELD_MAPPING[legacy_table].get('mapping', {})
        new_record = {}
        
        for old_field, new_field in mapping.items():
            if old_field in legacy_record:
                new_record[new_field] = legacy_record[old_field]
        
        return new_record

    # ----------------------------------------------------------------------
    # IMPORT
    # ----------------------------------------------------------------------
    def import_sql(self):
        """Import complet avec auto-mapping et création de tables"""
        print("=" * 80)
        print("📦 AKIG - IMPORT DIRECT SQL AUTO-COMPLET")
        print("=" * 80)
        print(f"\n📄 Fichier: {self.sql_file}")
        print(f"💾 Base: {self.database_url.split('@')[-1] if '@' in self.database_url else 'local'}")
        
        if self.dry_run:
            print("⚠️  MODE DRY-RUN (simulation)")
        
        print(f"\n⏰ Début: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Connexion
        if not self.dry_run:
            try:
                self.conn = psycopg2.connect(self.database_url)
                self.conn.autocommit = False
                self.cursor = self.conn.cursor()
                print("✅ Connecté à PostgreSQL\n")
            except Exception as e:
                print(f"❌ Erreur connexion: {e}")
                return
        
        try:
            lines = self._read_sql_lines()
            if not lines:
                print("❌ Impossible de lire le fichier")
                return
            
            # Analyse et création auto des tables
            print("🔧 Analyse des tables nécessaires...\n")
            self._ensure_all_tables_exist(lines)
            
            if not self.dry_run:
                self.conn.commit()
            
            # Import des données
            print("\n📥 Début de l'import des données...\n")
            line_num = 0
            current_batch: List[dict] = []
            current_table: Optional[str] = None
            
            for raw_line in lines:
                line_num += 1
                line = raw_line.strip()
                
                if not line or line.startswith('--') or line.startswith('/*'):
                    continue
                
                if line.lower().startswith('insert into'):
                    parsed = self.parse_insert_statement(line)
                    if parsed:
                        legacy_table = parsed['table']
                        
                        if legacy_table in FIELD_MAPPING:
                            target_table = FIELD_MAPPING[legacy_table]['table']
                            
                            if current_table != legacy_table:
                                if current_batch:
                                    self._flush_batch(current_table, current_batch)
                                current_batch = []
                                current_table = legacy_table
                                
                                if legacy_table not in self.stats['by_table']:
                                    print(f"\n📂 {legacy_table} → {target_table}")
                            
                            current_batch.append(parsed['record'])
                            self.stats['total_inserts'] += 1
                            
                            if len(current_batch) >= 100:
                                self._flush_batch(current_table, current_batch)
                                current_batch = []
                
                if line_num % 10000 == 0:
                    print(f"  ⏳ Ligne {line_num:,} - {self.stats['successful']:,} importés")
            
            if current_batch:
                self._flush_batch(current_table, current_batch)
            
            if not self.dry_run and self.conn:
                print("\n✅ Commit des transactions...")
                self.conn.commit()
            
            self._print_summary()
        
        except Exception as e:
            print(f"\n❌ ERREUR: {e}")
            if not self.dry_run and self.conn:
                print("  ↩️ Rollback...")
                self.conn.rollback()
            raise
        finally:
            if self.cursor:
                self.cursor.close()
            if self.conn:
                self.conn.close()

    def _flush_batch(self, legacy_table: str, records: list):
        """Importe un batch d'enregistrements"""
        if not records:
            return
        
        target_table = FIELD_MAPPING[legacy_table]['table']
        
        transformed_records = []
        for record in records:
            transformed = self.transform_record(legacy_table, record)
            if transformed:
                transformed_records.append(transformed)
        
        if not transformed_records:
            return
        
        columns = list(transformed_records[0].keys())
        
        if self.dry_run:
            print(f"  🔄 [DRY-RUN] Importerait {len(transformed_records)} records")
            self.stats['successful'] += len(transformed_records)
            self.stats['by_table'][legacy_table]['success'] += len(transformed_records)
            return
        
        # SAVEPOINT pour isoler chaque batch
        savepoint_name = f"batch_{legacy_table}_{id(records)}"
        
        try:
            self.cursor.execute(f"SAVEPOINT {savepoint_name}")
            
            placeholders = ','.join(['%s'] * len(columns))
            for record in transformed_records:
                values = [record.get(col) for col in columns]
                query = (
                    f"INSERT INTO \"{target_table}\" ({','.join([f'\"{col}\"' for col in columns])}) "
                    f"VALUES ({placeholders})"
                )
                self.cursor.execute(query, values)
                self.stats['successful'] += 1
                self.stats['by_table'][legacy_table]['success'] += 1
            
            # Valider le savepoint
            self.cursor.execute(f"RELEASE SAVEPOINT {savepoint_name}")
        
        except Exception as e:
            # Rollback uniquement ce batch
            try:
                self.cursor.execute(f"ROLLBACK TO SAVEPOINT {savepoint_name}")
            except:
                pass
                
            self.stats['errors'] += len(transformed_records)
            self.stats['by_table'][legacy_table]['errors'] += len(transformed_records)
            print(f"  ❌ Erreur batch {legacy_table}: {e}")

    def _print_summary(self):
        print("=" * 80)
        print("📊 RÉSUMÉ IMPORT")
        print("=" * 80)
        print(f"  • Inserts détectés: {self.stats['total_inserts']:,}")
        print(f"  • Importés: {self.stats['successful']:,}")
        print(f"  • Erreurs: {self.stats['errors']:,}")
        if self.stats['by_table']:
            print("\n  Détail par table:")
            for tbl, s in self.stats['by_table'].items():
                target = FIELD_MAPPING[tbl]['table']
                print(f"   - {tbl} → {target}: {s['success']:,} ok, {s['errors']:,} err")


# ==============================================================================
# MAIN
# ==============================================================================
if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='AKIG - Import SQL Legacy auto-complet')
    parser.add_argument('sql_file', help='Chemin du fichier SQL legacy')
    parser.add_argument('database_url', nargs='?', help='URL PostgreSQL (postgresql://user:pass@host:port/db)')
    parser.add_argument('--dry-run', action='store_true', help='Simulation sans insertion')
    
    args = parser.parse_args()
    
    if not args.database_url:
        args.database_url = os.getenv('DATABASE_URL', '')
    
    if not args.database_url:
        print("❌ URL de base de données requise (argument ou variable DATABASE_URL)")
        sys.exit(1)
    
    importer = LegacySQLImporter(args.sql_file, args.database_url, dry_run=args.dry_run)
    importer.import_sql()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re
import sys
import json
import argparse
from datetime import datetime
from typing import Any, Dict, List, Optional
from collections import defaultdict

try:
    import psycopg2
except ImportError:
    print("❌ psycopg2 non installé : pip install psycopg2-binary")
    sys.exit(1)

try:
    import chardet  # type: ignore
except Exception:
    chardet = None  # optional

# Legacy → target mapping (table + columns). Columns mapping is legacy->target.
# If a legacy table isn't listed, it defaults to target name 'legacy_<table>' and identity column mapping.
FIELD_MAPPING: Dict[str, Dict[str, Any]] = {
    # Use identity column names to match existing table definition
    'historique': {'table': 'audit_logs', 'mapping': {}},
    'log': {'table': 'system_logs', 'mapping': {'timestamp': 'logged_at', 'message': 'message'}},
    'edl': {'table': 'inventory_reports', 'mapping': {'date_edl': 'date_modif'}},
    # Critical fix: versement should import into disbursements using legacy column names as-is (e.g., 'montant')
    'versement': {'table': 'disbursements', 'mapping': {}},
}

INVALID_DATE_STRINGS = {
    '0000-00-00', '0000-00-00 00:00:00', '00/00/0000', '0000-00-00T00:00:00', '0000-00-00T00:00:00Z'
}

class Importer:
    def __init__(self, sql_file: str, database_url: str, dry_run: bool = False, only_tables: Optional[List[str]] = None):
        self.sql_file = sql_file
        self.database_url = database_url
        self.dry_run = dry_run
        self.only_tables = set(t.lower() for t in only_tables) if only_tables else None
        self.conn = None
        self.cur = None
        self.stats = {
            'total_inserts': 0,
            'successful': 0,
            'failed': 0,
            'tables': defaultdict(lambda: {'success': 0, 'failed': 0})
        }
        self.first_error: Optional[Dict[str, Any]] = None

    def _detect_encoding(self) -> str:
        if chardet:
            try:
                with open(self.sql_file, 'rb') as f:
                    sample = f.read(200_000)
                detected = chardet.detect(sample)
                enc = detected.get('encoding') if detected else None
                if enc:
                    return enc
            except Exception:
                pass
        return 'utf-8'

    def _read_lines(self) -> List[str]:
        tried = set()
        for enc in [self._detect_encoding(), 'utf-8', 'cp1252', 'latin-1', 'iso-8859-1']:
            if not enc or enc.lower() in tried:
                continue
            tried.add(enc.lower())
            try:
                with open(self.sql_file, 'r', encoding=enc) as f:
                    lines = f.readlines()
                print(f"✅ Fichier lu avec encodage : {enc}\n")
                return lines
            except UnicodeDecodeError:
                continue
            except Exception:
                continue
        print("⚠️ Lecture avec utf-8 (erreurs ignorées)\n")
        with open(self.sql_file, 'r', encoding='utf-8', errors='ignore') as f:
            return f.readlines()

    def _parse_insert(self, line: str) -> Optional[Dict[str, Any]]:
        m = re.search(r"INSERT\s+INTO\s+`?(\w+)`?\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)", line, re.IGNORECASE)
        if not m:
            return None
        table = m.group(1).lower()
        columns = [c.strip().strip('`"\'').lower() for c in m.group(2).split(',')]
        values_str = m.group(3)
        # Split values respecting quotes and doubled single quotes
        values: List[str] = []
        current: List[str] = []
        in_quotes = False
        i = 0
        while i < len(values_str):
            ch = values_str[i]
            if ch == "'":
                if not in_quotes:
                    in_quotes = True
                else:
                    if i + 1 < len(values_str) and values_str[i + 1] == "'":
                        current.append("'")
                        i += 2
                        continue
                    in_quotes = False
            if ch == ',' and not in_quotes:
                values.append(''.join(current).strip())
                current = []
                i += 1
                continue
            current.append(ch)
            i += 1
        if current:
            values.append(''.join(current).strip())
        if len(values) != len(columns):
            return None
        record: Dict[str, Any] = {}
        for col, raw_val in zip(columns, values):
            v = raw_val.strip()
            if v.upper() == 'NULL':
                record[col] = None
            elif len(v) >= 2 and v[0] == "'" and v[-1] == "'":
                s = v[1:-1]
                record[col] = None if s in INVALID_DATE_STRINGS else s
            else:
                record[col] = v
        return {'table': table, 'record': record}

    def _ensure_mapping(self, legacy_table: str, record_cols: List[str]) -> Dict[str, Any]:
        if legacy_table in FIELD_MAPPING:
            cfg = FIELD_MAPPING[legacy_table]
            # Identity mapping for unspecified columns
            mapping = dict(cfg.get('mapping', {}))
            for c in record_cols:
                mapping.setdefault(c, c)
            return {'table': cfg['table'], 'mapping': mapping}
        # default: legacy_<table>
        mapping = {c: c for c in record_cols}
        return {'table': f'legacy_{legacy_table}', 'mapping': mapping}

    def _insert_row(self, target_table: str, cols: List[str], values: List[Any]) -> bool:
        placeholders = ', '.join(['%s'] * len(cols))
        sql = f'INSERT INTO "{target_table}" ("' + '", "'.join(cols) + f'") VALUES ({placeholders}) ON CONFLICT DO NOTHING'
        self.cur.execute('SAVEPOINT sp_row')
        try:
            self.cur.execute(sql, tuple(values))
            self.cur.execute('RELEASE SAVEPOINT sp_row')
            return True
        except Exception as e:
            self.cur.execute('ROLLBACK TO SAVEPOINT sp_row')
            msg = str(e)
            # Retry by nulling invalid date/time-like values if present
            if 'date/time' in msg or '0000-00-00' in msg:
                new_vals = [None if (isinstance(v, str) and v in INVALID_DATE_STRINGS) else v for v in values]
                if new_vals != values:
                    self.cur.execute('SAVEPOINT sp_row2')
                    try:
                        self.cur.execute(sql, tuple(new_vals))
                        self.cur.execute('RELEASE SAVEPOINT sp_row2')
                        return True
                    except Exception:
                        self.cur.execute('ROLLBACK TO SAVEPOINT sp_row2')
            if not self.first_error:
                self.first_error = {
                    'table': target_table,
                    'error': msg,
                    'sql': sql[:200],
                    'values': tuple('NULL' if v is None else str(v)[:120] for v in values)
                }
            return False

    def run(self):
        print('\n' + '=' * 80)
        print('📦 AKIG - IMPORT DIRECT SQL V5 (FORCE INSERT)')
        print('=' * 80)
        print(f"\n📄 Fichier: {self.sql_file}")
        if self.dry_run:
            print('⚠️  MODE DRY-RUN (simulation)')
        print(f"\n⏰ Début: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        if not self.dry_run:
            try:
                self.conn = psycopg2.connect(self.database_url)
                self.conn.autocommit = False
                self.cur = self.conn.cursor()
                print('✅ Connecté à PostgreSQL\n')
            except Exception as e:
                print(f'❌ Erreur connexion: {e}')
                return
        try:
            lines = self._read_lines()
            if not lines:
                print('❌ Impossible de lire le fichier')
                return
            print('📥 Import des données (ligne par ligne)...\n')
            line_num = 0
            for raw_line in lines:
                line_num += 1
                line = raw_line.strip()
                if not line or not line.lower().startswith('insert into'):
                    continue
                parsed = self._parse_insert(line)
                if not parsed:
                    continue
                legacy_table = parsed['table']
                if self.only_tables and legacy_table not in self.only_tables:
                    continue
                rec = parsed['record']
                mapping_info = self._ensure_mapping(legacy_table, list(rec.keys()))
                target_table = mapping_info['table']
                mapping: Dict[str, str] = mapping_info['mapping']
                new_record: Dict[str, Any] = {}
                for legacy_col, target_col in mapping.items():
                    if legacy_col in rec:
                        new_record[target_col] = rec[legacy_col]
                if not new_record:
                    continue
                cols = list(new_record.keys())
                vals = [new_record[c] for c in cols]
                self.stats['total_inserts'] += 1
                if not self.dry_run:
                    ok = self._insert_row(target_table, cols, vals)
                    if ok:
                        self.stats['successful'] += 1
                        self.stats['tables'][target_table]['success'] += 1
                    else:
                        self.stats['failed'] += 1
                        self.stats['tables'][target_table]['failed'] += 1
                if line_num % 2000 == 0:
                    print(f"  ⏳ Ligne {line_num:,} - {self.stats['successful']:,} importés / {self.stats['failed']:,} échecs")
            if not self.dry_run and self.conn:
                print('\n✅ Commit final...')
                self.conn.commit()
            self._summary()
        except Exception as e:
            print(f"\n❌ ERREUR FATALE: {e}")
            if self.conn:
                print(' ↩️ Rollback global...')
                self.conn.rollback()
            raise
        finally:
            if self.cur:
                self.cur.close()
            if self.conn:
                self.conn.close()

    def _summary(self):
        print('\n' + '=' * 80)
        print("📊 RÉSUMÉ D'IMPORT")
        print('=' * 80)
        print(f"\n📈 Total inserts analysés : {self.stats['total_inserts']:,}")
        print(f"✅ Importés avec succès : {self.stats['successful']:,}")
        print(f"❌ Échecs (ignorés) : {self.stats['failed']:,}")
        if self.stats['tables']:
            print('\n📋 Par table :')
            for t, st in sorted(self.stats['tables'].items()):
                if st['success'] + st['failed'] > 0:
                    print(f"   - {t}: {st['success']:,} OK, {st['failed']:,} KO")
        if self.first_error:
            print(f"\n⚠️  Première erreur : {self.first_error['error']}")
        print(f"\n⏰ Fin: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print('=' * 80)


def main():
    parser = argparse.ArgumentParser(description='Import SQL legacy vers PostgreSQL (V5 force insert)')
    parser.add_argument('sql_file', help='Chemin du fichier SQL')
    parser.add_argument('database_url', nargs='?', help='URL PostgreSQL')
    parser.add_argument('--dry-run', action='store_true', help='Simulation (aucun INSERT)')
    parser.add_argument('--only-tables', type=str, help='Tables legacy à traiter, séparées par des virgules (ex: versement,edl)')
    args = parser.parse_args()

    db_url = args.database_url or os.getenv('DATABASE_URL')
    if not db_url:
        print('❌ URL de base de données requise')
        sys.exit(1)
    only = None
    if args.only_tables:
        only = [t.strip().lower() for t in args.only_tables.split(',') if t.strip()]

    imp = Importer(args.sql_file, db_url, args.dry_run, only)
    imp.run()


if __name__ == '__main__':
    main()

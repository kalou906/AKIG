#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Direct migration: MySQL `historique` -> PostgreSQL `audit_logs`

Highlights:
- No intermediate dump file (streams directly)
- Batch fetching from MySQL to limit memory usage
- Normalizes MySQL zero-date placeholders to NULL
- Uses ON CONFLICT DO NOTHING for idempotency
- Optionally can be adapted to use execute_values for speed (per-row for clarity now)

USAGE:
    1. Edit MYSQL_PASSWORD below (or set env MYSQL_PASSWORD).
    2. Run:  python C:\AKIG\scripts\migrate_historique_direct.py
    3. Verify: psql -c "SELECT COUNT(*) FROM audit_logs;"

Environment variable overrides (if set) take precedence over hardcoded values.

Safe constraints application: will add PK / indexes only if missing.
"""

import os
import json
import getpass
import mysql.connector
import psycopg2
from psycopg2 import sql as pg_sql

# ========= CONFIGURATION =========
MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
# Replace below OR set env MYSQL_PASSWORD
MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', 'VOTRE_MDP_MYSQL_ICI')  # <-- REMPLACEZ PAR VOTRE MOT DE PASSE
MYSQL_DB = os.environ.get('MYSQL_DB', 'immobilier')

PG_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/akig_immobilier')

# Column mapping (identity)
COLUMN_MAP = [
    'id', 'locataire_id', 'local_id', 'prop', 'date', 'objet', 'envoi', 'detail', 'loyer_id'
]

INVALID_DATES = {'0000-00-00', '0000-00-00 00:00:00', '0000-00-00T00:00:00'}


def normalize_value(v):
    if isinstance(v, str) and v in INVALID_DATES:
        return None
    return v


def apply_constraints(pg_conn):
    cur = pg_conn.cursor()
    # Add primary key if missing
    cur.execute(
        """
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conrelid = 'audit_logs'::regclass AND contype = 'p'
            ) THEN
                ALTER TABLE audit_logs ADD PRIMARY KEY (id);
            END IF;
        END $$;
        """
    )
    # Indexes
    cur.execute("CREATE INDEX IF NOT EXISTS idx_audit_locataire ON audit_logs(locataire_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_logs(date);")
    pg_conn.commit()
    cur.close()


def migrate():
    print("\n📦 Migration Directe MySQL → PostgreSQL")
    print("=" * 55)

    # Attempt to auto-load password from secure config if placeholder
    global MYSQL_PASSWORD
    if MYSQL_PASSWORD == 'VOTRE_MDP_MYSQL_ICI':
        secure_cfg = os.path.join('C:\\AKIG', 'secure', 'mysql_config.json')
        if os.path.exists(secure_cfg):
            try:
                with open(secure_cfg, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                pwd = data.get('password')
                if pwd:
                    MYSQL_PASSWORD = pwd
                    print('🔐 Mot de passe chargé depuis secure/mysql_config.json')
            except Exception as e:
                print(f'⚠️ Lecture secure config échouée: {e}')
    if MYSQL_PASSWORD == 'VOTRE_MDP_MYSQL_ICI':
        try:
            MYSQL_PASSWORD = getpass.getpass('Entrez le mot de passe MySQL: ')
        except Exception:
            MYSQL_PASSWORD = ''
    if not MYSQL_PASSWORD:
        print("❌ ERREUR: Mot de passe MySQL manquant (env MYSQL_PASSWORD, secure config ou saisie). Abandon.")
        return 2

    # Connexion MySQL
    print("🔗 Connexion MySQL...")
    try:
        mysql_conn = mysql.connector.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DB,
            charset='utf8mb4'
        )
    except mysql.connector.Error as e:
        print(f"❌ Connexion MySQL échouée: {e}")
        return 2
    mysql_cursor = mysql_conn.cursor(dictionary=True)

    # Compter les lignes
    mysql_cursor.execute("SELECT COUNT(*) as total FROM historique")
    total = mysql_cursor.fetchone()['total']
    print(f"📊 {total:,} lignes à migrer")

    # Préparer lecture
    mysql_cursor.execute("SELECT * FROM historique")

    # Connexion PostgreSQL
    print("🔗 Connexion PostgreSQL...")
    try:
        pg_conn = psycopg2.connect(PG_URL)
    except Exception as e:
        print(f"❌ Connexion PostgreSQL échouée: {e}")
        mysql_cursor.close(); mysql_conn.close()
        return 2
    pg_cursor = pg_conn.cursor()

    # Optionnel: désactiver contraintes si demandé via env RELAX_CONSTRAINTS=1
    relaxed = False
    if os.environ.get('RELAX_CONSTRAINTS', '0') == '1':
        try:
            pg_cursor.execute("SET session_replication_role = replica;")
            pg_conn.commit()
            relaxed = True
            print("⚙️ Contraintes désactivées (session_replication_role=replica).")
        except Exception:
            pg_conn.rollback()
            print("ℹ️ Impossible de désactiver les contraintes; poursuite normale.")

    batch_size = 5000
    inserted = 0
    rows_processed = 0

    INSERT_SQL = (
        "INSERT INTO audit_logs (" + ", ".join(COLUMN_MAP) + ") VALUES (" + ", ".join(['%s'] * len(COLUMN_MAP)) + ") ON CONFLICT DO NOTHING"
    )

    while True:
        rows = mysql_cursor.fetchmany(batch_size)
        if not rows:
            break
        for row in rows:
            normalized = {k: normalize_value(v) for k, v in row.items()}
            values = [normalized.get(c) for c in COLUMN_MAP]
            try:
                pg_cursor.execute(INSERT_SQL, values)
                inserted += pg_cursor.rowcount  # rowcount 0 if conflict
            except Exception:
                # Fallback: ignore problematic row, continue
                pg_conn.rollback()
                continue
        pg_conn.commit()
        rows_processed += len(rows)
        print(f"  ⏳ {rows_processed:,}/{total:,} traitées | {inserted:,} insérées")

    # Réactiver contraintes si désactivées
    if relaxed:
        try:
            pg_cursor.execute("SET session_replication_role = DEFAULT;")
            pg_conn.commit()
            print("🔄 Contraintes réactivées.")
        except Exception:
            pg_conn.rollback()
            print("⚠️ Échec réactivation contraintes.")

    print("🔒 Application contraintes finales...")
    apply_constraints(pg_conn)

    # Rapport final
    pg_cursor.execute("SELECT COUNT(*) FROM audit_logs;")
    final = pg_cursor.fetchone()[0]
    print("\n🎉 Terminé !")
    print(f"➡️  {final:,} lignes présentes dans audit_logs")

    # Fermetures
    mysql_cursor.close(); mysql_conn.close()
    pg_cursor.close(); pg_conn.close()
    return 0


if __name__ == '__main__':
    exit(migrate())

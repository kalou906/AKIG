#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Migration "miracle" : MySQL historique -> PostgreSQL audit_logs

Fonctions clés :
  - Démarrage automatique de MySQL (service ou mode console) si inactif
  - Import streaming sans fichier intermédiaire
  - Normalisation des dates invalides (0000-00-00*) => NULL
  - Insertion per-row avec ON CONFLICT DO NOTHING (résilience)
  - Application finale des contraintes et index

Personnalisation minimale : remplacer MYSQL_PASSWORD ci-dessous.
"""

import os
import time
import subprocess
import mysql.connector
import psycopg2

# ========== SEULE LIGNE À MODIFIER ==========
# Password priority: environment MYSQL_PASSWORD > hardcoded value below.
_HARDCODED_PASSWORD = 'VOTRE_MDP_MYSQL_ICI'  # <-- REMPLACEZ PAR VOTRE MOT DE PASSE SI VOUS NE VOULEZ PAS UTILISER L'ENV.
MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', _HARDCODED_PASSWORD)
# ===========================================

MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': MYSQL_PASSWORD,
    'database': 'immobilier'
}

PG_CONFIG = {
    'dbname': 'akig_immobilier',
    'user': 'postgres',
    'password': 'postgres',
    'host': 'localhost'
}

ZERO_DATE_MARKERS = ('0000-00-00', '0000-00-00 00:00:00', '0000-00-00T00:00:00')
TABLE_COLUMNS = [
    'id', 'locataire_id', 'local_id', 'prop', 'date', 'objet', 'envoi', 'detail', 'loyer_id'
]


def mysql_ready() -> bool:
    try:
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        conn.close()
        return True
    except Exception:
        return False


def start_mysql_if_needed() -> bool:
    print("🔍 Vérification MySQL...")
    if mysql_ready():
        print("✅ MySQL déjà actif")
        return True
    print("⏳ MySQL inactif, démarrage automatique...")
    # Tentative service
    try:
        subprocess.run(['net', 'start', 'MySQL80'], check=True, capture_output=True)
        # Attendre un peu
        for _ in range(10):
            if mysql_ready():
                print("✅ Service MySQL80 démarré")
                return True
            time.sleep(1)
    except Exception:
        pass
    # Mode console fallback
    print("🔄 Démarrage MySQL en mode console...")
    mysql_base = r"C:\Program Files\MySQL\MySQL Server 8.4"
    mysqld_path = os.path.join(mysql_base, 'bin', 'mysqld.exe')
    defaults_ini = os.path.join(mysql_base, 'etc', 'my.ini')
    if not os.path.exists(mysqld_path):
        print("❌ mysqld.exe introuvable. Installation incomplète ou chemin incorrect.")
        return False
    subprocess.Popen([mysqld_path, '--console', f'--defaults-file={defaults_ini}'],
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(30):
        if mysql_ready():
            print("✅ MySQL prêt !")
            return True
        time.sleep(1)
    return False


def normalize_value(v):
    if isinstance(v, str) and any(v.startswith(z) for z in ZERO_DATE_MARKERS):
        return None
    return v


def apply_constraints(pg_cursor, pg_conn):
    print("🔒 Application contraintes...")
    # PK audit_logs si manquante
    pg_cursor.execute(
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
    pg_cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_locataire ON audit_logs(locataire_id);")
    pg_cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_logs(date);")
    # Autres tables (idempotent):
    try:
        pg_cursor.execute("ALTER TABLE disbursements ADD PRIMARY KEY (id);")
    except Exception:
        pg_conn.rollback()
    try:
        pg_cursor.execute("ALTER TABLE inventory_reports ADD PRIMARY KEY (id);")
    except Exception:
        pg_conn.rollback()
    pg_conn.commit()


def migrate() -> bool:
    if MYSQL_PASSWORD == 'VOTRE_MDP_MYSQL_ICI':
        print("❌ ERREUR: Mot de passe MySQL absent. Définissez la variable d'environnement MYSQL_PASSWORD ou modifiez _HARDCODED_PASSWORD.")
        return False

    print("\n📦 Migration Miraculeuse MySQL → PostgreSQL")
    print("=" * 60)

    if not start_mysql_if_needed():
        print("❌ Impossible de démarrer ou atteindre MySQL.")
        return False

    print("🔗 Connexion MySQL...")
    try:
        mysql_conn = mysql.connector.connect(**MYSQL_CONFIG)
    except Exception as e:
        print(f"❌ Connexion MySQL échouée: {e}")
        return False
    mysql_cursor = mysql_conn.cursor(dictionary=True)

    try:
        mysql_cursor.execute("SELECT COUNT(*) AS total FROM historique")
        total = mysql_cursor.fetchone()['total']
    except Exception as e:
        print(f"❌ Impossible de compter les lignes historique: {e}")
        mysql_cursor.close(); mysql_conn.close()
        return False
    print(f"📊 {total:,} lignes à migrer")

    print("🔗 Connexion PostgreSQL...")
    try:
        pg_conn = psycopg2.connect(**PG_CONFIG)
    except Exception as e:
        print(f"❌ Connexion PostgreSQL échouée: {e}")
        mysql_cursor.close(); mysql_conn.close()
        return False
    pg_cursor = pg_conn.cursor()

    # Relax constraints
    try:
        pg_cursor.execute("SET session_replication_role = replica;")
        pg_conn.commit()
        relaxed = True
        print("⚙️ Contraintes désactivées pour vitesse.")
    except Exception:
        pg_conn.rollback()
        relaxed = False
        print("ℹ️ Contraintes non désactivées (permissions ou version).")

    batch_size = 5000
    inserted = 0
    processed = 0

    # Préparer SELECT streaming
    try:
        mysql_cursor.execute("SELECT * FROM historique")
    except Exception as e:
        print(f"❌ SELECT historique échoué: {e}")
        pg_cursor.close(); pg_conn.close(); mysql_cursor.close(); mysql_conn.close()
        return False

    insert_sql = (
        "INSERT INTO audit_logs (" + ", ".join(TABLE_COLUMNS) + ") VALUES (" + ", ".join(['%s'] * len(TABLE_COLUMNS)) + ") ON CONFLICT DO NOTHING"
    )

    while True:
        rows = mysql_cursor.fetchmany(batch_size)
        if not rows:
            break
        for row in rows:
            # Normaliser selon TABLE_COLUMNS (assure l'ordre)
            norm_values = [normalize_value(row.get(col)) for col in TABLE_COLUMNS]
            try:
                pg_cursor.execute(insert_sql, norm_values)
                inserted += pg_cursor.rowcount
            except Exception:
                pg_conn.rollback()
                # Ignore la ligne fautive
                continue
        pg_conn.commit()
        processed += len(rows)
        print(f"  ⏳ {processed:,}/{total:,} traitées | {inserted:,} insérées")

    # Restaure contraintes
    if relaxed:
        try:
            pg_cursor.execute("SET session_replication_role = DEFAULT;")
            pg_conn.commit()
            print("🔄 Contraintes réactivées.")
        except Exception:
            pg_conn.rollback()
            print("⚠️ Échec réactivation contraintes.")

    apply_constraints(pg_cursor, pg_conn)

    # Rapport final
    try:
        pg_cursor.execute("SELECT COUNT(*) FROM audit_logs;")
        final = pg_cursor.fetchone()[0]
    except Exception as e:
        print(f"⚠️ Impossible de lire le compte final: {e}")
        final = inserted

    print("\n🎉 MIRACLE TERMINÉ !")
    print(f"➡️  {final:,} lignes dans audit_logs")

    pg_cursor.close(); pg_conn.close(); mysql_cursor.close(); mysql_conn.close()
    return True


if __name__ == '__main__':
    try:
        ok = migrate()
        if not ok:
            exit(1)
    except KeyboardInterrupt:
        print("Interrompu.")
        exit(130)
    except Exception as e:
        print(f"\n❌ ERREUR FATALE: {e}")
        exit(1)

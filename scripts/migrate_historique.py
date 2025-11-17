#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Direct migrator: MySQL `historique` -> PostgreSQL `audit_logs`

- Connects to MySQL using mysql-connector-python
- Streams rows in batches, normalizes MySQL zero-dates to NULL
- Inserts into Postgres using execute_values with ON CONFLICT DO NOTHING
- Optionally relaxes constraints during import, then applies PK and indexes

Configure via CLI args or environment variables:
- MySQL: env MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB
- Postgres URL: env DATABASE_URL (postgresql://user:pass@host:port/db)

Requirements:
    pip install mysql-connector-python psycopg2-binary
"""

import os
import re
import sys
import time
import argparse
from typing import Any, Dict, Iterable, List, Sequence, Tuple

import mysql.connector
from mysql.connector import Error as MySQLError

import psycopg2
import psycopg2.extras as extras


INVALID_DATE_PATTERNS = (
    r"^0000-00-00$",
    r"^0000-00-00 00:00:00$",
    r"^0000-00-00T00:00:00$",
)
INVALID_DATE_REGEXES = [re.compile(p) for p in INVALID_DATE_PATTERNS]

# Column mapping (identity)
COLUMNS = [
    "id",
    "locataire_id",
    "local_id",
    "prop",
    "date",
    "objet",
    "envoi",
    "detail",
    "loyer_id",
]


def is_invalid_zero_date(val: Any) -> bool:
    if val is None:
        return False
    if isinstance(val, str):
        return any(r.match(val) for r in INVALID_DATE_REGEXES)
    return False


def normalize_row(row: Dict[str, Any]) -> Tuple[Any, ...]:
    out: List[Any] = []
    for col in COLUMNS:
        v = row.get(col)
        if isinstance(v, str) and is_invalid_zero_date(v):
            out.append(None)
        else:
            out.append(v)
    return tuple(out)


def get_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Migrate MySQL historique -> Postgres audit_logs")
    p.add_argument("--mysql-host", default=os.environ.get("MYSQL_HOST", "localhost"))
    p.add_argument("--mysql-user", default=os.environ.get("MYSQL_USER", "root"))
    p.add_argument("--mysql-password", default=os.environ.get("MYSQL_PASSWORD"))
    p.add_argument("--mysql-db", default=os.environ.get("MYSQL_DB", "immobilier"))
    p.add_argument("--batch-size", type=int, default=2000)
    p.add_argument("--database-url", default=os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/akig_immobilier"))
    p.add_argument("--relax-constraints", action="store_true", help="Temporarily relax constraints during import")
    return p.parse_args()


def connect_mysql(host: str, user: str, password: str, db: str):
    cfg = dict(
        host=host,
        user=user,
        password=password,
        database=db,
        charset="utf8mb4",
        use_pure=True,
        raise_on_warnings=False,
    )
    return mysql.connector.connect(**cfg)


def connect_postgres(database_url: str):
    return psycopg2.connect(database_url)


def apply_constraints(pg_conn):
    cur = pg_conn.cursor()
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
    cur.execute("CREATE INDEX IF NOT EXISTS idx_audit_locataire ON audit_logs(locataire_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_logs(date);")
    # Ensure PKs for other tables (idempotent-ish)
    cur.execute(
        """
        DO $$ BEGIN
            BEGIN
                ALTER TABLE disbursements ADD PRIMARY KEY (id);
            EXCEPTION WHEN duplicate_table THEN
                -- ignore
                NULL;
            END;
        END $$;
        """
    )
    cur.execute(
        """
        DO $$ BEGIN
            BEGIN
                ALTER TABLE inventory_reports ADD PRIMARY KEY (id);
            EXCEPTION WHEN duplicate_table THEN
                -- ignore
                NULL;
            END;
        END $$;
        """
    )
    pg_conn.commit()
    cur.close()


def migrate(args: argparse.Namespace) -> int:
    print("\nMySQL -> PostgreSQL migration (historique -> audit_logs)")
    print("=" * 60)

    if not args.mysql_password:
        print("ERROR: Provide MySQL password via --mysql-password or MYSQL_PASSWORD env.")
        return 2

    # Connect MySQL
    print("Connecting MySQL ...")
    try:
        my_conn = connect_mysql(args.mysql_host, args.mysql_user, args.mysql_password, args.mysql_db)
    except MySQLError as e:
        print(f"MySQL connection failed: {e}")
        return 2
    my_cur = my_conn.cursor(dictionary=True)

    # Count rows
    my_cur.execute("SELECT COUNT(*) AS total FROM historique")
    total_rows = my_cur.fetchone()["total"]
    print(f"Total rows to migrate: {total_rows:,}")

    # Stream rows
    my_cur.execute("SELECT * FROM historique")

    # Connect Postgres
    print("Connecting Postgres ...")
    try:
        pg_conn = connect_postgres(args.database_url)
    except Exception as e:
        print(f"Postgres connection failed: {e}")
        my_cur.close(); my_conn.close()
        return 2
    pg_cur = pg_conn.cursor()

    # Optionally relax constraints
    if args.relax_constraints:
        try:
            pg_cur.execute("SET session_replication_role = replica;")
            pg_conn.commit()
            print("Constraints relaxed for import (session_replication_role=replica).")
        except Exception:
            pg_conn.rollback()
            print("Could not relax constraints; proceeding without.")

    batch_size = args.batch_size
    inserted_total = 0
    t0 = time.time()

    insert_sql = f"INSERT INTO audit_logs ({', '.join(COLUMNS)}) VALUES %s ON CONFLICT DO NOTHING"

    while True:
        rows = my_cur.fetchmany(batch_size)
        if not rows:
            break

        values = [normalize_row(r) for r in rows]
        try:
            extras.execute_values(pg_cur, insert_sql, values, page_size=min(1000, batch_size))
            pg_conn.commit()
        except Exception as e:
            pg_conn.rollback()
            # fallback to per-row with isolation to avoid blocking full batch
            for v in values:
                try:
                    pg_cur.execute(f"SAVEPOINT sp;")
                    pg_cur.execute(
                        f"INSERT INTO audit_logs ({', '.join(COLUMNS)}) VALUES ({', '.join(['%s']*len(COLUMNS))}) ON CONFLICT DO NOTHING",
                        v,
                    )
                    pg_cur.execute("RELEASE SAVEPOINT sp;")
                except Exception:
                    pg_cur.execute("ROLLBACK TO SAVEPOINT sp;")
            pg_conn.commit()

        # Note: ON CONFLICT DO NOTHING may not increase rowcount reliably on batch inserts
        # so we approximate with batch size; final count will be reported after.
        inserted_total += len(values)
        elapsed = time.time() - t0
        print(f"  Imported ~{inserted_total:,} rows (elapsed {elapsed:.1f}s)")

    # Restore constraints if relaxed
    if args.relax_constraints:
        try:
            pg_cur.execute("SET session_replication_role = DEFAULT;")
            pg_conn.commit()
        except Exception:
            pg_conn.rollback()

    print("Applying constraints and indexes ...")
    apply_constraints(pg_conn)

    # Final count
    pg_cur.execute("SELECT COUNT(*) FROM audit_logs;")
    final_count = pg_cur.fetchone()[0]
    print("\n" + "=" * 60)
    print("Migration completed successfully")
    print(f"audit_logs row count: {final_count:,}")
    print("=" * 60)

    # Cleanup
    pg_cur.close(); pg_conn.close(); my_cur.close(); my_conn.close()
    return 0


if __name__ == "__main__":
    try:
        sys.exit(migrate(get_args()))
    except KeyboardInterrupt:
        print("Interrupted.")
        sys.exit(130)

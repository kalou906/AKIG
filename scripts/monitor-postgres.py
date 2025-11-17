#!/usr/bin/env python3
"""
Monitoring PostgreSQL - AKIG Immobilier
Vérifie la santé de la base après migration
Exécution : python scripts/monitor-postgres.py
"""
import psycopg2
from datetime import datetime
import sys

PG_URL = "postgresql://postgres:postgres@localhost:5432/akig_immobilier"

def check_health():
    """Vérification complète de santé PostgreSQL"""
    conn = psycopg2.connect(PG_URL)
    cur = conn.cursor()
    
    print("=" * 60)
    print(f"🔍 MONITORING PostgreSQL - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # 1. Taille base de données
    cur.execute("SELECT pg_size_pretty(pg_database_size('akig_immobilier'))")
    db_size = cur.fetchone()[0]
    print(f"\n📊 Taille totale : {db_size}")
    
    # 2. Statistiques tables migrées
    cur.execute("""
        SELECT 
            schemaname,
            relname,
            n_live_tup as lignes,
            n_dead_tup as dead,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as taille
        FROM pg_stat_user_tables
        WHERE relname IN ('audit_logs', 'disbursements', 'inventory_reports')
        ORDER BY n_live_tup DESC
    """)
    
    print("\n📋 Tables migrées :")
    print(f"{'Table':<20} {'Lignes':>10} {'Dead':>8} {'Taille':>10}")
    print("-" * 60)
    for row in cur.fetchall():
        print(f"{row[1]:<20} {row[2]:>10,} {row[3]:>8} {row[4]:>10}")
    
    # 3. Connexions actives
    cur.execute("""
        SELECT count(*), application_name 
        FROM pg_stat_activity 
        WHERE datname = 'akig_immobilier' 
        GROUP BY application_name
    """)
    
    print("\n🔗 Connexions actives :")
    for row in cur.fetchall():
        app = row[1] if row[1] else '(vide)'
        print(f"  • {app}: {row[0]} connexion(s)")
    
    # 4. Index et leur utilisation
    cur.execute("""
        SELECT 
            schemaname,
            relname,
            indexrelname,
            idx_scan as utilisations
        FROM pg_stat_user_indexes
        WHERE relname IN ('audit_logs', 'disbursements', 'inventory_reports')
        ORDER BY idx_scan DESC
    """)
    
    print("\n📇 Index et utilisation :")
    print(f"{'Index':<40} {'Scans':>10}")
    print("-" * 60)
    for row in cur.fetchall():
        print(f"{row[2]:<40} {row[3]:>10,}")
    
    # 5. Requêtes lentes (si pg_stat_statements activé)
    try:
        cur.execute("""
            SELECT 
                LEFT(query, 60) as query_short,
                calls,
                ROUND(mean_exec_time::numeric, 2) as avg_ms
            FROM pg_stat_statements
            WHERE query NOT LIKE '%pg_stat%'
            ORDER BY mean_exec_time DESC
            LIMIT 5
        """)
        
        print("\n⏱️  Top 5 requêtes les plus lentes :")
        print(f"{'Requête':<62} {'Appels':>8} {'Avg (ms)':>10}")
        print("-" * 60)
        for row in cur.fetchall():
            print(f"{row[0]:<62} {row[1]:>8} {row[2]:>10}")
    except Exception as e:
        conn.rollback()
        print(f"\n⚠️  pg_stat_statements non disponible: {str(e)[:50]}")
    
    # 6. Dernières opérations VACUUM
    cur.execute("""
        SELECT 
            relname,
            last_vacuum,
            last_analyze
        FROM pg_stat_user_tables
        WHERE relname IN ('audit_logs', 'disbursements', 'inventory_reports')
        ORDER BY last_vacuum DESC NULLS LAST
    """)
    
    print("\n🧹 Dernières maintenance (VACUUM/ANALYZE) :")
    for row in cur.fetchall():
        vacuum = row[1].strftime('%Y-%m-%d %H:%M') if row[1] else 'Jamais'
        analyze = row[2].strftime('%Y-%m-%d %H:%M') if row[2] else 'Jamais'
        print(f"  • {row[0]}: VACUUM={vacuum}, ANALYZE={analyze}")
    
    # 7. Santé globale
    print("\n✅ SANTÉ GLOBALE")
    
    # Vérifier dead tuples
    cur.execute("""
        SELECT SUM(n_dead_tup) FROM pg_stat_user_tables 
        WHERE relname IN ('audit_logs', 'disbursements', 'inventory_reports')
    """)
    dead_total = cur.fetchone()[0]
    
    if dead_total == 0:
        print("  ✅ Aucun dead tuple (tables optimales)")
    elif dead_total < 1000:
        print(f"  ⚠️  {dead_total} dead tuples (acceptable)")
    else:
        print(f"  ❌ {dead_total} dead tuples (VACUUM recommandé)")
    
    # Vérifier index manquants
    cur.execute("""
        SELECT COUNT(*) FROM pg_stat_user_tables 
        WHERE relname IN ('audit_logs', 'disbursements', 'inventory_reports')
        AND idx_scan = 0
    """)
    no_index = cur.fetchone()[0]
    
    if no_index == 0:
        print("  ✅ Tous les index sont utilisés")
    else:
        print(f"  ⚠️  {no_index} table(s) sans scans d'index")
    
    print("\n" + "=" * 60)
    
    cur.close()
    conn.close()

def quick_count():
    """Comptage rapide des tables"""
    conn = psycopg2.connect(PG_URL)
    cur = conn.cursor()
    
    cur.execute("""
        SELECT 'audit_logs' as table, COUNT(*) FROM audit_logs
        UNION ALL
        SELECT 'disbursements', COUNT(*) FROM disbursements
        UNION ALL
        SELECT 'inventory_reports', COUNT(*) FROM inventory_reports
    """)
    
    print("\n📊 COMPTAGE RAPIDE")
    for row in cur.fetchall():
        print(f"  {row[0]:<20} : {row[1]:>10,} lignes")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    try:
        if len(sys.argv) > 1 and sys.argv[1] == "--quick":
            quick_count()
        else:
            check_health()
    except Exception as e:
        print(f"❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

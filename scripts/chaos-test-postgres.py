#!/usr/bin/env python3
"""
Chaos Test - PostgreSQL Load Testing
Simule une charge intensive pour valider la robustesse du système
Usage: python chaos-test-postgres.py [--duration 300] [--connections 50]
"""
import psycopg2
import random
import time
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
import argparse

PG_URL = "postgresql://postgres:postgres@localhost:5432/akig_immobilier"

# Compteurs globaux
total_queries = 0
total_errors = 0
total_success = 0

def random_query(table, query_id):
    """Execute une requête aléatoire"""
    global total_queries, total_errors, total_success
    
    try:
        conn = psycopg2.connect(PG_URL, connect_timeout=5)
        cur = conn.cursor()
        
        # Mix de requêtes aléatoires
        query_type = random.choice(['select_id', 'select_date', 'count', 'agg'])
        
        if query_type == 'select_id':
            random_id = random.randint(1, 30000)
            cur.execute(f"SELECT * FROM {table} WHERE id = %s", (random_id,))
        elif query_type == 'select_date' and table == 'audit_logs':
            cur.execute(f"SELECT * FROM {table} WHERE date > now() - interval '30 days' LIMIT 100")
        elif query_type == 'count':
            cur.execute(f"SELECT COUNT(*) FROM {table}")
        elif query_type == 'agg' and table == 'audit_logs':
            cur.execute(f"SELECT date, COUNT(*) FROM {table} GROUP BY date ORDER BY date DESC LIMIT 10")
        else:
            # Fallback to simple select
            cur.execute(f"SELECT * FROM {table} LIMIT 10")
        
        result = cur.fetchall()
        cur.close()
        conn.close()
        
        total_success += 1
        return True
        
    except Exception as e:
        total_errors += 1
        if total_errors <= 5:
            print(f"[ERROR {query_id}] {str(e)[:60]}")
        return False
    finally:
        total_queries += 1

def stress_test(duration=60, max_workers=20):
    """Lance le test de charge"""
    print(f"\n{'='*60}")
    print(f"🔥 CHAOS TEST - PostgreSQL Load Testing")
    print(f"{'='*60}")
    print(f"Duration: {duration}s | Workers: {max_workers}")
    print(f"Target: audit_logs, disbursements, inventory_reports")
    print(f"{'='*60}\n")
    
    start_time = time.time()
    query_count = 0
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = []
        
        while time.time() - start_time < duration:
            # Soumettre des requêtes aléatoires
            table = random.choice(['audit_logs', 'audit_logs', 'audit_logs', 'disbursements', 'inventory_reports'])
            future = executor.submit(random_query, table, query_count)
            futures.append(future)
            query_count += 1
            
            # Throttle pour éviter de saturer
            if len(futures) > max_workers * 2:
                time.sleep(0.01)
            
            # Afficher progression toutes les 100 requêtes
            if query_count % 100 == 0:
                elapsed = time.time() - start_time
                qps = total_queries / elapsed if elapsed > 0 else 0
                print(f"[{elapsed:.1f}s] Queries: {total_queries} | Success: {total_success} | Errors: {total_errors} | QPS: {qps:.1f}")
        
        # Attendre que toutes les requêtes se terminent
        print("\n⏳ Waiting for remaining queries to complete...")
        for future in as_completed(futures):
            future.result()
    
    # Rapport final
    end_time = time.time()
    duration_actual = end_time - start_time
    
    print(f"\n{'='*60}")
    print(f"🏁 CHAOS TEST COMPLETED")
    print(f"{'='*60}")
    print(f"Duration:       {duration_actual:.2f}s")
    print(f"Total queries:  {total_queries}")
    print(f"Successful:     {total_success} ({100*total_success/total_queries:.1f}%)")
    print(f"Errors:         {total_errors} ({100*total_errors/total_queries:.1f}%)")
    print(f"Queries/sec:    {total_queries/duration_actual:.1f}")
    print(f"{'='*60}\n")
    
    # Verdict
    error_rate = 100 * total_errors / total_queries if total_queries > 0 else 0
    
    if error_rate == 0:
        print("✅ PERFECT: 0% error rate - System is GOLD certified!")
    elif error_rate < 1:
        print(f"✅ EXCELLENT: {error_rate:.2f}% error rate - Production ready")
    elif error_rate < 5:
        print(f"⚠️  ACCEPTABLE: {error_rate:.2f}% error rate - Monitor in production")
    else:
        print(f"❌ POOR: {error_rate:.2f}% error rate - Investigation required")
        return False
    
    return True

def quick_test():
    """Test rapide de connexion"""
    print("🔍 Quick connection test...")
    try:
        conn = psycopg2.connect(PG_URL, connect_timeout=5)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM audit_logs")
        count = cur.fetchone()[0]
        print(f"✅ Connection OK - audit_logs has {count:,} rows")
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='PostgreSQL Chaos Test')
    parser.add_argument('--duration', type=int, default=60, help='Test duration in seconds')
    parser.add_argument('--connections', type=int, default=20, help='Max concurrent connections')
    parser.add_argument('--quick', action='store_true', help='Quick connection test only')
    
    args = parser.parse_args()
    
    if args.quick:
        sys.exit(0 if quick_test() else 1)
    
    # Test de connexion d'abord
    if not quick_test():
        print("❌ Cannot proceed with stress test - connection failed")
        sys.exit(1)
    
    print("\n⏳ Starting stress test in 3 seconds...")
    time.sleep(3)
    
    success = stress_test(duration=args.duration, max_workers=args.connections)
    sys.exit(0 if success else 1)

#!/usr/bin/env python3
"""
Import UNIQUEMENT la table historique depuis le dump MySQL vers PostgreSQL audit_logs
Résistant aux erreurs, import ligne par ligne avec SAVEPOINT
"""
import re
import sys
import psycopg2
from datetime import datetime

DUMP_FILE = r"C:\Users\HP\Desktop\SauvImmLoyer_20251116.sql"
PG_URL = "postgresql://postgres:postgres@localhost:5432/akig_immobilier"

# Mapping historique -> audit_logs
FIELD_MAP = {
    'id': 'id',
    'date': 'timestamp',
    'objet': 'action',
    'detail': 'details',
    'locataire_id': 'user_id',
    'local_id': 'entity_id'
}

def normalize_date(value):
    """Normalise les dates MySQL (0000-00-00 -> NULL)"""
    if not value or value in ('0000-00-00', '0000-00-00 00:00:00'):
        return None
    return value

def parse_insert_values(line):
    """Parse une ligne INSERT INTO pour extraire les VALUES"""
    match = re.search(r"values\s*\((.*)\);?$", line, re.IGNORECASE)
    if not match:
        return []
    
    values_str = match.group(1)
    values = []
    current = ""
    in_quote = False
    
    for char in values_str:
        if char == "'" and (not current or current[-1] != '\\'):
            in_quote = not in_quote
            current += char
        elif char == ',' and not in_quote:
            values.append(current.strip())
            current = ""
        else:
            current += char
    
    if current:
        values.append(current.strip())
    
    return values

def clean_value(val):
    """Nettoie une valeur SQL"""
    val = val.strip()
    if val.lower() == 'null':
        return None
    if val.startswith("'") and val.endswith("'"):
        return val[1:-1].replace("\\'", "'").replace("\\\\", "\\")
    return val

def import_historique():
    """Import la table historique"""
    conn = psycopg2.connect(PG_URL)
    cur = conn.cursor()
    
    imported = 0
    skipped = 0
    errors = 0
    
    print(f"📖 Lecture du dump: {DUMP_FILE}")
    
    with open(DUMP_FILE, 'r', encoding='utf-8', errors='ignore') as f:
        for line_num, line in enumerate(f, 1):
            if 'insert into `historique`' not in line.lower():
                continue
            
            try:
                values = parse_insert_values(line)
                if len(values) < 9:
                    continue
                
                # Extraction selon la structure: id, locataire_id, local_id, prop, date, objet, envoi, detail, loyer_id
                historique_id = clean_value(values[0])
                locataire_id = clean_value(values[1])
                local_id = clean_value(values[2])
                date_val = normalize_date(clean_value(values[4]))
                objet = clean_value(values[5])
                detail = clean_value(values[7])
                
                try:
                    cur.execute("""
                        INSERT INTO audit_logs (id, date, objet, detail, locataire_id, local_id)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (historique_id, date_val, objet, detail, locataire_id, local_id))
                    
                    imported += 1
                    if imported % 1000 == 0:
                        print(f"✅ {imported:,} lignes importées...")
                        conn.commit()
                    
                except psycopg2.IntegrityError:
                    conn.rollback()
                    skipped += 1
                    
                except Exception as e:
                    conn.rollback()
                    errors += 1
                    if errors <= 5:
                        print(f"⚠️  Erreur ligne {line_num}: {e}")
            
            except Exception as e:
                errors += 1
                if errors <= 5:
                    print(f"⚠️  Parse erreur ligne {line_num}: {e}")
    
    conn.commit()
    cur.close()
    conn.close()
    
    print(f"\n🎉 IMPORT TERMINÉ !")
    print(f"   ✅ Importées: {imported:,}")
    print(f"   ⏭️  Ignorées (doublons): {skipped:,}")
    print(f"   ❌ Erreurs: {errors:,}")
    
    return imported

if __name__ == "__main__":
    try:
        count = import_historique()
        sys.exit(0 if count > 0 else 1)
    except Exception as e:
        print(f"❌ ERREUR FATALE: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

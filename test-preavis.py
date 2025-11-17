#!/usr/bin/env python3
"""
Test script for Preavis API endpoints
"""

import requests
import json
import time
import subprocess
import sys
from datetime import datetime, timedelta

BASE_URL = "http://localhost:4000/api"
HEADERS = {"Content-Type": "application/json"}

# Couleurs pour le terminal
class Colors:
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'

def print_section(title):
    print(f"\n{Colors.CYAN}{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}{Colors.END}\n")

def print_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.YELLOW}⏳ {msg}{Colors.END}")

def test_health():
    """Vérifier la santé du serveur"""
    print_section("1. Vérification de la santé du serveur")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print_success("Serveur est opérationnel")
            print(f"Réponse: {json.dumps(response.json(), indent=2)}")
            return True
        else:
            print_error(f"Serveur retourne le code {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Impossible de se connecter: {e}")
        return False

def test_create_preavis():
    """Créer un préavis"""
    print_section("2. Test POST /api/preavis (Créer une notice)")
    
    today = datetime.now().strftime("%Y-%m-%d")
    effect_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
    
    payload = {
        "contrat_id": 1,
        "locataire_id": 1,
        "date_emission": today,
        "date_effet": effect_date,
        "motif": "Test départ locataire",
        "type": "DEPART"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/preavis",
            headers=HEADERS,
            json=payload,
            timeout=5
        )
        
        if response.status_code in [200, 201]:
            print_success("Préavis créé")
            data = response.json()
            print(f"Réponse: {json.dumps(data, indent=2)}")
            return data.get('data', {}).get('id') if 'data' in data else None
        else:
            print_error(f"Code {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_error(f"Erreur: {e}")
        return None

def test_list_preavis():
    """Lister les préavis"""
    print_section("3. Test GET /api/preavis (Lister les notices)")
    
    try:
        response = requests.get(
            f"{BASE_URL}/preavis",
            headers=HEADERS,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            count = data.get('count', 0)
            print_success(f"Récupération de {count} préavis")
            print(f"Réponse: {json.dumps(data, indent=2)[:500]}...")
            return True
        else:
            print_error(f"Code {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_error(f"Erreur: {e}")
        return False

def test_dashboard_alerts():
    """Récupérer les alertes du dashboard"""
    print_section("4. Test GET /api/preavis/status/dashboard (Alertes IA)")
    
    try:
        response = requests.get(
            f"{BASE_URL}/preavis/status/dashboard",
            headers=HEADERS,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            total_alerts = data.get('total', 0)
            by_priority = data.get('by_priority', {})
            
            print_success(f"Total d'alertes: {total_alerts}")
            print(f"  - Critiques: {len(by_priority.get('critical', []))}")
            print(f"  - Hautes: {len(by_priority.get('high', []))}")
            print(f"  - Moyennes: {len(by_priority.get('medium', []))}")
            print(f"  - Basses: {len(by_priority.get('low', []))}")
            
            print(f"\nRéponse complète: {json.dumps(data, indent=2)[:800]}...")
            return True
        else:
            print_error(f"Code {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_error(f"Erreur: {e}")
        return False

def main():
    print(f"\n{Colors.CYAN}")
    print("🚀 TEST SYSTÈME PRÉAVIS AKIG")
    print("=" * 60)
    print(f"{Colors.END}\n")
    
    print_info("Attente de 3 secondes pour que le serveur démarre...")
    time.sleep(3)
    
    # Exécuter les tests
    results = []
    results.append(("Health Check", test_health()))
    
    if results[0][1]:  # Si health check OK
        results.append(("Create Preavis", test_create_preavis() is not None))
        results.append(("List Preavis", test_list_preavis()))
        results.append(("Dashboard Alerts", test_dashboard_alerts()))
    
    # Résumé
    print_section("RÉSUMÉ DES TESTS")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = f"{Colors.GREEN}✅ PASS{Colors.END}" if result else f"{Colors.RED}❌ FAIL{Colors.END}"
        print(f"  {test_name}: {status}")
    
    print(f"\n{Colors.GREEN}Résultat: {passed}/{total} tests réussis{Colors.END}\n")
    
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())

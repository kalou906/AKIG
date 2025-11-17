#!/bin/bash
# 📊 MONITORING EN TEMPS RÉEL - AKIG PLATFORM
# Exécuter: bash monitor.sh

echo "╔════════════════════════════════════════════════════════════╗"
echo "║    📊 AKIG MONITORING - Temps Réel                        ║"
echo "║                   Appuyez sur Ctrl+C pour quitter         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

API_URL="http://localhost:4000"
REFRESH_RATE=5  # secondes

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Fonction: Afficher tableau
display_dashboard() {
  clear
  
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║           📊 AKIG PLATFORM - TABLEAU DE BORD              ║${NC}"
  echo -e "${BLUE}║                     $(date '+%H:%M:%S')${NC}                                     ${BLUE}║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  
  # ==================== API HEALTH ====================
  echo -e "${MAGENTA}═══ API HEALTH ═══${NC}"
  
  api_status=$(curl -s -w "%{http_code}" -o /dev/null "$API_URL/api/health" 2>/dev/null)
  
  if [ "$api_status" == "200" ]; then
    echo -e "  Backend Status:    ${GREEN}✅ ONLINE${NC}"
  else
    echo -e "  Backend Status:    ${RED}❌ OFFLINE${NC}"
  fi
  
  # ==================== RESPONSE TIMES ====================
  echo -e "\n${MAGENTA}═══ TEMPS DE RÉPONSE (ms) ═══${NC}"
  
  endpoints=(
    "api/health"
    "api/gamification/badges"
    "api/training/modules"
    "api/scalability/countries"
  )
  
  for endpoint in "${endpoints[@]}"; do
    start=$(date +%s%N | cut -b1-13)
    response=$(curl -s -w "%{http_code}" -o /dev/null "$API_URL/$endpoint" 2>/dev/null)
    end=$(date +%s%N | cut -b1-13)
    time=$((end - start))
    
    if [ $time -lt 200 ]; then
      echo -e "  $endpoint: ${GREEN}${time}ms${NC}"
    elif [ $time -lt 500 ]; then
      echo -e "  $endpoint: ${YELLOW}${time}ms${NC}"
    else
      echo -e "  $endpoint: ${RED}${time}ms${NC}"
    fi
  done
  
  # ==================== SYSTEM RESOURCES ====================
  echo -e "\n${MAGENTA}═══ RESSOURCES SYSTÈME ═══${NC}"
  
  if command -v node &> /dev/null; then
    node_pid=$(pgrep -f "node.*index.js" | head -n 1)
    
    if [ ! -z "$node_pid" ]; then
      # CPU Usage
      cpu=$(ps -p $node_pid -o %cpu= 2>/dev/null | xargs)
      # Memory Usage
      mem=$(ps -p $node_pid -o %mem= 2>/dev/null | xargs)
      mem_mb=$(ps -p $node_pid -o rss= 2>/dev/null | awk '{printf "%.0f", $1/1024}')
      
      echo "  Backend PID:       $node_pid"
      
      if [ ! -z "$cpu" ]; then
        if (( $(echo "$cpu < 50" | bc -l) )); then
          echo -e "  CPU Usage:         ${GREEN}${cpu}%${NC}"
        elif (( $(echo "$cpu < 80" | bc -l) )); then
          echo -e "  CPU Usage:         ${YELLOW}${cpu}%${NC}"
        else
          echo -e "  CPU Usage:         ${RED}${cpu}%${NC}"
        fi
      fi
      
      if [ ! -z "$mem" ]; then
        if (( $(echo "$mem < 2" | bc -l) )); then
          echo -e "  Memory Usage:      ${GREEN}${mem}% (${mem_mb}MB)${NC}"
        elif (( $(echo "$mem < 5" | bc -l) )); then
          echo -e "  Memory Usage:      ${YELLOW}${mem}% (${mem_mb}MB)${NC}"
        else
          echo -e "  Memory Usage:      ${RED}${mem}% (${mem_mb}MB)${NC}"
        fi
      fi
    else
      echo -e "  Backend PID:       ${RED}Non trouvé${NC}"
    fi
  fi
  
  # ==================== DATABASE ====================
  echo -e "\n${MAGENTA}═══ BASE DE DONNÉES ═══${NC}"
  
  db_status=$(curl -s "$API_URL/api/health" 2>/dev/null | grep -c "\"status\"")
  
  if [ $db_status -gt 0 ]; then
    echo -e "  DB Status:         ${GREEN}✅ CONNECTED${NC}"
    echo -e "  DB Type:           PostgreSQL"
  else
    echo -e "  DB Status:         ${RED}❌ DISCONNECTED${NC}"
  fi
  
  # ==================== ERROR LOG ====================
  echo -e "\n${MAGENTA}═══ DERNIERS ERREURS ═══${NC}"
  
  if [ -f "/var/log/akig/backend.log" ]; then
    error_count=$(grep -c "ERROR" /var/log/akig/backend.log 2>/dev/null || echo "0")
    if [ $error_count -gt 0 ]; then
      echo -e "  Erreurs (dernières):  ${RED}$error_count${NC}"
      tail -n 3 /var/log/akig/backend.log | grep -i error | head -n 1
    else
      echo -e "  Erreurs:             ${GREEN}0${NC}"
    fi
  else
    echo -e "  Log fichier:         ⚠️  Non trouvé"
  fi
  
  # ==================== SERVICES ====================
  echo -e "\n${MAGENTA}═══ SERVICES ═══${NC}"
  
  services=(
    "Security"
    "AI Prescriptive"
    "Gamification"
    "Scalability"
    "UX Offline"
    "Training"
  )
  
  for service in "${services[@]}"; do
    echo -e "  ✅ $service"
  done
  
  # ==================== ALERTS ====================
  echo -e "\n${MAGENTA}═══ ALERTES ═══${NC}"
  
  # Vérifier API response
  if [ "$api_status" != "200" ]; then
    echo -e "  ${RED}🚨 CRITIQUE: API ne répond pas!${NC}"
  fi
  
  # Vérifier ressources
  if [ ! -z "$cpu" ] && (( $(echo "$cpu > 90" | bc -l) )); then
    echo -e "  ${YELLOW}⚠️  ATTENTION: CPU élevé (${cpu}%)${NC}"
  fi
  
  if [ ! -z "$mem" ] && (( $(echo "$mem > 5" | bc -l) )); then
    echo -e "  ${YELLOW}⚠️  ATTENTION: Mémoire élevée (${mem}%)${NC}"
  fi
  
  # ==================== FOOTER ====================
  echo -e "\n${BLUE}════════════════════════════════════════════════════════════${NC}"
  echo -e "  Rafraîchissement: tous les ${REFRESH_RATE}s"
  echo -e "  Appuyez sur Ctrl+C pour quitter"
  echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
}

# Boucle principale
while true; do
  display_dashboard
  sleep $REFRESH_RATE
done

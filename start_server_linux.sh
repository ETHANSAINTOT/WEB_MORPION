#!/bin/bash

# Couleurs
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

clear

# Vérification du dossier
if [ ! -d "program" ]; then
    echo -e "${RED}ERREUR : Le dossier 'program' est introuvable !${NC}"
    exit 1
fi

cd program

echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           🚀  SERVEUR MORPION ULTIMATE  🚀           ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Question PORT
echo -e "${YELLOW}Sur quel port lancer le serveur ? (Défaut: 7498)${NC}"
read -p "Port : " input_port
if [ -z "$input_port" ]; then port=7498; else port=$input_port; fi

# 2. Question LOGS
echo ""
echo -e "${YELLOW}Voulez-vous afficher les requêtes (GET/POST) dans le terminal ? (y/n)${NC}"
read -p "Choix : " show_logs

# Récupération IP
my_ip=$(hostname -I | awk '{print $1}')

clear
echo -e "${GREEN}✅ SERVEUR LANCE !${NC}"
echo "--------------------------------------------------"
echo -e "🏠 PC LOCAL (Toi)     : ${CYAN}http://localhost:$port${NC}"
echo -e "📱 MOBILE / AUTRE PC  : ${CYAN}http://$my_ip:$port${NC}"
echo "--------------------------------------------------"
echo -e "${YELLOW}Appuyez sur CTRL+C pour arrêter.${NC}"
echo ""

# Lancement avec ou sans logs
if [[ "$show_logs" == "n" || "$show_logs" == "N" ]]; then
    echo "Mode silencieux activé (Logs cachés)."
    php -S 0.0.0.0:$port > /dev/null 2>&1
else
    php -S 0.0.0.0:$port
fi

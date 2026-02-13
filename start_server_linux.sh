#!/bin/bash

GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'


if [ -d "program" ]; then
    cd program
else
    echo -e "${RED}Erreur : Le dossier 'program' est introuvable !${NC}"
    echo "Vérifiez que ce script est bien à côté du dossier program."
    exit 1
fi


clear

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}      LANCEMENT DU SERVEUR MORPION       ${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""


read -p "Sur quel port voulez-vous lancer le jeu ? (Défaut: 7498) : " input_port


if [ -z "$input_port" ]; then
    port=7498
else
    port=$input_port
fi


my_ip=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}✅ Serveur prêt !${NC}"
echo "-----------------------------------------"
echo -e "Accès sur ce PC    : ${GREEN}http://localhost:$port${NC}"
echo -e "Accès autres (Tél) : ${GREEN}http://$my_ip:$port${NC}"
echo "-----------------------------------------"
echo "Appuyez sur CTRL+C pour arrêter."
echo ""


php -S 0.0.0.0:$port
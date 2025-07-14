#!/bin/bash
BOT_DIR="PRINCE"
BOT_REPO="https://github.com/DASTAGHIR/$BOT_DIR"

GREEN='\033[32m'
BOLD='\033[1m'
RESET='\033[0m'

# Ensure you're in the correct directory
cd /app

if [ -d "$BOT_DIR" ]; then
    echo -e "${BOLD}${GREEN}Updating dependencies for $BOT_DIR...\n${RESET}"
    cd "$BOT_DIR"
    git pull origin main
    npm install --legacy-peer-deps
    echo -e "${BOLD}${GREEN}Starting $BOT_DIR...\n${RESET}"
    npm start
else
    echo -e "${BOLD}${GREEN}$BOT_DIR directory not found, please ensure the bot is deployed correctly.\n${RESET}"
fi

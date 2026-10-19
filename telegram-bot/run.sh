#!/usr/bin/env bash

# ==============================================================================
# 🌌 WuWa Betting — Telegram Bot Launcher Script (Termux / Linux / VPS)
# ==============================================================================

set -e

# Terminal Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Determine Script Directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo -e "${CYAN}${BOLD}"
echo "=========================================================="
echo "    🌌 WuWa Betting — Telegram Notification Bot Daemon   "
echo "=========================================================="
echo -e "${NC}"

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}[Error] Node.js is not installed!${NC}"
    echo -e "${YELLOW}👉 In Termux run: pkg install nodejs -y${NC}"
    echo -e "${YELLOW}👉 In Ubuntu/Debian run: sudo apt install nodejs npm -y${NC}"
    exit 1
fi

NODE_VER=$(node -v)
echo -e "${GREEN}✓ Node.js detected: ${NODE_VER}${NC}"

# 2. Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found! Creating one from .env.example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Created telegram-bot/.env${NC}"
        echo -e "${YELLOW}👉 Please edit .env now and put your TELEGRAM_BOT_TOKEN:${NC}"
        echo -e "${CYAN}   nano .env${NC}"
        exit 0
    else
        echo -e "${RED}[Error] .env.example not found!${NC}"
        exit 1
    fi
fi

# 3. Check for dependencies (node_modules)
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 node_modules not found. Installing dependencies...${NC}"
    npm install --silent
    echo -e "${GREEN}✓ Dependencies installed successfully!${NC}"
fi

# 4. Handle Arguments
ACTION="${1:-foreground}"

case "$ACTION" in
    bg|background|daemon)
        if ! command -v pm2 &> /dev/null; then
            echo -e "${YELLOW}⚡ Installing PM2 process manager for background execution...${NC}"
            npm install -g pm2
        fi
        echo -e "${GREEN}🚀 Starting WuWa Bot in background with PM2...${NC}"
        pm2 start src/bot.js --name "wuwa-bot" --time
        pm2 save
        echo -e "${GREEN}✓ Bot is running in background!${NC}"
        echo -e "${CYAN}Commands:${NC}"
        echo -e "  ./run.sh logs    - View real-time logs"
        echo -e "  ./run.sh status  - Check bot status"
        echo -e "  ./run.sh stop    - Stop the bot"
        echo -e "  ./run.sh restart - Restart the bot"
        ;;

    stop)
        if command -v pm2 &> /dev/null; then
            echo -e "${YELLOW}🛑 Stopping WuWa Bot via PM2...${NC}"
            pm2 stop wuwa-bot || true
            echo -e "${GREEN}✓ Bot stopped.${NC}"
        else
            echo -e "${RED}PM2 is not installed or bot was not started with PM2.${NC}"
        fi
        ;;

    restart)
        if command -v pm2 &> /dev/null; then
            echo -e "${YELLOW}🔄 Restarting WuWa Bot...${NC}"
            pm2 restart wuwa-bot
            echo -e "${GREEN}✓ Bot restarted.${NC}"
        else
            echo -e "${RED}PM2 is not installed. Start the bot first with ./run.sh bg${NC}"
        fi
        ;;

    status)
        if command -v pm2 &> /dev/null; then
            pm2 status wuwa-bot
        else
            echo -e "${RED}PM2 is not installed.${NC}"
        fi
        ;;

    logs)
        if command -v pm2 &> /dev/null; then
            pm2 logs wuwa-bot --lines 50
        else
            echo -e "${RED}PM2 is not installed.${NC}"
        fi
        ;;

    fg|foreground|*)
        echo -e "${GREEN}🚀 Starting WuWa Bot in foreground (Press Ctrl+C to stop)...${NC}"
        echo ""
        node src/bot.js
        ;;
esac

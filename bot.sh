#!/usr/bin/env bash

# ==============================================================================
# 🌌 WuWa Betting — Quick Root Bot Launcher
# Usage:
#   bash bot.sh          (Run in foreground)
#   bash bot.sh bg       (Run in background with PM2)
#   bash bot.sh logs     (View live logs)
#   bash bot.sh status   (Check status)
#   bash bot.sh stop     (Stop the bot)
#   bash bot.sh restart  (Restart the bot)
# ==============================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/telegram-bot"
bash run.sh "$@"

#!/usr/bin/env bash

# ==============================================================================
# 🌌 WuWa Betting — Root Launcher for Telegram Bot
# Run this script directly from the project root directory
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ ! -d "$DIR/telegram-bot" ]; then
    echo "❌ Error: telegram-bot directory not found in $DIR!"
    exit 1
fi

cd "$DIR/telegram-bot"
bash run.sh "$@"

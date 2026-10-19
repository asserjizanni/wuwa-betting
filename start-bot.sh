#!/usr/bin/env bash

# Helper script to launch the telegram bot from root directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/telegram-bot"
bash run.sh "$@"

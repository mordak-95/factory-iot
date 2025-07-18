#!/bin/bash
set -e

# Prompt for device config
ENV_PATH="$(dirname "$0")/.env"
if [ -f "$ENV_PATH" ]; then
  echo ".env already exists at $ENV_PATH."
  read -p "Do you want to overwrite it? (y/N): " OVERWRITE
  if [[ ! "$OVERWRITE" =~ ^[Yy]$ ]]; then
    echo "Keeping existing .env."
  else
    rm "$ENV_PATH"
  fi
fi

if [ ! -f "$ENV_PATH" ]; then
  read -p "Enter DEVICE_ID (from central server): " DEVICE_ID
  read -p "Enter DEVICE_TOKEN (from central server): " DEVICE_TOKEN
  read -p "Enter CENTRAL_SERVER_URL (e.g. http://192.168.1.100:5000): " CENTRAL_SERVER_URL
  echo "DEVICE_ID=$DEVICE_ID" > "$ENV_PATH"
  echo "DEVICE_TOKEN=$DEVICE_TOKEN" >> "$ENV_PATH"
  echo "CENTRAL_SERVER_URL=$CENTRAL_SERVER_URL" >> "$ENV_PATH"
  echo ".env created at $ENV_PATH."
fi

# ... existing install logic ... 
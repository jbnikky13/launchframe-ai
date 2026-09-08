#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/launchframe-ai}"
cd "$REPO_DIR"

if [ ! -f .env.worker ]; then
  cp .env.worker.example .env.worker
  echo "Created .env.worker. Add your real Supabase/Gemini values, then rerun this script."
  exit 1
fi

sudo apt-get update
sudo apt-get install -y ca-certificates curl git

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
fi

sudo systemctl enable --now docker
sudo usermod -aG docker "$USER" || true

sudo docker compose -f docker-compose.oracle.yml up -d --build
sudo docker compose -f docker-compose.oracle.yml ps

echo "LaunchFrame worker is deployed."

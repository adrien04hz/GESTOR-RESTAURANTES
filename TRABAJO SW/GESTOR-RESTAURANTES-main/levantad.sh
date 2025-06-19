#!/bin/bash
set -e  # Detiene el script si ocurre un error

# Guarda la ruta base para volver fácilmente
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

# Inicia MongoDB con Docker Compose
# cd "$BASE_DIR/BD-mongo"
# docker compose up -d
# sleep 2

# Inicia el frontend en una nueva terminal
cd "$BASE_DIR/gestor-next"
gnome-terminal -- bash -c "npm run dev; exec bash"
sleep 1

# Inicia el backend (ENDPOINTS) en una nueva terminal
cd "$BASE_DIR/ENDPOINTS"
source venv/bin/activate
sleep 2
gnome-terminal -- bash -c "uvicorn app:app --reload; exec bash"
sleep 1


# Abre VS Code en el directorio base (sin terminal extra)
# Abre VS Code en el frontend
code "$BASE_DIR/gestor-next"

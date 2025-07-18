#!/bin/bash
set -e

# Find the central-server directory (must contain backend/ and frontend/)
SEARCH_DIR=$(pwd)
PROJECT_DIR=""

while [ "$SEARCH_DIR" != "/" ]; do
  if [ -d "$SEARCH_DIR/backend" ] && [ -d "$SEARCH_DIR/frontend" ]; then
    PROJECT_DIR="$SEARCH_DIR"
    break
  fi
  SEARCH_DIR=$(dirname "$SEARCH_DIR")
done

if [ -z "$PROJECT_DIR" ]; then
  echo "central-server directory not found. Cloning from GitHub..."
  if [ ! -d "$HOME/factory-iot" ]; then
    git clone https://github.com/mordak-95/factory-iot.git "$HOME/factory-iot"
  fi
  PROJECT_DIR="$HOME/factory-iot/central-server"
  if [ ! -d "$PROJECT_DIR/backend" ] || [ ! -d "$PROJECT_DIR/frontend" ]; then
    echo "Error: Could not find or clone central-server directory with backend/ and frontend/ folders."
    exit 1
  fi
fi

cd "$PROJECT_DIR"

# Settings
DB_NAME="central_db"
DB_USER="postgres"
DB_PASS=$(openssl rand -base64 16 | tr -dc 'A-Za-z0-9' | head -c 16)
DB_PORT="5432"
DB_HOST="localhost"
BACKEND_PORT="5000"
FRONTEND_PORT="3000"

# Clean up previous installations
echo "[0/8] Cleaning up previous installations..."
rm -rf "$PROJECT_DIR/backend/venv" "$PROJECT_DIR/backend/.env" "$PROJECT_DIR/backend.log" "$PROJECT_DIR/frontend.log"
rm -rf "$PROJECT_DIR/frontend/node_modules"

# Install prerequisites
echo "[1/8] Installing prerequisites..."
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv postgresql postgresql-contrib curl git openssl

# Install Node.js (LTS) and yarn if not present
if ! command -v node &> /dev/null; then
  echo "[2/8] Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
if ! command -v yarn &> /dev/null; then
  sudo npm install -g yarn
fi

# Setup and configure PostgreSQL
echo "[3/8] Setting up PostgreSQL..."
sudo systemctl enable postgresql
sudo systemctl start postgresql
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" || true
sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Create .env for backend
cd "$PROJECT_DIR/backend"
cat > .env <<EOF
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASS
DB_PORT=$DB_PORT
DB_HOST=$DB_HOST
EOF

# Setup backend
echo "[4/8] Setting up backend..."
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
nohup venv/bin/python app.py > "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
cd "$PROJECT_DIR"

# Setup frontend
echo "[5/8] Setting up frontend..."
cd "$PROJECT_DIR/frontend"
yarn install
nohup yarn start --port $FRONTEND_PORT > "$PROJECT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
cd "$PROJECT_DIR"

# Done
echo "[6/8] All services are running."
echo "- Backend: http://localhost:$BACKEND_PORT (log: backend.log)"
echo "- Frontend: http://localhost:$FRONTEND_PORT (log: frontend.log)"
echo "- PostgreSQL: port $DB_PORT, database $DB_NAME, user $DB_USER"
echo "- Database password: $DB_PASS"
echo "To stop the services, run:"
echo "  kill $BACKEND_PID $FRONTEND_PID" 
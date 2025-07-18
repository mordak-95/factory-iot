#!/bin/bash
set -e

# Check if run from the correct directory
SCRIPT_DIR=$(pwd)
if [ ! -d "$SCRIPT_DIR/backend" ] || [ ! -d "$SCRIPT_DIR/frontend" ]; then
  echo "Error: Please run this script from the central-server directory where 'backend' and 'frontend' folders exist."
  exit 1
fi

# Settings
DB_NAME="central_db"
DB_USER="postgres"
DB_PASS="password"
DB_PORT="5432"
DB_HOST="localhost"
BACKEND_PORT="5000"
FRONTEND_PORT="3000"

# Install prerequisites
echo "[1/8] Installing prerequisites..."
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv postgresql postgresql-contrib curl git

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
cd "$SCRIPT_DIR/backend"
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
nohup venv/bin/python app.py > "$SCRIPT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

# Setup frontend
echo "[5/8] Setting up frontend..."
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
  yarn install
fi
nohup yarn start --port $FRONTEND_PORT > "$SCRIPT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
cd "$SCRIPT_DIR"

# Done
echo "[6/8] All services are running."
echo "- Backend: http://localhost:$BACKEND_PORT (log: backend.log)"
echo "- Frontend: http://localhost:$FRONTEND_PORT (log: frontend.log)"
echo "- PostgreSQL: port $DB_PORT, database $DB_NAME, user $DB_USER"
echo "To stop the services, run:"
echo "  kill $BACKEND_PID $FRONTEND_PID" 
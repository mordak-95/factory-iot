#!/bin/bash
set -e

# Backup .env outside the project before deleting everything
ENV_ORIG="$HOME/factory-iot/central-server/backend/.env"
ENV_TMP="/tmp/central-server.env.bak"
if [ -f "$ENV_ORIG" ]; then
  cp "$ENV_ORIG" "$ENV_TMP"
fi

# Always remove any previous central-server code and clone the latest version
if [ -d "$HOME/factory-iot" ]; then
  echo "Removing previous factory-iot directory..."
  rm -rf "$HOME/factory-iot"
fi

echo "Cloning latest factory-iot repository from GitHub..."
git clone https://github.com/mordak-95/factory-iot.git "$HOME/factory-iot"
PROJECT_DIR="$HOME/factory-iot/central-server"

if [ ! -d "$PROJECT_DIR/backend" ] || [ ! -d "$PROJECT_DIR/frontend" ]; then
  echo "Error: Could not find central-server directory with backend/ and frontend/ folders."
  exit 1
fi

cd "$PROJECT_DIR"

# Restore .env if backup exists (after clone, before any backend config)
ENV_PATH="$PROJECT_DIR/backend/.env"
if [ -f "$ENV_TMP" ]; then
  cp "$ENV_TMP" "$ENV_PATH"
  rm "$ENV_TMP"
fi

# Settings
DB_NAME="central_db"
DB_USER="postgres"
DB_PASS=$(openssl rand -base64 16 | tr -dc 'A-Za-z0-9' | head -c 16)
DB_HOST="localhost"
BACKEND_PORT="5000"
FRONTEND_PORT="3000"

# Clean up previous installations (just in case)
echo "[0/8] Cleaning up previous installations..."
rm -rf "$PROJECT_DIR/backend/venv" "$PROJECT_DIR/backend.log" "$PROJECT_DIR/frontend.log"
if [ -d "$PROJECT_DIR/frontend/node_modules" ]; then
  rm -rf "$PROJECT_DIR/frontend/node_modules" 2>/dev/null || (find "$PROJECT_DIR/frontend/node_modules" -type f -exec rm -f {} + && find "$PROJECT_DIR/frontend/node_modules" -type d -empty -delete)
fi

# Install prerequisites
echo "[1/8] Installing prerequisites..."
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv postgresql postgresql-contrib curl git openssl net-tools

# Install Node.js (LTS) and yarn if not present
if ! command -v node &> /dev/null; then
  echo "[2/8] Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
if ! command -v yarn &> /dev/null; then
  sudo npm install -g yarn
fi

# Detect active PostgreSQL port
echo "[3/8] Detecting active PostgreSQL port..."
DB_PORT=$(sudo netstat -tulnp 2>/dev/null | grep postgres | grep LISTEN | awk '{print $4}' | sed 's/.*://g' | sort | uniq | grep -E '^[0-9]+$' | head -n1)
if [ -z "$DB_PORT" ]; then
  # fallback: try default
  DB_PORT=5432
fi

# Check if database exists
db_exists=$(sudo -u postgres psql -p $DB_PORT -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';")

# Always check .env in backend directory for previous password
if [ -f "$ENV_PATH" ]; then
  PREV_DB_PASS=$(grep '^DB_PASS=' "$ENV_PATH" | cut -d'=' -f2-)
else
  PREV_DB_PASS=""
fi

# Setup and configure PostgreSQL
echo "[4/8] Setting up PostgreSQL on port $DB_PORT..."
sudo systemctl enable postgresql
sudo systemctl start postgresql
if [ "$db_exists" != "1" ]; then
  # Database does not exist, create and set new password
  sudo -u postgres psql -p $DB_PORT -c "CREATE DATABASE $DB_NAME;"
  sudo -u postgres psql -p $DB_PORT -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';"
  sudo -u postgres psql -p $DB_PORT -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
  DB_PASS_TO_USE=$DB_PASS
else
  # Database exists
  if [ -n "$PREV_DB_PASS" ]; then
    DB_PASS_TO_USE=$PREV_DB_PASS
    echo "Database $DB_NAME already exists. Using previous password from .env."
  else
    sudo -u postgres psql -p $DB_PORT -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';"
    DB_PASS_TO_USE=$DB_PASS
    echo "Database $DB_NAME already exists but no previous password found. Setting a new password."
  fi
fi

# Create .env for backend if it does not exist
cd "$PROJECT_DIR/backend"
if [ ! -f ".env" ]; then
cat > .env <<EOF
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASS_TO_USE
DB_PORT=$DB_PORT
DB_HOST=$DB_HOST
EOF
fi

# Kill any previously running backend processes to avoid old code running
pkill -f app.py || true

# Setup backend
echo "[5/8] Setting up backend..."
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
nohup venv/bin/python app.py > "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
cd "$PROJECT_DIR"

# Setup frontend
echo "[6/8] Setting up frontend..."
cd "$PROJECT_DIR/frontend"
npm install


# npm run build
nohup npm start -- --port $FRONTEND_PORT > "$PROJECT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
cd "$PROJECT_DIR"

# Create systemd service for backend
BACKEND_SERVICE_PATH="/etc/systemd/system/factory-iot-backend.service"
cat <<EOF | sudo tee $BACKEND_SERVICE_PATH > /dev/null
[Unit]
Description=Factory IoT Backend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR/backend
Environment=PATH=$PROJECT_DIR/backend/venv/bin
ExecStart=$PROJECT_DIR/backend/venv/bin/python app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create systemd service for frontend
FRONTEND_SERVICE_PATH="/etc/systemd/system/factory-iot-frontend.service"
cat <<EOF | sudo tee $FRONTEND_SERVICE_PATH > /dev/null
[Unit]
Description=Factory IoT Frontend
After=network.target factory-iot-backend.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR/frontend
ExecStart=/usr/bin/npm start -- --port $FRONTEND_PORT
Restart=always
RestartSec=10
Environment=PORT=$FRONTEND_PORT

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable services
sudo systemctl daemon-reload
sudo systemctl enable factory-iot-backend.service
sudo systemctl enable factory-iot-frontend.service

# Start services
sudo systemctl start factory-iot-backend.service
sudo systemctl start factory-iot-frontend.service

# Print status
echo "[8/8] Systemd services created and enabled."
echo "- Backend: systemctl status factory-iot-backend.service"
echo "- Frontend: systemctl status factory-iot-frontend.service"
echo "- Both services will start automatically after reboot."
echo "To check status:"
echo "  systemctl status factory-iot-backend.service"
echo "  systemctl status factory-iot-frontend.service"
echo "To view logs:"
echo "  journalctl -u factory-iot-backend.service -f"
echo "  journalctl -u factory-iot-frontend.service -f"

# Done
echo "[7/8] All services are running."
echo "- Backend: http://localhost:$BACKEND_PORT (log: backend.log)"
echo "- Frontend: http://localhost:$FRONTEND_PORT (log: frontend.log)"
echo "- PostgreSQL: host $DB_HOST, port $DB_PORT, database $DB_NAME, user $DB_USER"
echo "- Database password: $DB_PASS_TO_USE"
echo "To stop the services, run:"
echo "  kill $BACKEND_PID $FRONTEND_PID" 
#!/bin/bash

# Factory IoT Quick Install Script for Raspberry Pi
# This script is designed to be executed via curl

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log file in home directory
LOG_FILE="$HOME/factory-iot-install.log"

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

# Function to log errors
log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

# Function to log warnings
log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Function to check if running on Raspberry Pi
check_raspberry_pi() {
    if [[ -f /proc/cpuinfo ]] && grep -q "Raspberry Pi" /proc/cpuinfo; then
        return 0
    else
        return 1
    fi
}

# Function to clone repository
clone_repository() {
    log "Cloning Factory IoT repository..."
    
    if [[ -d "factory-iot" ]]; then
        log_warning "Directory factory-iot already exists. Removing..."
        rm -rf factory-iot
    fi
    
    git clone https://github.com/mordak-95/factory-iot.git
    cd factory-iot
    
    log "Repository cloned successfully"
}

# Function to install system dependencies
install_system_deps() {
    log "Installing system dependencies..."
    
    if check_raspberry_pi; then
        log "Detected Raspberry Pi - installing Pi-specific dependencies..."
        # Update system
        sudo apt update && sudo apt upgrade -y
        # Install X server and display utilities
        sudo apt install --no-install-recommends xserver-xorg x11-xserver-utils xinit openbox -y
        # Install Chromium for kiosk mode
        sudo apt install chromium-browser -y
        # Install Python and pip
        sudo apt install python3 python3-pip python3-venv -y
        # Install git
        sudo apt install git -y
        # Install Node.js and npm
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt install -y nodejs
        # نصب درایورهای fbdev و fbturbo
        sudo apt install -y xserver-xorg-video-fbdev xserver-xorg-video-fbturbo
        # نصب unclutter برای مخفی کردن نشانگر موس
        sudo apt install -y unclutter
        # حذف تمام فایل‌های xorg.conf.d و xorg.conf
        sudo rm -rf /etc/X11/xorg.conf.d/*
        sudo rm -f /etc/X11/xorg.conf
        log "Removed all xorg.conf.d and xorg.conf files."
        # ویرایش config.txt برای استفاده از fkms به جای kms
        CONFIG_FILE="/boot/firmware/config.txt"
        # اگر dtoverlay=vc4-kms-v3d وجود دارد، آن را کامنت کن
        if grep -q '^dtoverlay=vc4-kms-v3d' "$CONFIG_FILE"; then
            sudo sed -i 's/^dtoverlay=vc4-kms-v3d/#dtoverlay=vc4-kms-v3d/' "$CONFIG_FILE"
        fi
        # اگر dtoverlay=vc4-fkms-v3d وجود ندارد، اضافه کن
        if ! grep -q '^dtoverlay=vc4-fkms-v3d' "$CONFIG_FILE"; then
            echo 'dtoverlay=vc4-fkms-v3d' | sudo tee -a "$CONFIG_FILE"
        fi
        # سایر تنظیمات HDMI و ...
        sudo grep -qxF 'max_framebuffers=2' "$CONFIG_FILE" || echo 'max_framebuffers=2' | sudo tee -a "$CONFIG_FILE"
        sudo grep -qxF 'hdmi_group=2' "$CONFIG_FILE" || echo 'hdmi_group=2' | sudo tee -a "$CONFIG_FILE"
        sudo grep -qxF 'hdmi_mode=82' "$CONFIG_FILE" || echo 'hdmi_mode=82' | sudo tee -a "$CONFIG_FILE"
        log "System dependencies and display config installed successfully"
    else
        log_warning "Not running on Raspberry Pi - installing basic dependencies..."
        sudo apt update
        sudo apt install python3 python3-pip python3-venv curl git -y
        # Install Node.js
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
}

# Function to install Python backend
install_backend() {
    log "Installing Python backend..."
    
    cd backend
    
    # Create virtual environment
    python3 -m venv venv
    source venv/bin/activate
    
    # Install Python dependencies
    pip install --upgrade pip
    pip install -r requirements.txt
    
    cd ..
    log "Backend installed successfully"
}

# Function to install React frontend
install_frontend() {
    log "Installing React frontend..."
    
    cd client
    
    # Install Node.js dependencies
    npm install
    
    cd ..
    log "Frontend installed successfully"
}

# Function to setup kiosk mode
setup_kiosk() {
    log "Setting up kiosk mode..."

    sudo usermod -aG tty "$USER"
    sudo usermod -aG video "$USER"

    cat > "$HOME/start-kiosk.sh" << 'EOF'
#!/bin/bash
unclutter -idle 0 &
exec > "$HOME/kiosk.log" 2>&1
set -x
xset s off
xset -dpms
xset s noblank
sleep 10
chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:3000
EOF

    chmod +x "$HOME/start-kiosk.sh"

    mkdir -p "$HOME/.config/openbox"
    cat > "$HOME/.config/openbox/autostart" << 'EOF'
$HOME/start-kiosk.sh
EOF
    chmod +x "$HOME/.config/openbox/autostart"

    if ! grep -q "startx" "$HOME/.bash_profile" 2>/dev/null; then
        cat >> "$HOME/.bash_profile" << 'EOF'

# Auto-start X server on tty1
if [ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
  startx
fi
EOF
    fi

    log "Kiosk mode setup completed"
}

# Function to enable autologin on tty1
setup_autologin() {
    log "Enabling autologin for user $USER on tty1..."
    sudo mkdir -p /etc/systemd/system/getty@tty1.service.d
    sudo tee /etc/systemd/system/getty@tty1.service.d/override.conf > /dev/null << EOF
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin $USER --noclear %I $TERM
EOF
    sudo systemctl daemon-reload
    sudo systemctl restart getty@tty1
    log "Autologin enabled on tty1."
}

# Function to create systemd services
create_services() {
    log "Creating systemd services..."
    
    CURRENT_DIR="$(pwd)"
    
    # Create backend service
    sudo tee /etc/systemd/system/factory-iot-backend.service > /dev/null << EOF
[Unit]
Description=Factory IoT Backend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$CURRENT_DIR/backend
Environment=PATH=$CURRENT_DIR/backend/venv/bin
ExecStart=$CURRENT_DIR/backend/venv/bin/python app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # Create frontend service
    sudo tee /etc/systemd/system/factory-iot-frontend.service > /dev/null << EOF
[Unit]
Description=Factory IoT Frontend
After=network.target factory-iot-backend.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$CURRENT_DIR/client
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable services
    sudo systemctl daemon-reload
    sudo systemctl enable factory-iot-backend.service
    sudo systemctl enable factory-iot-frontend.service
    
    log "Systemd services created and enabled"
}

# Function to start services
start_services() {
    log "Starting services..."
    
    sudo systemctl start factory-iot-backend.service
    sudo systemctl start factory-iot-frontend.service
    
    log "Services started successfully"
    log "Frontend available at: http://localhost:3000"
    log "Backend available at: http://localhost:5000"
}

# Function to show status
show_status() {
    echo -e "\n${BLUE}=== Factory IoT Status ===${NC}"
    
    echo -e "\n${YELLOW}Services:${NC}"
    systemctl is-active factory-iot-backend.service > /dev/null && echo -e "${GREEN}✓ Backend: Running${NC}" || echo -e "${RED}✗ Backend: Stopped${NC}"
    systemctl is-active factory-iot-frontend.service > /dev/null && echo -e "${GREEN}✓ Frontend: Running${NC}" || echo -e "${RED}✗ Frontend: Stopped${NC}"
    
    echo -e "\n${YELLOW}Ports:${NC}"
    echo "Frontend: http://localhost:3000"
    echo "Backend: http://localhost:5000"
    
    echo -e "\n${YELLOW}Installation Directory:${NC}"
    echo "$(pwd)"
    
    echo -e "\n${YELLOW}Log File:${NC}"
    echo "$LOG_FILE"
}

# --- نقش دستگاه را از کاربر بپرس ---
select_device_role() {
    echo "\nSelect device role:" >&2
    select role in "Central Server" "Device Controller"; do
        case $REPLY in
            1)
                DEVICE_ROLE="central"
                break
                ;;
            2)
                DEVICE_ROLE="controller"
                break
                ;;
            *)
                echo "Invalid option. Please select 1 or 2." >&2
                ;;
        esac
    done
}

install_postgresql() {
    log "Installing PostgreSQL (via Docker)..."
    if ! command -v docker &> /dev/null; then
        log "Docker not found. Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
    fi
    if ! command -v docker-compose &> /dev/null; then
        log "Docker Compose not found. Installing Docker Compose..."
        sudo apt-get install -y docker-compose
    fi
    POSTGRES_USER="factoryiot"
    POSTGRES_PASSWORD="factoryiotpass"
    POSTGRES_DB="factoryiotdb"
    log "Using PostgreSQL image: postgres:15"
    sudo tee docker-compose.yml > /dev/null << EOF
version: '3.1'
services:
  postgres:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_USER: $POSTGRES_USER
      POSTGRES_PASSWORD: $POSTGRES_PASSWORD
      POSTGRES_DB: $POSTGRES_DB
    ports:
      - 5432:5432
    volumes:
      - ./pg-data:/var/lib/postgresql/data
EOF
    sudo docker-compose up -d
    log "PostgreSQL started via Docker Compose."
}

install_central_backend() {
    log "Setting up central backend..."
    if [[ ! -d central-backend ]]; then
        mkdir central-backend
    fi
    cd central-backend
    # ایجاد فایل requirements.txt
    cat > requirements.txt << 'EOF'
Flask
Flask-CORS
psycopg2-binary
python-dotenv
EOF
    # ایجاد فایل app.py ساده (TODO: بعداً کامل می‌شود)
    cat > app.py << 'EOF'
from flask import Flask
from flask_cors import CORS
app = Flask(__name__)
CORS(app)
@app.route('/')
def index():
    return {'msg': 'Central Backend Running'}
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
EOF
    # نصب وابستگی‌ها
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    deactivate
    cd ..
    # ساخت systemd service
    CENTRAL_BACKEND_PATH="$(pwd)/central-backend"
    sudo tee /etc/systemd/system/factory-iot-central-backend.service > /dev/null << EOF
[Unit]
Description=Factory IoT Central Backend
After=network.target docker.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$CENTRAL_BACKEND_PATH
Environment=PATH=$CENTRAL_BACKEND_PATH/venv/bin
ExecStart=$CENTRAL_BACKEND_PATH/venv/bin/python app.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF
    sudo systemctl daemon-reload
    sudo systemctl enable factory-iot-central-backend.service
    sudo systemctl restart factory-iot-central-backend.service
    log "Central backend systemd service created and started."
}

install_central_frontend() {
    log "Setting up central frontend..."
    if [[ ! -d central-frontend ]]; then
        npx create-react-app central-frontend
    fi
    cd central-frontend
    npm install
    npm run build
    npx npm install -g serve
    cd ..
    # ساخت systemd service
    CENTRAL_FRONTEND_PATH="$(pwd)/central-frontend"
    sudo tee /etc/systemd/system/factory-iot-central-frontend.service > /dev/null << EOF
[Unit]
Description=Factory IoT Central Frontend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$CENTRAL_FRONTEND_PATH
ExecStart=npx serve -s build -l 3000
Restart=always

[Install]
WantedBy=multi-user.target
EOF
    sudo systemctl daemon-reload
    sudo systemctl enable factory-iot-central-frontend.service
    sudo systemctl restart factory-iot-central-frontend.service
    log "Central frontend systemd service created and started."
}

# --- اجرای نصب بر اساس نقش ---
main_install() {
    log "Starting Factory IoT installation..."
    select_device_role
    if [[ "$DEVICE_ROLE" == "central" ]]; then
        install_postgresql
        install_central_backend
        install_central_frontend
        # برگرداندن مالکیت کل پروژه به کاربر فعلی
        sudo chown -R $USER:$USER "$(pwd)"
        log "Central server installation complete!"
        echo -e "\n==================== INFO ===================="
        echo -e "PostgreSQL:  postgres://factoryiot:factoryiotpass@localhost:5432/factoryiotdb"
        echo -e "Backend API:  http://localhost:5001/"
        echo -e "Frontend UI:  http://localhost:3000/"
        echo -e "============================================="
        exit 0
    fi

    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root"
        exit 1
    fi

    # Create log file
    touch "$LOG_FILE"

    log "Installing system dependencies..."
    install_system_deps

    log "Cloning repository..."
    clone_repository

    log "Installing backend..."
    install_backend

    log "Installing frontend..."
    install_frontend

    log "Setting up kiosk mode..."
    setup_kiosk

    # فعال‌سازی autologin
    setup_autologin

    log "Creating services..."
    create_services

    log "Starting services..."
    start_services

    log "Installation completed successfully!"

    echo -e "\n${GREEN}================================${NC}" | tee -a "$LOG_FILE"
    echo -e "${GREEN}  Factory IoT Installation Complete!${NC}" | tee -a "$LOG_FILE"
    echo -e "${GREEN}================================${NC}" | tee -a "$LOG_FILE"
    echo -e "Frontend: ${BLUE}http://localhost:3000${NC}" | tee -a "$LOG_FILE"
    echo -e "Backend:  ${BLUE}http://localhost:5000${NC}" | tee -a "$LOG_FILE"
    echo -e "Log file: ${BLUE}$LOG_FILE${NC}" | tee -a "$LOG_FILE"
    echo -e "\n${YELLOW}To check status:${NC}" | tee -a "$LOG_FILE"
    echo -e "  systemctl status factory-iot-backend.service" | tee -a "$LOG_FILE"
    echo -e "  systemctl status factory-iot-frontend.service" | tee -a "$LOG_FILE"
    echo -e "\n${YELLOW}To view logs:${NC}" | tee -a "$LOG_FILE"
    echo -e "  journalctl -u factory-iot-backend.service -f" | tee -a "$LOG_FILE"
    echo -e "  journalctl -u factory-iot-frontend.service -f" | tee -a "$LOG_FILE"
}

# Run main installation
main_install 
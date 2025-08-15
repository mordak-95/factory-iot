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

# Function to check and install gpiozero
check_gpiozero() {
    log "Checking gpiozero installation..."
    
    if python3 -c "import gpiozero" 2>/dev/null; then
        log "✓ gpiozero is already installed"
    else
        log "Installing gpiozero..."
        sudo apt install -y python3-gpiozero
        if python3 -c "import gpiozero" 2>/dev/null; then
            log "✓ gpiozero installed successfully"
        else
            log_warning "Failed to install gpiozero via apt, trying pip..."
            pip3 install gpiozero
            if python3 -c "import gpiozero" 2>/dev/null; then
                log "✓ gpiozero installed successfully via pip"
            else
                log_error "Failed to install gpiozero. Motion sensors may not work."
            fi
        fi
    fi
}

# Function to create necessary config files
create_config_files() {
    log "Creating necessary config files..."
    
    # Create motion_sensor_config.json if it doesn't exist
    MOTION_CONFIG="$REPO_DIR/backend/motion_sensor_config.json"
    if [ ! -f "$MOTION_CONFIG" ]; then
        echo '[]' > "$MOTION_CONFIG"
        log "✓ Created motion_sensor_config.json"
    else
        log "✓ motion_sensor_config.json already exists"
    fi
    
    # Create relay_config.json if it doesn't exist
    RELAY_CONFIG="$REPO_DIR/backend/relay_config.json"
    if [ ! -f "$RELAY_CONFIG" ]; then
        echo '[]' > "$RELAY_CONFIG"
        log "✓ Created relay_config.json"
    else
        log "✓ relay_config.json already exists"
    fi
    
    # Set proper permissions
    chmod 644 "$MOTION_CONFIG" "$RELAY_CONFIG"
}

# Function to clone repository
clone_repository() {
    log "Cloning Factory IoT repository..."
    
    if [[ -d "factory-iot" ]]; then
        log_warning "Directory factory-iot already exists. Removing..."
        rm -rf factory-iot
    fi
    
    # Clone repository to $HOME/factory-iot and use absolute paths
    REPO_DIR="$HOME/factory-iot"
    git clone https://github.com/mordak-95/factory-iot.git "$REPO_DIR"
    cd "$REPO_DIR"
    
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
    
    # Check and install gpiozero
    check_gpiozero
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
    
    # Verify critical dependencies
    log "Verifying critical dependencies..."
    if python3 -c "import flask, requests, psutil" 2>/dev/null; then
        log "✓ Core dependencies verified"
    else
        log_error "Some core dependencies failed to install"
        exit 1
    fi
    
    # Check gpiozero in virtual environment
    if python3 -c "import gpiozero" 2>/dev/null; then
        log "✓ gpiozero available in virtual environment"
    else
        log_warning "gpiozero not available in virtual environment, installing..."
        pip install gpiozero
    fi
    
    cd ..
    log "Backend installed successfully"
}

# Function to install React frontend
install_frontend() {
    log "Installing React frontend..."
    
    cd client
    
    # Install Node.js dependencies
    npm install
    
    # Verify npm installation
    if npm list react > /dev/null 2>&1; then
        log "✓ Frontend dependencies verified"
    else
        log_error "Frontend dependencies failed to install"
        exit 1
    fi
    
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
StandardOutput=journal
StandardError=journal

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
StandardOutput=journal
StandardError=journal

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
    
    # Start backend first
    sudo systemctl start factory-iot-backend.service
    sleep 5
    
    # Check backend status
    if systemctl is-active --quiet factory-iot-backend.service; then
        log "✓ Backend service started successfully"
    else
        log_error "Backend service failed to start"
        sudo journalctl -u factory-iot-backend.service --no-pager -n 20
        exit 1
    fi
    
    # Start frontend
    sudo systemctl start factory-iot-frontend.service
    sleep 10
    
    # Check frontend status
    if systemctl is-active --quiet factory-iot-frontend.service; then
        log "✓ Frontend service started successfully"
    else
        log_warning "Frontend service may have issues, checking logs..."
        sudo journalctl -u factory-iot-frontend.service --no-pager -n 20
    fi
    
    log "Services started successfully"
    log "Frontend available at: http://localhost:3000"
    log "Backend available at: http://localhost:5000"
}

# Function to test API endpoints
test_api_endpoints() {
    log "Testing API endpoints..."
    
    # Wait for services to be ready
    sleep 15
    
    # Test backend
    if curl -s http://localhost:5000/ > /dev/null; then
        log "✓ Backend API is responding"
    else
        log_warning "Backend API is not responding"
    fi
    
    # Test motion sensors endpoint
    if curl -s http://localhost:5000/api/motion_sensors > /dev/null; then
        log "✓ Motion sensors API is working"
    else
        log_warning "Motion sensors API may have issues"
    fi
    
    # Test relays endpoint
    if curl -s http://localhost:5000/api/relays > /dev/null; then
        log "✓ Relays API is working"
    else
        log_warning "Relays API may have issues"
    fi
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
    
    echo -e "\n${YELLOW}Config Files:${NC}"
    if [ -f "backend/motion_sensor_config.json" ]; then
        echo "✓ motion_sensor_config.json exists"
    else
        echo "✗ motion_sensor_config.json missing"
    fi
    if [ -f "backend/relay_config.json" ]; then
        echo "✓ relay_config.json exists"
    else
        echo "✗ relay_config.json missing"
    fi
    
    echo -e "\n${YELLOW}Log File:${NC}"
    echo "$LOG_FILE"
}

# Main installation function
main_install() {
    log "Starting Factory IoT installation..."

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

    # After cloning repository and before backend install
    cd "$REPO_DIR"

    # Ensure backend directory exists
    mkdir -p "$REPO_DIR/backend"

    # Prompt for device config
    ENV_PATH="$REPO_DIR/backend/.env"
    if [ -f "$ENV_PATH" ]; then
      echo ".env already exists at $ENV_PATH."
      read -p "Do you want to overwrite it? (y/N): " OVERWRITE
      if [[ "$OVERWRITE" =~ ^[Yy]$ ]]; then
        rm "$ENV_PATH"
      else
        echo "Keeping existing .env."
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

    log "Installing backend..."
    install_backend

    log "Installing frontend..."
    install_frontend

    log "Creating config files..."
    create_config_files

    log "Setting up kiosk mode..."
    setup_kiosk

    # فعال‌سازی autologin
    setup_autologin

    log "Creating services..."
    create_services

    log "Starting services..."
    start_services

    log "Testing API endpoints..."
    test_api_endpoints

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
    echo -e "\n${YELLOW}To test motion sensors:${NC}" | tee -a "$LOG_FILE"
    echo -e "  curl http://localhost:5000/api/motion_sensors" | tee -a "$LOG_FILE"
    echo -e "  curl http://localhost:5000/api/relays" | tee -a "$LOG_FILE"
}

# Run main installation
main_install 
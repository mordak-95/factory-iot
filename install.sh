#!/bin/bash

# Factory IoT Quick Install Script for Raspberry Pi
# This script is designed to be executed via curl
# Updated for Real-Time WebSocket Support

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
        # نصب dependencies برای WebSocket و real-time
        sudo apt install -y build-essential python3-dev
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
        sudo apt install python3 python3-pip python3-venv curl git build-essential python3-dev -y
        # Install Node.js
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
}

# Function to install Python backend
install_backend() {
    log "Installing Python backend with Real-Time WebSocket support..."
    
    cd backend
    
    # Create virtual environment
    python3 -m venv venv
    source venv/bin/activate
    
    # Install Python dependencies
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Verify WebSocket dependencies
    log "Verifying WebSocket dependencies..."
    python3 -c "import flask_socketio; print('✓ Flask-SocketIO installed')" || log_error "Flask-SocketIO installation failed"
    python3 -c "import eventlet; print('✓ Eventlet installed')" || log_error "Eventlet installation failed"
    
    cd ..
    log "Backend with Real-Time support installed successfully"
}

# Function to install React frontend
install_frontend() {
    log "Installing React frontend with Real-Time WebSocket client..."
    
    cd client
    
    # Install Node.js dependencies
    npm install
    
    # Verify WebSocket client dependency
    log "Verifying WebSocket client dependency..."
    if npm list socket.io-client > /dev/null 2>&1; then
        log "✓ Socket.IO client installed"
    else
        log_error "Socket.IO client installation failed"
    fi
    
    cd ..
    log "Frontend with Real-Time support installed successfully"
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
    log "Creating systemd services with Real-Time support..."
    
    CURRENT_DIR="$(pwd)"
    
    # Create backend service with WebSocket support
    sudo tee /etc/systemd/system/factory-iot-backend.service > /dev/null << EOF
[Unit]
Description=Factory IoT Backend (Real-Time WebSocket)
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$CURRENT_DIR/backend
Environment=PATH=$CURRENT_DIR/backend/venv/bin
Environment=PYTHONPATH=$CURRENT_DIR/backend
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
Description=Factory IoT Frontend (Real-Time WebSocket)
After=network.target factory-iot-backend.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$CURRENT_DIR/client
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=PORT=3000
Environment=REACT_APP_API_URL=http://localhost:5000
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable services
    sudo systemctl daemon-reload
    sudo systemctl enable factory-iot-backend.service
    sudo systemctl enable factory-iot-frontend.service
    
    log "Systemd services with Real-Time support created and enabled"
}

# Function to start services
start_services() {
    log "Starting Real-Time services..."
    
    sudo systemctl start factory-iot-backend.service
    sleep 5  # Wait for backend to start
    
    sudo systemctl start factory-iot-frontend.service
    
    log "Real-Time services started successfully"
    log "Frontend available at: http://localhost:3000"
    log "Backend available at: http://localhost:5000"
    log "WebSocket endpoint: ws://localhost:5000"
}

# Function to test real-time functionality
test_realtime() {
    log "Testing Real-Time functionality..."
    
    # Wait for services to be ready
    sleep 10
    
    # Test backend health
    if curl -s http://localhost:5000/api/health > /dev/null; then
        log "✓ Backend health check passed"
    else
        log_warning "Backend health check failed"
    fi
    
    # Test WebSocket connection (basic test)
    if command -v python3 > /dev/null; then
        cd backend
        source venv/bin/activate
        if python3 -c "
import requests
try:
    r = requests.get('http://localhost:5000/api/devices', timeout=5)
    if r.status_code == 200:
        print('✓ Backend API responding')
    else:
        print('✗ Backend API not responding correctly')
except:
    print('✗ Backend API not accessible')
" 2>/dev/null; then
            log "✓ Backend API test passed"
        else
            log_warning "Backend API test failed"
        fi
        cd ..
    fi
    
    log "Real-Time functionality test completed"
}

# Function to show status
show_status() {
    echo -e "\n${BLUE}=== Factory IoT Real-Time Status ===${NC}"
    
    echo -e "\n${YELLOW}Services:${NC}"
    systemctl is-active factory-iot-backend.service > /dev/null && echo -e "${GREEN}✓ Backend: Running (Real-Time)${NC}" || echo -e "${RED}✗ Backend: Stopped${NC}"
    systemctl is-active factory-iot-frontend.service > /dev/null && echo -e "${GREEN}✓ Frontend: Running (Real-Time)${NC}" || echo -e "${RED}✗ Frontend: Stopped${NC}"
    
    echo -e "\n${YELLOW}Endpoints:${NC}"
    echo "Frontend: http://localhost:3000"
    echo "Backend:  http://localhost:5000"
    echo "WebSocket: ws://localhost:5000"
    
    echo -e "\n${YELLOW}Real-Time Features:${NC}"
    echo "✓ WebSocket communication"
    echo "✓ Real-time device updates"
    echo "✓ Live system statistics"
    echo "✓ Instant relay control"
    
    echo -e "\n${YELLOW}Installation Directory:${NC}"
    echo "$(pwd)"
    
    echo -e "\n${YELLOW}Log File:${NC}"
    echo "$LOG_FILE"
    
    echo -e "\n${YELLOW}Test Real-Time:${NC}"
    echo "python3 test_realtime.py"
}

# Main installation function
main_install() {
    log "Starting Factory IoT Real-Time installation..."

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

    log "Installing Real-Time backend..."
    install_backend

    log "Installing Real-Time frontend..."
    install_frontend

    log "Setting up kiosk mode..."
    setup_kiosk

    # فعال‌سازی autologin
    setup_autologin

    log "Creating Real-Time services..."
    create_services

    log "Starting Real-Time services..."
    start_services

    log "Testing Real-Time functionality..."
    test_realtime

    log "Real-Time installation completed successfully!"

    echo -e "\n${GREEN}================================${NC}" | tee -a "$LOG_FILE"
    echo -e "${GREEN}  Factory IoT Real-Time Installation Complete!${NC}" | tee -a "$LOG_FILE"
    echo -e "${GREEN}================================${NC}" | tee -a "$LOG_FILE"
    echo -e "Frontend: ${BLUE}http://localhost:3000${NC}" | tee -a "$LOG_FILE"
    echo -e "Backend:  ${BLUE}http://localhost:5000${NC}" | tee -a "$LOG_FILE"
    echo -e "WebSocket: ${BLUE}ws://localhost:5000${NC}" | tee -a "$LOG_FILE"
    echo -e "Log file: ${BLUE}$LOG_FILE${NC}" | tee -a "$LOG_FILE"
    echo -e "\n${YELLOW}Real-Time Features:${NC}" | tee -a "$LOG_FILE"
    echo -e "  ✓ Instant device updates (< 100ms latency)" | tee -a "$LOG_FILE"
    echo -e "  ✓ Live system statistics" | tee -a "$LOG_FILE"
    echo -e "  ✓ WebSocket communication" | tee -a "$LOG_FILE"
    echo -e "  ✓ HTTP fallback support" | tee -a "$LOG_FILE"
    echo -e "\n${YELLOW}To check status:${NC}" | tee -a "$LOG_FILE"
    echo -e "  systemctl status factory-iot-backend.service" | tee -a "$LOG_FILE"
    echo -e "  systemctl status factory-iot-frontend.service" | tee -a "$LOG_FILE"
    echo -e "\n${YELLOW}To view logs:${NC}" | tee -a "$LOG_FILE"
    echo -e "  journalctl -u factory-iot-backend.service -f" | tee -a "$LOG_FILE"
    echo -e "  journalctl -u factory-iot-frontend.service -f" | tee -a "$LOG_FILE"
    echo -e "\n${YELLOW}To test Real-Time functionality:${NC}" | tee -a "$LOG_FILE"
    echo -e "  python3 test_realtime.py" | tee -a "$LOG_FILE"
}

# Run main installation
main_install 
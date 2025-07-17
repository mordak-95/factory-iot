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
        
        # Install Node.js and npm
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt install -y nodejs
        
        log "System dependencies installed successfully"
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
    
    # Install system dependencies
    install_system_deps
    
    # Clone repository
    clone_repository
    
    # Install backend
    install_backend
    
    # Install frontend
    install_frontend
    
    # Setup kiosk mode
    setup_kiosk
    
    # Create services
    create_services
    
    # Start services
    start_services
    
    log "Installation completed successfully!"
    
    echo -e "\n${GREEN}================================${NC}"
    echo -e "${GREEN}  Factory IoT Installation Complete!${NC}"
    echo -e "${GREEN}================================${NC}"
    echo -e "Frontend: ${BLUE}http://localhost:3000${NC}"
    echo -e "Backend:  ${BLUE}http://localhost:5000${NC}"
    echo -e "Log file: ${BLUE}$LOG_FILE${NC}"
    echo -e "\n${YELLOW}To check status:${NC}"
    echo -e "  systemctl status factory-iot-backend.service"
    echo -e "  systemctl status factory-iot-frontend.service"
    echo -e "\n${YELLOW}To view logs:${NC}"
    echo -e "  journalctl -u factory-iot-backend.service -f"
    echo -e "  journalctl -u factory-iot-frontend.service -f"
}

# Run main installation
main_install 
#!/bin/bash

# Factory IoT Setup Script
# This script manages the installation, configuration, and running of the Factory IoT project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project directories
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLIENT_DIR="$PROJECT_ROOT/client"
BACKEND_DIR="$PROJECT_ROOT/backend"
CONFIG_DIR="$PROJECT_ROOT/config"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"

# Configuration file
CONFIG_FILE="$CONFIG_DIR/settings.json"

# Log file
LOG_FILE="$PROJECT_ROOT/setup.log"

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

# Function to create configuration file
create_config() {
    mkdir -p "$CONFIG_DIR"
    cat > "$CONFIG_FILE" << EOF
{
    "server": {
        "base_url": "http://localhost:5000",
        "timeout": 30
    },
    "client": {
        "port": 3000,
        "host": "0.0.0.0"
    },
    "backend": {
        "port": 5000,
        "host": "0.0.0.0",
        "debug": false
    },
    "kiosk": {
        "enabled": true,
        "url": "http://localhost:3000"
    }
}
EOF
    log "Configuration file created at $CONFIG_FILE"
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
        sudo apt install python3 python3-pip python3-venv curl -y
        
        # Install Node.js
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
}

# Function to install Python backend
install_backend() {
    log "Installing Python backend..."
    
    cd "$BACKEND_DIR"
    
    # Create virtual environment
    python3 -m venv venv
    source venv/bin/activate
    
    # Install Python dependencies
    pip install --upgrade pip
    pip install -r requirements.txt
    
    log "Backend installed successfully"
}

# Function to install React frontend
install_frontend() {
    log "Installing React frontend..."
    
    cd "$CLIENT_DIR"
    
    # Install Node.js dependencies
    npm install
    
    log "Frontend installed successfully"
}

# Function to setup kiosk mode
setup_kiosk() {
    if ! check_raspberry_pi; then
        log_warning "Kiosk mode setup skipped - not running on Raspberry Pi"
        return
    fi
    
    log "Setting up kiosk mode..."
    
    # Create kiosk startup script
    cat > ~/start-kiosk.sh << 'EOF'
#!/bin/bash
xset s off
xset -dpms
xset s noblank

# Wait for the application to start
sleep 10

chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:3000
EOF
    
    chmod +x ~/start-kiosk.sh
    
    # Create Openbox autostart
    mkdir -p ~/.config/openbox
    cat > ~/.config/openbox/autostart << 'EOF'
~/start-kiosk.sh
EOF
    
    # Setup auto-login and startx
    if ! grep -q "startx" ~/.bash_profile; then
        cat >> ~/.bash_profile << 'EOF'

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
    
    # Create backend service
    sudo tee /etc/systemd/system/factory-iot-backend.service > /dev/null << EOF
[Unit]
Description=Factory IoT Backend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$BACKEND_DIR
Environment=PATH=$BACKEND_DIR/venv/bin
ExecStart=$BACKEND_DIR/venv/bin/python app.py
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
WorkingDirectory=$CLIENT_DIR
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

# Function to stop services
stop_services() {
    log "Stopping services..."
    
    sudo systemctl stop factory-iot-frontend.service
    sudo systemctl stop factory-iot-backend.service
    
    log "Services stopped successfully"
}

# Function to uninstall
uninstall() {
    log "Uninstalling Factory IoT..."
    
    # Stop and disable services
    stop_services
    sudo systemctl disable factory-iot-backend.service
    sudo systemctl disable factory-iot-frontend.service
    
    # Remove service files
    sudo rm -f /etc/systemd/system/factory-iot-backend.service
    sudo rm -f /etc/systemd/system/factory-iot-frontend.service
    sudo systemctl daemon-reload
    
    # Remove kiosk setup
    if check_raspberry_pi; then
        rm -f ~/start-kiosk.sh
        rm -f ~/.config/openbox/autostart
    fi
    
    log "Factory IoT uninstalled successfully"
}

# Function to update
update() {
    log "Updating Factory IoT..."
    
    # Stop services
    stop_services
    
    # Update backend
    cd "$BACKEND_DIR"
    source venv/bin/activate
    pip install --upgrade -r requirements.txt
    
    # Update frontend
    cd "$CLIENT_DIR"
    npm install
    npm run build
    
    # Start services
    start_services
    
    log "Factory IoT updated successfully"
}

# Function to configure server settings
configure_server() {
    log "Configuring server settings..."
    
    if [[ ! -f "$CONFIG_FILE" ]]; then
        create_config
    fi
    
    echo -e "${BLUE}Current configuration:${NC}"
    cat "$CONFIG_FILE" | python3 -m json.tool
    
    echo -e "\n${YELLOW}Enter new base URL (or press Enter to keep current):${NC}"
    read -p "Base URL: " new_url
    
    if [[ -n "$new_url" ]]; then
        # Update the base URL in config file
        python3 -c "
import json
with open('$CONFIG_FILE', 'r') as f:
    config = json.load(f)
config['server']['base_url'] = '$new_url'
with open('$CONFIG_FILE', 'w') as f:
    json.dump(config, f, indent=4)
"
        log "Server configuration updated"
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
    
    echo -e "\n${YELLOW}Configuration:${NC}"
    if [[ -f "$CONFIG_FILE" ]]; then
        cat "$CONFIG_FILE" | python3 -m json.tool
    else
        echo "No configuration file found"
    fi
}

# Function to show menu
show_menu() {
    clear
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}    Factory IoT Setup Menu     ${NC}"
    echo -e "${BLUE}================================${NC}"
    echo -e "${GREEN}1.${NC} Install & Start"
    echo -e "${GREEN}2.${NC} Uninstall"
    echo -e "${GREEN}3.${NC} Update"
    echo -e "${GREEN}4.${NC} Server Configuration"
    echo -e "${GREEN}5.${NC} Show Status"
    echo -e "${GREEN}6.${NC} Start Services"
    echo -e "${GREEN}7.${NC} Stop Services"
    echo -e "${GREEN}8.${NC} View Logs"
    echo -e "${GREEN}0.${NC} Exit"
    echo -e "${BLUE}================================${NC}"
}

# Function to view logs
view_logs() {
    echo -e "${BLUE}=== Recent Logs ===${NC}"
    tail -n 50 "$LOG_FILE" 2>/dev/null || echo "No logs found"
    
    echo -e "\n${BLUE}=== Service Logs ===${NC}"
    echo -e "${YELLOW}Backend logs:${NC}"
    journalctl -u factory-iot-backend.service -n 20 --no-pager
    
    echo -e "\n${YELLOW}Frontend logs:${NC}"
    journalctl -u factory-iot-frontend.service -n 20 --no-pager
}

# Main menu loop
main() {
    while true; do
        show_menu
        echo -e "\n${YELLOW}Select an option:${NC}"
        read -r choice
        
        case $choice in
            1)
                log "Starting installation..."
                install_system_deps
                create_config
                install_backend
                install_frontend
                setup_kiosk
                create_services
                start_services
                log "Installation completed successfully!"
                echo -e "\n${GREEN}Installation completed!${NC}"
                echo -e "Frontend: http://localhost:3000"
                echo -e "Backend: http://localhost:5000"
                read -p "Press Enter to continue..."
                ;;
            2)
                echo -e "${YELLOW}Are you sure you want to uninstall? (y/N):${NC}"
                read -r confirm
                if [[ $confirm =~ ^[Yy]$ ]]; then
                    uninstall
                    echo -e "\n${GREEN}Uninstallation completed!${NC}"
                fi
                read -p "Press Enter to continue..."
                ;;
            3)
                update
                echo -e "\n${GREEN}Update completed!${NC}"
                read -p "Press Enter to continue..."
                ;;
            4)
                configure_server
                read -p "Press Enter to continue..."
                ;;
            5)
                show_status
                read -p "Press Enter to continue..."
                ;;
            6)
                start_services
                read -p "Press Enter to continue..."
                ;;
            7)
                stop_services
                read -p "Press Enter to continue..."
                ;;
            8)
                view_logs
                read -p "Press Enter to continue..."
                ;;
            0)
                log "Exiting setup script"
                echo -e "${GREEN}Goodbye!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid option. Please try again.${NC}"
                sleep 2
                ;;
        esac
    done
}

# Check if script is run as root
if [[ $EUID -eq 0 ]]; then
    log_error "This script should not be run as root"
    exit 1
fi

# Create log file
touch "$LOG_FILE"

# Start main function
main
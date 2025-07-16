# Factory IoT Project

A complete IoT factory management system with React frontend and Python backend, designed to run on Raspberry Pi OS Lite with touch screen support.

## Project Structure

```
factory-iot/
├── client/                 # React frontend
├── backend/                # Python backend
├── scripts/                # Setup and management scripts
├── config/                 # Configuration files
└── docs/                   # Documentation
```

## Features

- **React Frontend**: Modern UI for factory monitoring and control
- **Python Backend**: RESTful API for data processing and device communication
- **Touch Screen Support**: Optimized for Raspberry Pi touch displays
- **Auto-start**: Automatic startup on boot
- **Kiosk Mode**: Full-screen browser experience
- **Easy Management**: Simple setup script with menu interface

## Quick Start

1. Clone the repository
2. Run the setup script: `./scripts/setup.sh`
3. Choose option 1 to install and start the application

## Requirements

- Raspberry Pi OS Lite
- Touch screen display (optional but recommended)
- Internet connection for initial setup

## Ports

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Configuration

Edit `config/settings.json` to modify server connection settings and other configurations. 
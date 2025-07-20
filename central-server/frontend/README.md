# Central Server Frontend

A modern React-based UI for managing IoT devices and their relays in a centralized system.

## Features

- **Device Management**: Add, edit, delete, and monitor IoT devices
- **Relay Control**: Manage relays for each device with real-time status updates
- **Health Monitoring**: System health check with backend and database status
- **Modern UI**: Dark theme with responsive design matching the device UI
- **Real-time Updates**: Automatic refresh of device and relay status
- **Connection Status**: Visual indicator of backend connectivity
- **Navigation**: Easy switching between dashboard and health check

## Layout

The UI follows the same layout pattern as the device UI with additional routing:

### Main Dashboard (`/`)
- **Left Panel**: Device list with status indicators
- **Center Panel**: Selected device details and quick actions
- **Right Panel**: System overview and statistics
- **Bottom Panel**: Relay management for the selected device

### Health Check (`/health`)
- **System Health Monitoring**: Backend service and database status
- **Database Models**: Table creation status and missing tables
- **System Information**: Detailed health metrics and timestamps

## Components

- `Header`: Application header with title and last update time
- `Sidebar`: Navigation sidebar with dark mode toggle
- `DeviceCard`: Individual device display with status
- `RelayManager`: Relay management interface
- `ConnectionStatus`: Connection status indicator
- `LoadingSpinner`: Loading states

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. The application will be available at `http://localhost:3000`

## API Integration

The frontend communicates with the central server backend API:

### Device Management
- `GET /api/devices` - Fetch all devices
- `POST /api/devices` - Add new device
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device

### Relay Management
- `GET /api/devices/:id/relays` - Fetch relays for device
- `POST /api/devices/:id/relays` - Add relay to device
- `PUT /api/relays/:id` - Update relay status
- `DELETE /api/relays/:id` - Delete relay

### System Health
- `GET /health` - Backend health status
- `GET /api/model_status` - Database model status
- `GET /api/server_info` - Server information

## Styling

Uses Tailwind CSS for styling with a dark theme that matches the device UI. 
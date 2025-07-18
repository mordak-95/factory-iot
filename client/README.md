# Factory IoT Client

A modern React application for monitoring and managing IoT devices in industrial environments. Built with React 19 and Tailwind CSS for a responsive and beautiful user interface with real-time data from backend services.

## Features

- **Real-time Device Monitoring**: Track the status of IoT devices in real-time via WebSocket connections
- **System Statistics Dashboard**: View comprehensive system health metrics with live updates
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI/UX**: Built with Tailwind CSS for a clean and professional look
- **Device Management**: Monitor temperature, humidity, pressure, and other sensor data
- **Live Alerts**: Real-time notification system for device issues and system alerts
- **Connection Status**: Visual indicator for WebSocket connection status
- **Automatic Reconnection**: Handles connection drops and automatically reconnects

## Tech Stack

- **React 19**: Latest version of React for optimal performance
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **WebSocket**: Real-time bidirectional communication with backend
- **REST API**: HTTP API for device management and data retrieval
- **PostCSS**: CSS processing tool for Tailwind CSS
- **Autoprefixer**: Automatically adds vendor prefixes to CSS

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- Backend server running on `http://localhost:5000` (or configure via environment variables)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd factory-iot/client
```

2. Install dependencies:
```bash
npm install
```

3. Configure backend URL (optional):
Create a `.env` file in the client directory:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5000
```

4. Start the development server:
```bash
npm start
```

The application will open in your browser at `http://localhost:3000`.

### Available Scripts

- `npm start`: Runs the app in development mode
- `npm build`: Builds the app for production
- `npm test`: Launches the test runner
- `npm eject`: Ejects from Create React App (one-way operation)

## Project Structure

```
client/
├── public/                 # Static files
├── src/
│   ├── components/         # React components
│   │   ├── Header.js      # Navigation header
│   │   ├── DeviceCard.js  # Individual device display
│   │   ├── SystemStats.js # System statistics cards
│   │   ├── LoadingSpinner.js # Loading indicator
│   │   └── ConnectionStatus.js # WebSocket connection status
│   ├── services/          # API services
│   │   └── api.js         # REST API and WebSocket service
│   ├── hooks/             # Custom React hooks
│   │   └── useApiData.js  # Data fetching and WebSocket hooks
│   ├── config.js          # Configuration settings
│   ├── App.js             # Main application component
│   ├── index.js           # Application entry point
│   └── index.css          # Global styles with Tailwind CSS
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
└── package.json           # Project dependencies and scripts
```

## Components

### Header
Navigation component with logo, menu items, and login button.

### SystemStats
Displays key system metrics including:
- Total devices
- Online devices
- Active alerts
- System health percentage

### DeviceCard
Individual device information card showing:
- Device name and type
- Connection status (online/offline/warning)
- Location
- Sensor data (temperature, humidity, pressure, etc.)
- Last seen timestamp
- Action buttons for device control

### LoadingSpinner
Loading indicator with customizable size and text.

### ConnectionStatus
Real-time WebSocket connection status indicator.

## API Integration

### REST Endpoints

The application expects the following backend API endpoints:

- `GET /api/stats` - System statistics
- `GET /api/devices` - List all devices
- `GET /api/devices/:id` - Get specific device
- `PUT /api/devices/:id/status` - Update device status
- `GET /api/devices/:id/data` - Get device sensor data
- `GET /api/alerts` - Get system alerts
- `GET /api/health` - System health check

### WebSocket Events

Real-time updates via WebSocket connection:

- `device_update` - Device status or data changes
- `stats_update` - System statistics updates
- `alert_update` - New alerts or alert status changes

### Data Flow

1. **Initial Load**: REST API calls fetch initial data
2. **Real-time Updates**: WebSocket connection provides live updates
3. **Fallback Polling**: If WebSocket fails, polling ensures data freshness
4. **Optimistic Updates**: UI updates immediately, reverts on API errors

## Configuration

### Environment Variables

- `REACT_APP_API_URL`: Backend API URL (default: http://localhost:5000)
- `REACT_APP_WS_URL`: WebSocket URL (default: ws://localhost:5000)

### Polling Settings

- Default polling interval: 30 seconds
- Reconnection delay: 5 seconds
- Configurable via `src/config.js`

## Styling

This project uses Tailwind CSS for styling. All components are styled using Tailwind utility classes, providing:

- Consistent design system
- Responsive layouts
- Dark/light mode support (ready for implementation)
- Customizable theme

## Error Handling

- Network errors are gracefully handled with user-friendly messages
- Automatic retry mechanisms for failed API calls
- WebSocket reconnection on connection loss
- Loading states for better user experience

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

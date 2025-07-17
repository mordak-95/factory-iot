import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './App.css';
import DeviceCard from './components/DeviceCard';
import SystemStats from './components/SystemStats';
import Header from './components/Header';

function App() {
  const [devices, setDevices] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [relays, setRelays] = useState({});
  const [relayError, setRelayError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  
  const socketRef = useRef(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Initialize WebSocket connection
  useEffect(() => {
    // Create socket connection
    socketRef.current = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Socket event handlers
    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket server');
      setSocketConnected(true);
      setError(null);
      
      // Request initial data
      socketRef.current.emit('request_devices');
      socketRef.current.emit('request_system_stats');
      socketRef.current.emit('request_relays');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setSocketConnected(false);
      setError('Connection lost. Trying to reconnect...');
    });

    socketRef.current.on('connected', (data) => {
      console.log('WebSocket connection established:', data);
    });

    // Handle real-time updates
    socketRef.current.on('devices_update', (data) => {
      console.log('Received devices update:', data);
      setDevices(data.devices);
      setLastUpdate(new Date());
      setLoading(false);
    });

    socketRef.current.on('system_stats_update', (data) => {
      console.log('Received system stats update:', data);
      setSystemStats(data);
      setLastUpdate(new Date());
    });

    socketRef.current.on('relays_update', (data) => {
      console.log('Received relays update:', data);
      if (data.error) {
        setRelayError(data.error);
      } else {
        setRelays(data.relays);
        setRelayError(null);
      }
    });

    // Fallback: Initial data fetch via HTTP if WebSocket fails
    const fetchInitialData = async () => {
      try {
        const [devicesRes, statsRes, relaysRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/devices`),
          axios.get(`${API_BASE_URL}/api/system/stats`),
          axios.get(`${API_BASE_URL}/api/relays`).catch(() => ({ data: { relays: {} } }))
        ]);

        setDevices(devicesRes.data.devices);
        setSystemStats(statsRes.data);
        setRelays(relaysRes.data.relays || {});
        setLastUpdate(new Date());
        setLoading(false);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to connect to backend server');
        setLoading(false);
      }
    };

    // If WebSocket doesn't connect within 5 seconds, fall back to HTTP
    const timeoutId = setTimeout(() => {
      if (!socketConnected) {
        console.log('WebSocket connection timeout, falling back to HTTP');
        fetchInitialData();
      }
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [API_BASE_URL]);

  const updateDeviceValue = async (deviceId, value) => {
    try {
      await axios.post(`${API_BASE_URL}/api/devices/${deviceId}/value`, { value });
      // WebSocket will automatically receive the update
    } catch (err) {
      console.error('Error updating device value:', err);
      setError('Failed to update device value');
    }
  };

  const updateDeviceStatus = async (deviceId, status) => {
    try {
      await axios.post(`${API_BASE_URL}/api/devices/${deviceId}/status`, { status });
      // WebSocket will automatically receive the update
    } catch (err) {
      console.error('Error updating device status:', err);
      setError('Failed to update device status');
    }
  };

  const controlRelay = async (relayId, action) => {
    try {
      await axios.post(`${API_BASE_URL}/api/relays/${relayId}`, { action });
      // WebSocket will automatically receive the update
    } catch (err) {
      console.error(`Error controlling relay ${relayId}:`, err);
      setRelayError(`Failed to ${action} ${relayId}`);
    }
  };

  const retryConnection = () => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  };

  if (loading && devices.length === 0) {
    return (
      <div className="app">
        <Header />
        <div className="loading">
          <div className="spinner"></div>
          <p>Connecting to Factory IoT System...</p>
          {!socketConnected && (
            <p className="connection-status">Using WebSocket for real-time updates</p>
          )}
        </div>
      </div>
    );
  }

  // Helper: Relay DeviceCard props
  const relayCards = Object.keys(relays).map(relayId => ({
    id: relayId,
    name: relayId.toUpperCase(),
    type: 'relay',
    value: relays[relayId] ? 'ON' : 'OFF',
    unit: '',
    status: relays[relayId] ? 'active' : 'inactive',
    last_update: '',
    isRelay: true
  }));

  return (
    <div className="app">
      <Header lastUpdate={lastUpdate} socketConnected={socketConnected} />
      
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={retryConnection}>Retry Connection</button>
        </div>
      )}
      
      <div className="main-content">
        <div className="dashboard">
          <div className="devices-section">
            <h2>IoT Devices</h2>
            <div className="connection-indicator">
              {socketConnected ? (
                <span className="connected">🟢 Real-time Connected</span>
              ) : (
                <span className="disconnected">🔴 HTTP Fallback</span>
              )}
            </div>
            <div className="devices-grid">
              {/* نمایش دستگاه‌ها */}
              {devices.map(device => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onUpdateValue={updateDeviceValue}
                  onUpdateStatus={updateDeviceStatus}
                />
              ))}
              {/* نمایش رله‌ها به صورت DeviceCard */}
              {relayCards.map(relay => (
                <DeviceCard
                  key={relay.id}
                  device={relay}
                  onRelayControl={(action) => controlRelay(relay.id, action)}
                  isRelay
                />
              ))}
            </div>
          </div>
          <div className="stats-section">
            <h2>System Statistics</h2>
            {systemStats && <SystemStats stats={systemStats} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 
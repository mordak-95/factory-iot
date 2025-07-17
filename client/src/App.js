import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch devices
      const devicesResponse = await axios.get(`${API_BASE_URL}/api/devices`);
      setDevices(devicesResponse.data.devices);
      
      // Fetch system stats
      const statsResponse = await axios.get(`${API_BASE_URL}/api/system/stats`);
      setSystemStats(statsResponse.data);
      
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  const updateDeviceValue = async (deviceId, value) => {
    try {
      await axios.post(`${API_BASE_URL}/api/devices/${deviceId}/value`, { value });
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Error updating device value:', err);
      setError('Failed to update device value');
    }
  };

  const updateDeviceStatus = async (deviceId, status) => {
    try {
      await axios.post(`${API_BASE_URL}/api/devices/${deviceId}/status`, { status });
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Error updating device status:', err);
      setError('Failed to update device status');
    }
  };

  const fetchRelays = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/relays`);
      setRelays(res.data.relays);
      setRelayError(null);
    } catch (err) {
      setRelayError('Failed to fetch relays');
    }
  };

  const controlRelay = async (relayId, action) => {
    try {
      await axios.post(`${API_BASE_URL}/api/relays/${relayId}`, { action });
      fetchRelays();
    } catch (err) {
      setRelayError(`Failed to ${action} ${relayId}`);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRelays();
    const interval = setInterval(() => {
      fetchData();
      fetchRelays();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && devices.length === 0) {
    return (
      <div className="app">
        <Header />
        <div className="loading">
          <div className="spinner"></div>
          <p>Connecting to Factory IoT System...</p>
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
      <Header lastUpdate={lastUpdate} />
      
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={fetchData}>Retry</button>
        </div>
      )}
      
      <div className="main-content">
        <div className="dashboard">
          <div className="devices-section">
            <h2>IoT Devices</h2>
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
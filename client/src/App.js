import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import DeviceCard from './components/DeviceCard';
import SystemStats from './components/SystemStats';
import LoadingSpinner from './components/LoadingSpinner';
import ConnectionStatus from './components/ConnectionStatus';

function App() {
  const [devices, setDevices] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [relays, setRelays] = useState({});
  const [relayError, setRelayError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

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
      setIsConnected(true);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to connect to backend server');
      setIsConnected(false);
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
      <div className="min-h-screen bg-gray-50">
        <Header lastUpdate={lastUpdate} />
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="xl" text="Connecting to Factory IoT System..." />
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
    <div className="min-h-screen bg-gray-50">
      <ConnectionStatus isConnected={isConnected} lastUpdate={lastUpdate} />
      <Header lastUpdate={lastUpdate} />
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 mt-4 flex items-center justify-between">
          <span>{error}</span>
          <button 
            onClick={fetchData}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
          >
            Retry
          </button>
        </div>
      )}
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Devices Section */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">IoT Devices</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Total: {devices.length + relayCards.length}</span>
                <span className="text-green-600">
                  Active: {devices.filter(d => d.status === 'active').length + relayCards.filter(r => r.status === 'active').length}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* Stats Section */}
          <div className="lg:col-span-1">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">System Statistics</h2>
            </div>
            {systemStats && <SystemStats stats={systemStats} />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

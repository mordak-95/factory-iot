import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import DeviceCard from './components/DeviceCard';
import SystemStats from './components/SystemStats';
import LoadingSpinner from './components/LoadingSpinner';
import ConnectionStatus from './components/ConnectionStatus';

function App() {
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
      
      // Fetch system stats only
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

  if (loading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Connecting to Factory IoT System..." />
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
    <div className="h-screen bg-gray-900 overflow-hidden">
      <ConnectionStatus isConnected={isConnected} lastUpdate={lastUpdate} />
      <Header lastUpdate={lastUpdate} />
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 mx-4 mt-4 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button 
            onClick={fetchData}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      )}
      
      <main className="h-full p-6">
        <div className="h-full grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* System Stats Section */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">System</h2>
            </div>
            {systemStats && <SystemStats stats={systemStats} />}
          </div>

          {/* Relays Section */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Relay Control</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>Total: {relayCards.length}</span>
                <span className="text-green-400">
                  Active: {relayCards.filter(r => r.status === 'active').length}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
        </div>
      </main>
    </div>
  );
}

export default App;

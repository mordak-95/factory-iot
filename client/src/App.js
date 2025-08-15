import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DeviceCard from './components/DeviceCard';
import SystemStats from './components/SystemStats';
import LoadingSpinner from './components/LoadingSpinner';
import ConnectionStatus from './components/ConnectionStatus';
import MotionSensorStatus from './components/MotionSensorStatus';
import { 
  Search, 
  Plus, 
  List, 
  Zap, 
  Settings, 
  User, 
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Laptop,
  Headphones
} from 'lucide-react';

function App() {
  const [systemStats, setSystemStats] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [relays, setRelays] = useState({});
  const [relayError, setRelayError] = useState(null);
  const [motionSensors, setMotionSensors] = useState([]);
  const [motionSensorError, setMotionSensorError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedRelay, setSelectedRelay] = useState(null);
  const [selectedMotionSensor, setSelectedMotionSensor] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchData = async (isInitial = false) => {
    try {
      if (isInitial) {
        setInitialLoading(true);
      }
      
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
      if (isInitial) {
        setInitialLoading(false);
      }
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

  const fetchMotionSensors = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/motion_sensors`);
      setMotionSensors(res.data.motion_sensors || []);
      setMotionSensorError(null);
    } catch (err) {
      setMotionSensorError('Failed to fetch motion sensors');
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
    // Initial load with loading
    fetchData(true);
    fetchRelays();
    fetchMotionSensors();
    
    // Set up interval for updates without loading
    const interval = setInterval(() => {
      fetchData(false);
      fetchRelays();
      fetchMotionSensors();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  if (initialLoading) {
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

  // Helper: Motion Sensor DeviceCard props
  const motionSensorCards = motionSensors.map(sensor => ({
    id: `motion_${sensor.id}`,
    name: sensor.name,
    type: 'motion_sensor',
    value: sensor.is_active ? 'ACTIVE' : 'INACTIVE',
    unit: '',
    status: sensor.is_active ? 'active' : 'inactive',
    last_update: sensor.last_update || '',
    isMotionSensor: true,
    sensor: sensor
  }));

  const totalRelays = relayCards.length;
  const activeRelays = relayCards.filter(r => r.status === 'active').length;
  const totalMotionSensors = motionSensorCards.length;
  const activeMotionSensors = motionSensorCards.filter(s => s.status === 'active').length;
  const totalDevices = totalRelays + totalMotionSensors;
  const activeDevices = activeRelays + activeMotionSensors;
  const systemHealth = systemStats ? Math.round((activeDevices / totalDevices) * 100) : 0;

  return (
    <div className="h-screen bg-gray-900 overflow-hidden">
      <ConnectionStatus isConnected={isConnected} lastUpdate={lastUpdate} />
      
      <div className="flex h-full">
        {/* Sidebar */}
        <Sidebar 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode}
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Header lastUpdate={lastUpdate} />
          
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 mx-4 mt-4 rounded-lg flex items-center justify-between">
              <span>{error}</span>
              <button 
                onClick={() => fetchData(false)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Retry
              </button>
            </div>
          )}
          
          <main className="flex-1 p-6 overflow-hidden">
            <div className="h-full grid grid-cols-12 gap-6">
              
              {/* Asset List - Left Top */}
              <div className="col-span-4">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">DASHBOARD</h2>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">Total: {totalDevices}</span>
                      <span className="text-sm text-green-400">Active: {activeDevices}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 overflow-y-auto h-[calc(100%-60px)]">
                    {/* Relays Section */}
                    {relayCards.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-400 mb-2">RELAYS</h3>
                        {relayCards.map(relay => (
                          <div
                            key={relay.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all mb-2 ${
                              selectedRelay?.id === relay.id
                                ? 'bg-blue-600/20 border-blue-500'
                                : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                            }`}
                            onClick={() => {
                              setSelectedRelay(relay);
                              setSelectedMotionSensor(null);
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                                <Monitor className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-sm font-medium text-white">{relay.name}</h3>
                                <p className="text-xs text-gray-400">ID: {relay.id}</p>
                              </div>
                              <div className={`w-2 h-2 rounded-full ${
                                relay.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                              }`}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Motion Sensors Section */}
                    {motionSensorCards.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-2">MOTION SENSORS</h3>
                        {motionSensorCards.map(sensor => (
                          <div
                            key={sensor.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all mb-2 ${
                              selectedMotionSensor?.id === sensor.id
                                ? 'bg-blue-600/20 border-blue-500'
                                : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                            }`}
                            onClick={() => {
                              setSelectedMotionSensor(sensor);
                              setSelectedRelay(null);
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Activity className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-sm font-medium text-white">{sensor.name}</h3>
                                <p className="text-xs text-gray-400">GPIO: {sensor.sensor.gpio_pin}</p>
                              </div>
                              <div className={`w-2 h-2 rounded-full ${
                                sensor.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                              }`}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Selected Asset Details - Center Top */}
              <div className="col-span-5">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-full">
                  {selectedRelay ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white">Relay Details</h2>
                        <div className="flex space-x-2">
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors">
                            Reboot
                          </button>
                          <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors">
                            Less
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-400">Status</p>
                            <p className={`text-sm font-medium ${
                              selectedRelay.status === 'active' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {selectedRelay.status.toUpperCase()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Up Time</p>
                            <p className="text-sm font-medium text-white">8h 35m 45s</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-400">Asset Name</p>
                            <p className="text-sm font-medium text-white">{selectedRelay.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Category</p>
                            <p className="text-sm font-medium text-white">RELAY</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-400">Department</p>
                            <p className="text-sm font-medium text-white">IT</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">OS</p>
                            <p className="text-sm font-medium text-white">16.32</p>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-700">
                          <h3 className="text-sm font-medium text-white mb-3">Control</h3>
                          <div className="flex space-x-3">
                            <button
                              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                                selectedRelay.value === 'ON' 
                                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/25' 
                                  : 'bg-gray-700 text-gray-300 hover:bg-green-600 hover:text-white hover:shadow-lg hover:shadow-green-600/25'
                              }`}
                              onClick={() => controlRelay(selectedRelay.id, 'on')}
                              disabled={selectedRelay.value === 'ON'}
                            >
                              Turn ON
                            </button>
                            <button
                              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                                selectedRelay.value === 'OFF' 
                                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/25' 
                                  : 'bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white hover:shadow-lg hover:shadow-red-600/25'
                              }`}
                              onClick={() => controlRelay(selectedRelay.id, 'off')}
                              disabled={selectedRelay.value === 'OFF'}
                            >
                              Turn OFF
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : selectedMotionSensor ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white">Motion Sensor Details</h2>
                        <div className="flex space-x-2">
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors">
                            Test
                          </button>
                          <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors">
                            Settings
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-400">Status</p>
                            <p className={`text-sm font-medium ${
                              selectedMotionSensor.status === 'active' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {selectedMotionSensor.status.toUpperCase()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">GPIO Pin</p>
                            <p className="text-sm font-medium text-white">{selectedMotionSensor.sensor.gpio_pin}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-400">Sensor Name</p>
                            <p className="text-sm font-medium text-white">{selectedMotionSensor.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Category</p>
                            <p className="text-sm font-medium text-white">MOTION SENSOR</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-400">Sensitivity</p>
                            <p className="text-sm font-medium text-white">{selectedMotionSensor.sensor.sensitivity || 'Medium'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Delay Time</p>
                            <p className="text-sm font-medium text-white">{selectedMotionSensor.sensor.delay_time || 3}s</p>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-700">
                          <h3 className="text-sm font-medium text-white mb-3">Scheduling</h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-400">Time Schedule:</span>
                              <span className="text-sm text-white">
                                {selectedMotionSensor.sensor.enable_scheduling ? 
                                  `${selectedMotionSensor.sensor.start_time || '00:00'} - ${selectedMotionSensor.sensor.end_time || '23:59'}` : 
                                  'Always Active'
                                }
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-400">Weekdays:</span>
                              <span className={`text-sm ${selectedMotionSensor.sensor.weekday_monitoring ? 'text-green-400' : 'text-red-400'}`}>
                                {selectedMotionSensor.sensor.weekday_monitoring ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-400">Weekends:</span>
                              <span className={`text-sm ${selectedMotionSensor.sensor.weekend_monitoring ? 'text-green-400' : 'text-red-400'}`}>
                                {selectedMotionSensor.sensor.weekend_monitoring ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">Select a relay or motion sensor to view details</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Overview/Map - Right Top */}
              <div className="col-span-3">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-full">
                  <h2 className="text-lg font-bold text-white mb-4">Overview</h2>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{totalRelays}</div>
                        <div className="text-xs text-gray-400">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{activeRelays}</div>
                        <div className="text-xs text-gray-400">Online</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{systemHealth}%</div>
                        <div className="text-xs text-gray-400">Health</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 rounded-lg p-3 h-32 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-gray-400 text-sm mb-2">Network Map</div>
                        <div className="flex space-x-2">
                          <Monitor className="w-4 h-4 text-blue-400" />
                          <Laptop className="w-4 h-4 text-green-400" />
                          <Smartphone className="w-4 h-4 text-yellow-400" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Motion Sensor Status */}
                    <div className="bg-gray-700/50 rounded-lg p-3">
                      <MotionSensorStatus isDarkMode={isDarkMode} />
                    </div>
                  </div>
                </div>
              </div>

              {/* System Stats - Bottom */}
              <div className="col-span-12">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <h2 className="text-lg font-bold text-white mb-4">System Statistics</h2>
                  {systemStats && <SystemStats stats={systemStats} />}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DeviceCard from './components/DeviceCard';
import RelayManager from './components/RelayManager';
import LoadingSpinner from './components/LoadingSpinner';
import ConnectionStatus from './components/ConnectionStatus';
import HealthCheck from './HealthCheck';
import { 
  Server, 
  Plus, 
  Edit, 
  Trash2, 
  Wifi, 
  WifiOff,
  Monitor,
  Smartphone,
  Laptop,
  Activity,
  Heart
} from 'lucide-react';

// Main Dashboard Component
function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showEditDevice, setShowEditDevice] = useState(false);
  const [showDeleteDevice, setShowDeleteDevice] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [form, setForm] = useState({ name: '', ip_address: '', description: '', is_active: true });
  const [editForm, setEditForm] = useState({ id: null, name: '', ip_address: '', description: '', is_active: true });
  const [formError, setFormError] = useState(null);

  const backendUrl = window.location.origin.replace(/:\d+$/, ':5000');

  const fetchDevices = async (isInitial = false) => {
    try {
      if (isInitial) {
        setInitialLoading(true);
      }
      
      const response = await fetch(`${backendUrl}/api/devices`);
      if (response.ok) {
        const data = await response.json();
        setDevices(data);
        setLastUpdate(new Date());
        setError(null);
        setIsConnected(true);
      } else {
        throw new Error('Failed to fetch devices');
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError('Failed to connect to backend server');
      setIsConnected(false);
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      }
    }
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    setFormError(null);
    
    if (!form.name.trim()) {
      setFormError('Device name is required');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        setShowAddDevice(false);
        setForm({ name: '', ip_address: '', description: '', is_active: true });
        await fetchDevices();
      } else {
        const errorData = await response.json();
        setFormError(errorData.error || 'Failed to add device');
      }
    } catch (err) {
      setFormError('Failed to add device');
    }
  };

  const handleEditDevice = async (e) => {
    e.preventDefault();
    setFormError(null);
    
    if (!editForm.name.trim()) {
      setFormError('Device name is required');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/devices/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        setShowEditDevice(false);
        await fetchDevices();
        // Update selected device if it was the one being edited
        if (selectedDevice && selectedDevice.id === editForm.id) {
          setSelectedDevice(editForm);
        }
      } else {
        const errorData = await response.json();
        setFormError(errorData.error || 'Failed to update device');
      }
    } catch (err) {
      setFormError('Failed to update device');
    }
  };

  const handleDeleteDevice = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/devices/${deviceToDelete}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setShowDeleteDevice(false);
        setDeviceToDelete(null);
        // Clear selected device if it was deleted
        if (selectedDevice && selectedDevice.id === deviceToDelete) {
          setSelectedDevice(null);
        }
        await fetchDevices();
      } else {
        const errorData = await response.json();
        setFormError(errorData.error || 'Failed to delete device');
      }
    } catch (err) {
      setFormError('Failed to delete device');
    }
  };

  const openEditDevice = (device) => {
    setEditForm({ ...device });
    setFormError(null);
    setShowEditDevice(true);
  };

  const openDeleteDevice = (deviceId) => {
    setDeviceToDelete(deviceId);
    setFormError(null);
    setShowDeleteDevice(true);
  };

  useEffect(() => {
    // Initial load with loading
    fetchDevices(true);
    
    // Set up interval for updates without loading
    const interval = setInterval(() => {
      fetchDevices(false);
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (initialLoading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Connecting to Central IoT Server..." />
      </div>
    );
  }

  const totalDevices = devices.length;
  const activeDevices = devices.filter(d => d.is_active).length;
  const systemHealth = totalDevices > 0 ? Math.round((activeDevices / totalDevices) * 100) : 0;

  return (
    <div className="h-full flex flex-col">
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 mx-4 mt-4 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button 
            onClick={() => fetchDevices(false)}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      )}
      
      <main className="flex-1 p-6 overflow-hidden">
        <div className="h-full grid grid-cols-12 gap-6">
          
          {/* Device List - Left Top */}
          <div className="col-span-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">DEVICES</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Total: {totalDevices}</span>
                  <span className="text-sm text-green-400">Active: {activeDevices}</span>
                </div>
              </div>
              
              <div className="space-y-3 overflow-y-auto h-[calc(100%-60px)]">
                {devices.map(device => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    isSelected={selectedDevice?.id === device.id}
                    onClick={setSelectedDevice}
                  />
                ))}
                
                {devices.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No devices found</p>
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
                      onClick={() => setShowAddDevice(true)}
                    >
                      Add First Device
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selected Device Details - Center Top */}
          <div className="col-span-5">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-full">
              {selectedDevice ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white">Device Details</h2>
                    <div className="flex space-x-2">
                      <button 
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        onClick={() => openEditDevice(selectedDevice)}
                      >
                        Edit
                      </button>
                      <button 
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        onClick={() => openDeleteDevice(selectedDevice.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Status</p>
                        <p className={`text-sm font-medium ${
                          selectedDevice.is_active ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {selectedDevice.is_active ? 'ONLINE' : 'OFFLINE'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Device ID</p>
                        <p className="text-sm font-medium text-white">{selectedDevice.id}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Device Name</p>
                        <p className="text-sm font-medium text-white">{selectedDevice.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">IP Address</p>
                        <p className="text-sm font-medium text-white">{selectedDevice.ip_address || 'N/A'}</p>
                      </div>
                    </div>
                    
                    {selectedDevice.description && (
                      <div>
                        <p className="text-xs text-gray-400">Description</p>
                        <p className="text-sm font-medium text-white">{selectedDevice.description}</p>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t border-gray-700">
                      <h3 className="text-sm font-medium text-white mb-3">Quick Actions</h3>
                      <div className="flex space-x-3">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors">
                          Ping Device
                        </button>
                        <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors">
                          Restart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">Select a device to view details</p>
                </div>
              )}
            </div>
          </div>

          {/* Overview/Stats - Right Top */}
          <div className="col-span-3">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-full">
              <h2 className="text-lg font-bold text-white mb-4">Overview</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{totalDevices}</div>
                    <div className="text-xs text-gray-400">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{activeDevices}</div>
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
                      <Server className="w-4 h-4 text-blue-400" />
                      <Monitor className="w-4 h-4 text-green-400" />
                      <Laptop className="w-4 h-4 text-yellow-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Relay Management - Bottom */}
          <div className="col-span-12">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-64">
              <RelayManager 
                selectedDevice={selectedDevice}
                onRelayUpdate={() => {
                  // Refresh devices to get updated relay counts
                  fetchDevices(false);
                }}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Add Device Modal */}
      {showAddDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button className="absolute top-2 right-3 text-gray-400 hover:text-red-400 text-xl" onClick={() => setShowAddDevice(false)}>&times;</button>
            <h3 className="text-xl font-bold text-blue-300 mb-4">Add Device</h3>
            <form onSubmit={handleAddDevice} className="space-y-4">
              <div>
                <label className="block text-gray-200 mb-1">Name *</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-600" 
                  value={form.name} 
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                  required 
                />
              </div>
              <div>
                <label className="block text-gray-200 mb-1">IP Address</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-600" 
                  value={form.ip_address} 
                  onChange={e => setForm(f => ({ ...f, ip_address: e.target.value }))} 
                />
              </div>
              <div>
                <label className="block text-gray-200 mb-1">Description</label>
                <textarea 
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-600" 
                  value={form.description} 
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                />
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="is_active" 
                  checked={form.is_active} 
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} 
                />
                <label htmlFor="is_active" className="ml-2 text-gray-200">Active</label>
              </div>
              {formError && <p className="text-red-400 text-sm">{formError}</p>}
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold mt-2">
                Add Device
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Device Modal */}
      {showEditDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button className="absolute top-2 right-3 text-gray-400 hover:text-red-400 text-xl" onClick={() => setShowEditDevice(false)}>&times;</button>
            <h3 className="text-xl font-bold text-yellow-300 mb-4">Edit Device</h3>
            <form onSubmit={handleEditDevice} className="space-y-4">
              <div>
                <label className="block text-gray-200 mb-1">Name *</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-600" 
                  value={editForm.name} 
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} 
                  required 
                />
              </div>
              <div>
                <label className="block text-gray-200 mb-1">IP Address</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-600" 
                  value={editForm.ip_address} 
                  onChange={e => setEditForm(f => ({ ...f, ip_address: e.target.value }))} 
                />
              </div>
              <div>
                <label className="block text-gray-200 mb-1">Description</label>
                <textarea 
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-600" 
                  value={editForm.description} 
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} 
                />
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="edit_is_active" 
                  checked={editForm.is_active} 
                  onChange={e => setEditForm(f => ({ ...f, is_active: e.target.checked }))} 
                />
                <label htmlFor="edit_is_active" className="ml-2 text-gray-200">Active</label>
              </div>
              {formError && <p className="text-red-400 text-sm">{formError}</p>}
              <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded font-semibold mt-2">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Device Modal */}
      {showDeleteDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button className="absolute top-2 right-3 text-gray-400 hover:text-red-400 text-xl" onClick={() => setShowDeleteDevice(false)}>&times;</button>
            <h3 className="text-xl font-bold text-red-400 mb-4">Delete Device</h3>
            <p className="text-gray-200 mb-4">Are you sure you want to delete this device? This action cannot be undone.</p>
            {formError && <p className="text-red-400 text-sm">{formError}</p>}
            <div className="flex gap-4">
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold" onClick={handleDeleteDevice}>
                Delete
              </button>
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-semibold" onClick={() => setShowDeleteDevice(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Navigation Component
function Navigation({ serverIp, currentPath }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (serverIp) {
      navigator.clipboard.writeText(serverIp);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <Link 
          to="/" 
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
            currentPath === '/' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Server className="w-5 h-5" />
          <span className="font-semibold">Devices</span>
        </Link>
        <Link 
          to="/health" 
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
            currentPath === '/health' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Heart className="w-5 h-5" />
          <span className="font-semibold">Health Check</span>
        </Link>
      </div>
      
      <div className="flex items-center space-x-2 bg-gray-700 px-3 py-2 rounded-lg">
        <span className="text-xs text-gray-300">Server IP: {serverIp || '...'}</span>
        <button
          className="ml-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
          onClick={handleCopy}
          disabled={!serverIp}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </nav>
  );
}

// Main App Component
function App() {
  const [serverIp, setServerIp] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const backendUrl = window.location.origin.replace(/:\d+$/, ':5000');
    fetch(`${backendUrl}/api/server_info`)
      .then(res => res.json())
      .then(data => {
        setServerIp(data.ip);
        setIsConnected(true);
        setLastUpdate(new Date());
      })
      .catch(() => {
        setServerIp('Error');
        setIsConnected(false);
      });
  }, []);

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
          <Navigation serverIp={serverIp} currentPath={location.pathname} />
          
          <div className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/health" element={<HealthCheck />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

// Router Wrapper
function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper; 
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DeviceCard from './components/DeviceCard';
import RelayManager from './components/RelayManager';
import LoadingSpinner from './components/LoadingSpinner';
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
function Dashboard({ isDarkMode }) {
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
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [deviceToken, setDeviceToken] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [form, setForm] = useState({ name: '', ip_address: '', description: '', is_active: true });
  const [editForm, setEditForm] = useState({ id: null, name: '', ip_address: '', description: '', is_active: true });
  const [formError, setFormError] = useState(null);

  const backendUrl = window.location.origin.replace(/:\d+$/, ':5000');

  // Fallback clipboard copy function
  const copyToClipboardFallback = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        alert('Token copied to clipboard!');
      } else {
        alert('Failed to copy token. Please copy manually: ' + text);
      }
    } catch (err) {
      alert('Failed to copy token. Please copy manually: ' + text);
    }
    
    document.body.removeChild(textArea);
  };

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

  const handleGetToken = async (device) => {
    setTokenLoading(true);
    setFormError(null);
    
    try {
      const response = await fetch(`${backendUrl}/api/devices/${device.id}/token`, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setDeviceToken(data.token);
        setShowTokenModal(true);
      } else {
        const errorData = await response.json();
        setFormError(errorData.error || 'Failed to get token');
      }
    } catch (err) {
      setFormError('Failed to get token');
    } finally {
      setTokenLoading(false);
    }
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
      <div className={`h-screen flex items-center justify-center transition-colors duration-200 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
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
          
          {/* Device List - Left */}
          <div className="col-span-4">
            <div className={`border rounded-lg p-4 h-full transition-colors duration-200 ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">DEVICES</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Total: {totalDevices}</span>
                  <span className="text-sm text-green-400">Active: {activeDevices}</span>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    onClick={() => setShowAddDevice(true)}
                  >
                    Add Device
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 overflow-y-auto h-[calc(100%-60px)]">
                {devices
                  .sort((a, b) => a.id - b.id)
                  .map(device => (
                    <DeviceCard
                      key={device.id}
                      device={device}
                      isSelected={selectedDevice?.id === device.id}
                      onClick={setSelectedDevice}
                      onEdit={openEditDevice}
                      onDelete={openDeleteDevice}
                      onGetToken={handleGetToken}
                      isDarkMode={isDarkMode}
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

          {/* Relay Management - Center */}
          <div className="col-span-5">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-full">
              <RelayManager 
                selectedDevice={selectedDevice}
                onRelayUpdate={() => {
                  // Refresh devices to get updated relay counts
                  fetchDevices(false);
                }}
              />
            </div>
          </div>

          {/* System Status - Right */}
          <div className="col-span-3">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-full">
              <h2 className="text-lg font-bold text-white mb-4">System Status</h2>
              
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

      {/* Token Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button className="absolute top-2 right-3 text-gray-400 hover:text-red-400 text-xl" onClick={() => setShowTokenModal(false)}>&times;</button>
            <h3 className="text-xl font-bold text-blue-400 mb-4">Device Token</h3>
            {tokenLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Getting token...</p>
              </div>
            ) : deviceToken ? (
              <div>
                <p className="text-gray-200 mb-4">Here's your device token. Copy it and keep it safe:</p>
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 mb-4">
                  <code className="text-sm text-green-400 break-all">{deviceToken}</code>
                </div>
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold"
                  onClick={() => {
                    // Try modern clipboard API first
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(deviceToken)
                        .then(() => alert('Token copied to clipboard!'))
                        .catch(() => {
                          // Fallback to old method
                          copyToClipboardFallback(deviceToken);
                        });
                    } else {
                      // Fallback to old method
                      copyToClipboardFallback(deviceToken);
                    }
                  }}
                >
                  Copy Token
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-red-400">Failed to get token</p>
                {formError && <p className="text-red-400 text-sm mt-2">{formError}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



// Main App Component
function App() {
  const [serverIp, setServerIp] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const location = useLocation();

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    
    // Apply dark mode to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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
    <div className={`h-screen overflow-hidden transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="flex h-full">
        {/* Sidebar */}
        <Sidebar 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode}
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Header serverIp={serverIp} isDarkMode={isDarkMode} />
          
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
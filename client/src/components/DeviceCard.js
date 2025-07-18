import React, { useState } from 'react';

const DeviceCard = ({ device, onUpdateValue, onUpdateStatus, onRelayControl, isRelay }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newValue, setNewValue] = useState(device.value);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-red-500';
      case 'error': return 'bg-yellow-500';
      case 'maintenance': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'error': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'temperature': return '🌡️';
      case 'humidity': return '💧';
      case 'conveyor': return '🔄';
      case 'pressure': return '📊';
      case 'level': return '📈';
      case 'relay': return '🔌';
      default: return '📡';
    }
  };

  const handleValueUpdate = () => {
    onUpdateValue(device.id, newValue);
    setIsEditing(false);
  };

  const handleStatusChange = (newStatus) => {
    onUpdateStatus(device.id, newStatus);
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{getDeviceIcon(device.type)}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{device.name}</h3>
            <p className="text-gray-500 text-sm">ID: {device.id}</p>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full ${getStatusColor(device.status)}`}></div>
      </div>

      <div className="space-y-4">
        {isRelay ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Relay Control:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                device.value === 'ON' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {device.value}
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  device.value === 'ON' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-green-600 hover:text-white'
                }`}
                onClick={() => onRelayControl('on')}
                disabled={device.value === 'ON'}
              >
                Turn ON
              </button>
              <button
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  device.value === 'OFF' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-red-600 hover:text-white'
                }`}
                onClick={() => onRelayControl('off')}
                disabled={device.value === 'OFF'}
              >
                Turn OFF
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Current Value:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusTextColor(device.status)}`}>
                  {device.status}
                </span>
              </div>
              
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      step="0.1"
                    />
                    <span className="text-gray-600">{device.unit}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleValueUpdate}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-gray-800">{device.value}</span>
                    <span className="text-gray-600">{device.unit}</span>
                  </div>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <span className="text-gray-600 font-medium">Status Control:</span>
              <div className="grid grid-cols-2 gap-2">
                {['active', 'inactive', 'maintenance', 'error'].map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                      device.status === status 
                        ? 'text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    style={{
                      backgroundColor: device.status === status ? 
                        (status === 'active' ? '#10b981' : 
                         status === 'inactive' ? '#ef4444' : 
                         status === 'maintenance' ? '#3b82f6' : '#f59e0b') : 'transparent'
                    }}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        
        {device.last_update && (
          <div className="pt-3 border-t border-gray-200">
            <span className="text-gray-500 text-xs">
              Last Update: {formatLastUpdate(device.last_update)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceCard; 
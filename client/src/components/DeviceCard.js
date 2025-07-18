import React from 'react';

const DeviceCard = ({ device, onRelayControl, isRelay }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-900/50 text-green-400 border-green-500';
      case 'inactive': return 'bg-red-900/50 text-red-400 border-red-500';
      default: return 'bg-gray-900/50 text-gray-400 border-gray-500';
    }
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-xl">🔌</div>
          <div>
            <h3 className="text-lg font-semibold text-white">{device.name}</h3>
            <p className="text-gray-400 text-sm">Relay Control</p>
          </div>
        </div>
        <div className={`w-2 h-2 rounded-full ${getStatusColor(device.status)}`}></div>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-medium">Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusTextColor(device.status)}`}>
              {device.value}
            </span>
          </div>
          
          <div className="flex space-x-2">
            <button
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                device.value === 'ON' 
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/25' 
                  : 'bg-gray-700 text-gray-300 hover:bg-green-600 hover:text-white hover:shadow-lg hover:shadow-green-600/25'
              }`}
              onClick={() => onRelayControl('on')}
              disabled={device.value === 'ON'}
            >
              Turn ON
            </button>
            <button
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                device.value === 'OFF' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/25' 
                  : 'bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white hover:shadow-lg hover:shadow-red-600/25'
              }`}
              onClick={() => onRelayControl('off')}
              disabled={device.value === 'OFF'}
            >
              Turn OFF
            </button>
          </div>
        </div>
        
        {device.last_update && (
          <div className="pt-3 border-t border-gray-700">
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
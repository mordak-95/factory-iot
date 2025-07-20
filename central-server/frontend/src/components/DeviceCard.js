import React from 'react';
import { Server, Wifi, WifiOff } from 'lucide-react';

const DeviceCard = ({ device, isSelected, onClick }) => {
  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Online' : 'Offline';
  };

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'bg-blue-600/20 border-blue-500'
          : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
      }`}
      onClick={() => onClick(device)}
    >
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
          <Server className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-white">{device.name}</h3>
          <p className="text-xs text-gray-400">ID: {device.id}</p>
          {device.ip_address && (
            <p className="text-xs text-gray-400">IP: {device.ip_address}</p>
          )}
        </div>
        <div className="flex flex-col items-end space-y-1">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(device.is_active)}`}></div>
          <div className="text-xs text-gray-400">
            {device.is_active ? (
              <Wifi className="w-3 h-3 text-green-400" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceCard; 
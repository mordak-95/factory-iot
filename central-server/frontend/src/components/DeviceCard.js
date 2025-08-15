import React, { useState, useEffect } from 'react';
import { Server, Wifi, WifiOff, Edit, Trash2, Key } from 'lucide-react';

const DeviceCard = ({ device, isSelected, onClick, onEdit, onDelete, onGetToken, isDarkMode }) => {
  const [relayCount, setRelayCount] = useState(0);
  const [motionSensorCount, setMotionSensorCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const backendUrl = window.location.origin.replace(/:\d+$/, ':5000');

  useEffect(() => {
    fetchDeviceStats();
  }, [device.id]);

  const fetchDeviceStats = async () => {
    setLoading(true);
    try {
      // Fetch relays count
      const relaysResponse = await fetch(`${backendUrl}/api/relays`);
      if (relaysResponse.ok) {
        const relaysData = await relaysResponse.json();
        const deviceRelays = relaysData.relays.filter(r => r.device_id === device.id);
        setRelayCount(deviceRelays.length);
      }

      // Fetch motion sensors count
      const sensorsResponse = await fetch(`${backendUrl}/api/motion_sensors`);
      if (sensorsResponse.ok) {
        const sensorsData = await sensorsResponse.json();
        const deviceSensors = sensorsData.motion_sensors.filter(s => s.device_id === device.id);
        setMotionSensorCount(deviceSensors.length);
      }
    } catch (err) {
      console.error('Error fetching device stats:', err);
    } finally {
      setLoading(false);
    }
  };
  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Online' : 'Offline';
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(device);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(device.id);
  };

  const handleGetToken = (e) => {
    e.stopPropagation();
    onGetToken(device);
  };

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'bg-blue-600/20 border-blue-500'
          : isDarkMode
            ? 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
            : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onClick(device)}
    >
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
        }`}>
          <Server className={`w-4 h-4 ${
            isDarkMode ? 'text-white' : 'text-gray-700'
          }`} />
        </div>
        <div className="flex-1">
          <h3 className={`text-sm font-medium ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>{device.name}</h3>
          <p className={`text-xs ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>ID: {device.id}</p>
          {device.ip_address && (
            <p className={`text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>IP: {device.ip_address}</p>
          )}
          {!loading && (
            <div className="flex space-x-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded ${
                isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
              }`}>
                {relayCount} Relays
              </span>
              <span className={`text-xs px-2 py-1 rounded ${
                isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-200 text-blue-700'
              }`}>
                {motionSensorCount} Sensors
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end space-y-1">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(device.is_active)}`}></div>
          <div className={`text-xs ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {device.is_active ? (
              <Wifi className="w-3 h-3 text-green-400" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-400" />
            )}
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className={`flex justify-end space-x-2 mt-3 pt-2 border-t ${
        isDarkMode ? 'border-gray-600' : 'border-gray-200'
      }`}>
        <button
          onClick={handleGetToken}
          className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
          title="Get Token"
        >
          <Key className="w-3 h-3" />
        </button>
        <button
          onClick={handleEdit}
          className="p-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs transition-colors"
          title="Edit Device"
        >
          <Edit className="w-3 h-3" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
          title="Delete Device"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default DeviceCard; 
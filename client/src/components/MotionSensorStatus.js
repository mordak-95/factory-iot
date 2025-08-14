import React, { useState, useEffect } from 'react';
import { Activity, Eye, EyeOff, Zap } from 'lucide-react';
import axios from 'axios'; // Added missing import

function MotionSensorStatus({ isDarkMode }) {
  const [motionSensors, setMotionSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchMotionSensors = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/motion_sensors`);
      if (response.status === 200) {
        setMotionSensors(response.data.motion_sensors);
        setLastUpdate(new Date());
        setError(null);
      } else {
        throw new Error('Failed to fetch motion sensors');
      }
    } catch (err) {
      console.error('Error fetching motion sensors:', err);
      setError('Failed to fetch motion sensors');
    } finally {
      setLoading(false);
    }
  };

  const testMotionSensor = async (sensorId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/motion_sensors/${sensorId}/test`);
      if (response.status === 200) {
        // Refresh the list after test
        fetchMotionSensors();
      }
    } catch (err) {
      console.error('Error testing motion sensor:', err);
    }
  };

  useEffect(() => {
    fetchMotionSensors();
    
    // Set up interval for updates
    const interval = setInterval(fetchMotionSensors, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={`p-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        <div className="animate-pulse">Loading motion sensors...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        <div className="text-red-500">Error: {error}</div>
        <button 
          onClick={fetchMotionSensors}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`p-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Motion Sensors
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMotionSensors}
            className={`p-2 rounded-lg ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            title="Refresh"
          >
            <Zap className="w-4 h-4" />
          </button>
          {lastUpdate && (
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {motionSensors.length === 0 ? (
        <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No motion sensors configured
        </div>
      ) : (
        <div className="space-y-3">
          {motionSensors.map((sensor) => (
            <div
              key={sensor.id}
              className={`p-4 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{sensor.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      sensor.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {sensor.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      sensor.status === 'active'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {sensor.status}
                    </span>
                  </div>
                  <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    GPIO Pin: {sensor.gpio_pin}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => testMotionSensor(sensor.id)}
                    className={`p-2 rounded-lg ${
                      isDarkMode 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-blue-500 hover:bg-blue-600'
                    } text-white`}
                    title="Test Sensor"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MotionSensorStatus;

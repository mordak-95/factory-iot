import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Clock, Settings, Activity } from 'lucide-react';

const MotionSensorStatus = () => {
  const [motionSensors, setMotionSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMotionSensors();
    const interval = setInterval(fetchMotionSensors, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMotionSensors = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/motion_sensors`);
      if (response.ok) {
        const data = await response.json();
        setMotionSensors(data.motion_sensors || []);
      } else {
        setError('Failed to fetch motion sensors');
      }
    } catch (err) {
      setError('Error fetching motion sensors');
    } finally {
      setLoading(false);
    }
  };

  const testMotionSensor = async (sensorId) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/motion_sensors/${sensorId}/test`, {
        method: 'POST',
      });
      if (response.ok) {
        // Refresh data after test
        setTimeout(fetchMotionSensors, 1000);
      }
    } catch (err) {
      console.error('Error testing motion sensor:', err);
    }
  };

  const getScheduleStatus = (sensor) => {
    if (!sensor.enable_scheduling) return 'Always Active';
    
    const start = sensor.start_time || '00:00';
    const end = sensor.end_time || '23:59';
    const days = [];
    
    if (sensor.weekday_monitoring) days.push('Weekdays');
    if (sensor.weekend_monitoring) days.push('Weekends');
    
    return `${start} - ${end} (${days.join(', ')})`;
  };

  const getStatusColor = (sensor) => {
    if (!sensor.is_active) return 'text-red-500';
    if (sensor.status === 'active') return 'text-green-500';
    return 'text-yellow-500';
  };

  const getStatusIcon = (sensor) => {
    if (!sensor.is_active) return <EyeOff size={16} />;
    if (sensor.status === 'active') return <Eye size={16} />;
    return <Activity size={16} />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Motion Sensors Status
        </h3>
        <div className="text-center py-4">Loading motion sensors...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Motion Sensors Status
        </h3>
        <div className="text-red-500 text-center py-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5" />
        Motion Sensors Status
      </h3>

      {motionSensors.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No motion sensors configured
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {motionSensors.map((sensor) => (
            <div key={sensor.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={getStatusColor(sensor)}>
                    {getStatusIcon(sensor)}
                  </span>
                  <h4 className="font-medium">{sensor.name}</h4>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  sensor.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {sensor.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <span>GPIO:</span>
                  <span className="font-mono bg-gray-200 px-2 py-1 rounded">
                    {sensor.gpio_pin}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={14} />
                  <span>{getScheduleStatus(sensor)}</span>
                </div>

                {sensor.sensitivity && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Settings size={14} />
                    <span>Sensitivity: {sensor.sensitivity}</span>
                  </div>
                )}

                {sensor.delay_time && (
                  <div className="text-gray-600">
                    Delay: {sensor.delay_time}s
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => testMotionSensor(sensor.id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                  >
                    Test Sensor
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MotionSensorStatus;

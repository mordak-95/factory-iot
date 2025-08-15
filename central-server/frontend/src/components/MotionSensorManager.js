import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Clock, Settings } from 'lucide-react';

const MotionSensorManager = ({ deviceId, onUpdate }) => {
  const [motionSensors, setMotionSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSensor, setEditingSensor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    gpio_pin: '',
    is_active: true,
    start_time: '',
    end_time: '',
    timezone: 'UTC',
    enable_scheduling: false,
    weekend_monitoring: true,
    weekday_monitoring: true,
    sensitivity: 'medium',
    delay_time: 3,
    trigger_mode: 'single'
  });

  useEffect(() => {
    fetchMotionSensors();
  }, [deviceId]);

  const fetchMotionSensors = async () => {
    try {
      setLoading(true);
      const backendUrl = window.location.origin.replace(/:\d+$/, ':5000');
      const response = await fetch(`${backendUrl}/api/motion_sensors`);
      if (response.ok) {
        const data = await response.json();
        // Filter motion sensors for this specific device
        const deviceSensors = data.motion_sensors.filter(sensor => sensor.device_id === deviceId);
        setMotionSensors(deviceSensors);
      } else {
        setError('Failed to fetch motion sensors');
      }
    } catch (err) {
      setError('Error fetching motion sensors');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const backendUrl = window.location.origin.replace(/:\d+$/, ':5000');
      const url = editingSensor 
        ? `${backendUrl}/api/motion_sensors/${editingSensor.id}`
        : `${backendUrl}/api/devices/${deviceId}/motion_sensors`;
      
      const method = editingSensor ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingSensor(null);
        resetForm();
        fetchMotionSensors();
        if (onUpdate) onUpdate();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save motion sensor');
      }
    } catch (err) {
      setError('Error saving motion sensor');
    }
  };

  const handleDelete = async (sensorId) => {
    if (!window.confirm('Are you sure you want to delete this motion sensor?')) {
      return;
    }

    try {
      const backendUrl = window.location.origin.replace(/:\d+$/, ':5000');
      const response = await fetch(`${backendUrl}/api/motion_sensors/${sensorId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMotionSensors();
        if (onUpdate) onUpdate();
      } else {
        setError('Failed to delete motion sensor');
      }
    } catch (err) {
      setError('Error deleting motion sensor');
    }
  };

  const handleEdit = (sensor) => {
    setEditingSensor(sensor);
    setFormData({
      name: sensor.name,
      gpio_pin: sensor.gpio_pin,
      is_active: sensor.is_active,
      start_time: sensor.start_time || '',
      end_time: sensor.end_time || '',
      timezone: sensor.timezone || 'UTC',
      enable_scheduling: sensor.enable_scheduling || false,
      weekend_monitoring: sensor.weekend_monitoring !== false,
      weekday_monitoring: sensor.weekday_monitoring !== false,
      sensitivity: sensor.sensitivity || 'medium',
      delay_time: sensor.delay_time || 3,
      trigger_mode: sensor.trigger_mode || 'single'
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      gpio_pin: '',
      is_active: true,
      start_time: '',
      end_time: '',
      timezone: 'UTC',
      enable_scheduling: false,
      weekend_monitoring: true,
      weekday_monitoring: true,
      sensitivity: 'medium',
      delay_time: 3,
      trigger_mode: 'single'
    });
  };

  const formatTime = (time) => {
    if (!time) return 'Always';
    return time;
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

  if (loading) return <div className="text-center py-4">Loading motion sensors...</div>;
  if (error) return <div className="text-red-500 text-center py-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Motion Sensors</h3>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingSensor(null);
            resetForm();
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus size={16} />
          Add Sensor
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h4 className="text-lg font-semibold mb-4">
            {editingSensor ? 'Edit Motion Sensor' : 'Add New Motion Sensor'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GPIO Pin
                </label>
                <input
                  type="number"
                  value={formData.gpio_pin}
                  onChange={(e) => setFormData({...formData, gpio_pin: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Time Scheduling Section */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} />
                <h5 className="font-medium">Time Scheduling</h5>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.enable_scheduling}
                      onChange={(e) => setFormData({...formData, enable_scheduling: e.target.checked})}
                      className="rounded"
                    />
                    Enable Time Scheduling
                  </label>
                </div>
                
                {formData.enable_scheduling && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.weekday_monitoring}
                          onChange={(e) => setFormData({...formData, weekday_monitoring: e.target.checked})}
                          className="rounded"
                        />
                        Monitor on Weekdays
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.weekend_monitoring}
                          onChange={(e) => setFormData({...formData, weekend_monitoring: e.target.checked})}
                          className="rounded"
                        />
                        Monitor on Weekends
                      </label>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* HC-SR501 Settings Section */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings size={16} />
                <h5 className="font-medium">HC-SR501 Settings</h5>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sensitivity
                  </label>
                  <select
                    value={formData.sensitivity}
                    onChange={(e) => setFormData({...formData, sensitivity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delay Time (seconds)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={formData.delay_time}
                    onChange={(e) => setFormData({...formData, delay_time: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trigger Mode
                  </label>
                  <select
                    value={formData.trigger_mode}
                    onChange={(e) => setFormData({...formData, trigger_mode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="single">Single</option>
                    <option value="repeat">Repeat</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="is_active">Active</label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
              >
                {editingSensor ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingSensor(null);
                  resetForm();
                }}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {motionSensors.map((sensor) => (
          <div key={sensor.id} className="bg-white p-4 rounded-lg shadow-md border">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-lg">{sensor.name}</h4>
                <p className="text-gray-600">GPIO {sensor.gpio_pin}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(sensor)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(sensor.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${sensor.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span>{sensor.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span className="text-gray-600">{getScheduleStatus(sensor)}</span>
              </div>
              
              {sensor.last_motion_detected && (
                <div className="text-gray-600">
                  Last motion: {new Date(sensor.last_motion_detected).toLocaleString()}
                </div>
              )}
              
              <div className="text-gray-600">
                Motion count: {sensor.motion_count || 0}
              </div>
            </div>
          </div>
        ))}
      </div>

      {motionSensors.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No motion sensors configured for this device.
        </div>
      )}
    </div>
  );
};

export default MotionSensorManager;

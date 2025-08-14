import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Activity } from 'lucide-react';

function MotionSensorManager({ deviceId, deviceName, isDarkMode }) {
  const [motionSensors, setMotionSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingSensor, setEditingSensor] = useState(null);
  const [form, setForm] = useState({ name: '', gpio_pin: '', is_active: true });
  const [formError, setFormError] = useState(null);

  const backendUrl = window.location.origin.replace(/:\d+$/, ':5000');

  const fetchMotionSensors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/devices/${deviceId}/motion_sensors`);
      if (response.ok) {
        const data = await response.json();
        setMotionSensors(data);
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

  useEffect(() => {
    if (deviceId) {
      fetchMotionSensors();
    }
  }, [deviceId]);

  const handleAddSensor = async (e) => {
    e.preventDefault();
    setFormError(null);
    
    if (!form.name.trim() || !form.gpio_pin) {
      setFormError('Name and GPIO pin are required');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/devices/${deviceId}/motion_sensors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        setForm({ name: '', gpio_pin: '', is_active: true });
        setShowAddForm(false);
        fetchMotionSensors();
      } else {
        const errorData = await response.json();
        setFormError(errorData.error || 'Failed to create motion sensor');
      }
    } catch (err) {
      setFormError('Failed to create motion sensor');
    }
  };

  const handleEditSensor = async (e) => {
    e.preventDefault();
    setFormError(null);
    
    if (!form.name.trim() || !form.gpio_pin) {
      setFormError('Name and GPIO pin are required');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/motion_sensors/${editingSensor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        setForm({ name: '', gpio_pin: '', is_active: true });
        setShowEditForm(false);
        setEditingSensor(null);
        fetchMotionSensors();
      } else {
        const errorData = await response.json();
        setFormError(errorData.error || 'Failed to update motion sensor');
      }
    } catch (err) {
      setFormError('Failed to update motion sensor');
    }
  };

  const handleDeleteSensor = async (sensorId) => {
    if (!window.confirm('Are you sure you want to delete this motion sensor?')) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/motion_sensors/${sensorId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchMotionSensors();
      } else {
        alert('Failed to delete motion sensor');
      }
    } catch (err) {
      alert('Failed to delete motion sensor');
    }
  };

  const openEditForm = (sensor) => {
    setEditingSensor(sensor);
    setForm({
      name: sensor.name,
      gpio_pin: sensor.gpio_pin,
      is_active: sensor.is_active
    });
    setShowEditForm(true);
  };

  const resetForm = () => {
    setForm({ name: '', gpio_pin: '', is_active: true });
    setFormError(null);
    setShowAddForm(false);
    setShowEditForm(false);
    setEditingSensor(null);
  };

  if (loading) {
    return (
      <div className={`p-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        <div className="animate-pulse">Loading motion sensors...</div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Motion Sensors for {deviceName}
        </h3>
        <button
          onClick={() => setShowAddForm(true)}
          className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
            isDarkMode 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          Add Sensor
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Motion Sensors List */}
      <div className="space-y-3">
        {motionSensors.length === 0 ? (
          <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No motion sensors configured for this device
          </div>
        ) : (
          motionSensors.map((sensor) => (
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
                  </div>
                  <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    GPIO Pin: {sensor.gpio_pin}
                  </div>
                  {sensor.last_motion_detected && (
                    <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Last Motion: {new Date(sensor.last_motion_detected).toLocaleString()}
                    </div>
                  )}
                  <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Motion Count: {sensor.motion_count}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditForm(sensor)}
                    className={`p-2 rounded-lg ${
                      isDarkMode 
                        ? 'bg-gray-600 hover:bg-gray-500' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSensor(sensor.id)}
                    className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Motion Sensor Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg w-96 max-w-[90vw] ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className="text-lg font-semibold mb-4">Add Motion Sensor</h3>
            <form onSubmit={handleAddSensor}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    className={`w-full p-2 border rounded-lg ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-800'
                    }`}
                    placeholder="e.g., Main Entrance Sensor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">GPIO Pin</label>
                  <input
                    type="number"
                    value={form.gpio_pin}
                    onChange={(e) => setForm({...form, gpio_pin: e.target.value})}
                    className={`w-full p-2 border rounded-lg ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-800'
                    }`}
                    placeholder="e.g., 17"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={form.is_active}
                    onChange={(e) => setForm({...form, is_active: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_active" className="text-sm">Active</label>
                </div>
                {formError && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {formError}
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 rounded-lg ${
                    isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Add Sensor
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Motion Sensor Form */}
      {showEditForm && editingSensor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg w-96 max-w-[90vw] ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className="text-lg font-semibold mb-4">Edit Motion Sensor</h3>
            <form onSubmit={handleEditSensor}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    className={`w-full p-2 border rounded-lg ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-800'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">GPIO Pin</label>
                  <input
                    type="number"
                    value={form.gpio_pin}
                    onChange={(e) => setForm({...form, gpio_pin: e.target.value})}
                    className={`w-full p-2 border rounded-lg ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-800'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit_is_active"
                    checked={form.is_active}
                    onChange={(e) => setForm({...form, is_active: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <label htmlFor="edit_is_active" className="text-sm">Active</label>
                </div>
                {formError && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {formError}
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 rounded-lg ${
                    isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Update Sensor
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MotionSensorManager;

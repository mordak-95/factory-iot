import React, { useState, useEffect } from 'react';
import { Zap, Edit, Trash2, Plus } from 'lucide-react';

const RelayManager = ({ selectedDevice, onRelayUpdate, isDarkMode }) => {
  const [relays, setRelays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedRelay, setSelectedRelay] = useState(null);
  const [form, setForm] = useState({ name: '', gpio_pin: '', status: false });
  const [editForm, setEditForm] = useState({ id: null, name: '', gpio_pin: '', status: false });
  const [toggleLoading, setToggleLoading] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [relayToDelete, setRelayToDelete] = useState(null);

  const backendUrl = window.location.origin.replace(/:\d+$/, ':5000');

  const fetchRelays = async () => {
    if (!selectedDevice) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/devices/${selectedDevice.id}/relays`);
      const data = await response.json();
      setRelays(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch relays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelays();
  }, [selectedDevice]);

  const handleToggleStatus = async (relay) => {
    setToggleLoading(t => ({ ...t, [relay.id]: true }));
    try {
      const response = await fetch(`${backendUrl}/api/relays/${relay.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: !relay.status })
      });
      
      if (response.ok) {
        await fetchRelays();
        if (onRelayUpdate) onRelayUpdate();
      }
    } catch (err) {
      console.error('Failed to toggle relay:', err);
    } finally {
      setToggleLoading(t => ({ ...t, [relay.id]: false }));
    }
  };

  const handleAddRelay = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.gpio_pin) {
      setError('Relay name and GPIO pin are required');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/devices/${selectedDevice.id}/relays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, gpio_pin: Number(form.gpio_pin) })
      });

      if (response.ok) {
        setShowAdd(false);
        setForm({ name: '', gpio_pin: '', status: false });
        await fetchRelays();
        if (onRelayUpdate) onRelayUpdate();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add relay');
      }
    } catch (err) {
      setError('Failed to add relay');
    }
  };

  const handleEditRelay = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.gpio_pin) {
      setError('Relay name and GPIO pin are required');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/relays/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: editForm.name, 
          gpio_pin: Number(editForm.gpio_pin), 
          status: editForm.status 
        })
      });

      if (response.ok) {
        setShowEdit(false);
        await fetchRelays();
        if (onRelayUpdate) onRelayUpdate();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update relay');
      }
    } catch (err) {
      setError('Failed to update relay');
    }
  };

  const handleDeleteRelay = async (relayId) => {
    try {
      const response = await fetch(`${backendUrl}/api/relays/${relayId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchRelays();
        if (onRelayUpdate) onRelayUpdate();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete relay');
      }
    } catch (err) {
      setError('Failed to delete relay');
    }
  };

  const openEdit = (relay) => {
    setEditForm({ ...relay });
    setShowEdit(true);
  };

  const openDeleteConfirm = (relay) => {
    setRelayToDelete(relay);
    setShowDeleteConfirm(true);
  };

  if (!selectedDevice) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Select a device to manage its relays</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg font-bold transition-colors duration-200 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>Relay Management</h2>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Add Relay</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-3 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <p className={`transition-colors duration-200 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>Loading relays...</p>
        </div>
      ) : relays.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <p className={`transition-colors duration-200 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>No relays found for this device</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          {relays
            .sort((a, b) => a.id - b.id)
            .map(relay => (
              <div key={relay.id} className={`border rounded-lg p-3 transition-colors duration-200 ${
                isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                  }`}>
                    <Zap className={`w-4 h-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-700'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`text-sm font-medium transition-colors duration-200 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{relay.name}</h3>
                    <p className={`text-xs transition-colors duration-200 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>GPIO: {relay.gpio_pin}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${
                      relay.status 
                        ? 'bg-green-600 text-white shadow-lg shadow-green-600/25' 
                        : 'bg-gray-600 text-gray-300 hover:bg-green-600 hover:text-white hover:shadow-lg hover:shadow-green-600/25'
                    }`}
                    onClick={() => handleToggleStatus(relay)}
                    disabled={toggleLoading[relay.id]}
                  >
                    {toggleLoading[relay.id] ? '...' : relay.status ? 'ON' : 'OFF'}
                  </button>
                  
                  <button
                    className="bg-yellow-600 hover:bg-yellow-700 text-white p-1 rounded transition-colors"
                    onClick={() => openEdit(relay)}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white p-1 rounded transition-colors"
                    onClick={() => openDeleteConfirm(relay)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Relay Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-md shadow-xl relative transition-colors duration-200 ${
            isDarkMode ? 'bg-gray-900' : 'bg-white'
          }`}>
            <button className="absolute top-2 right-3 text-gray-400 hover:text-red-400 text-xl" onClick={() => setShowAdd(false)}>&times;</button>
            <h3 className={`text-xl font-bold mb-4 transition-colors duration-200 ${
              isDarkMode ? 'text-blue-300' : 'text-blue-600'
            }`}>Add Relay</h3>
            <form onSubmit={handleAddRelay} className="space-y-4">
              <div>
                <label className={`block mb-1 transition-colors duration-200 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>Name *</label>
                <input 
                  type="text" 
                  className={`w-full px-3 py-2 rounded border transition-colors duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-800 text-white border-gray-600' 
                      : 'bg-white text-gray-900 border-gray-300'
                  }`}
                  value={form.name} 
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                  required 
                />
              </div>
              <div>
                <label className={`block mb-1 transition-colors duration-200 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>GPIO Pin *</label>
                <input 
                  type="number" 
                  className={`w-full px-3 py-2 rounded border transition-colors duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-800 text-white border-gray-600' 
                      : 'bg-white text-gray-900 border-gray-300'
                  }`}
                  value={form.gpio_pin} 
                  onChange={e => setForm(f => ({ ...f, gpio_pin: e.target.value }))} 
                  required 
                />
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="status" 
                  checked={form.status} 
                  onChange={e => setForm(f => ({ ...f, status: e.target.checked }))} 
                />
                <label htmlFor="status" className={`ml-2 transition-colors duration-200 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>ON</label>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold mt-2">
                Add Relay
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Relay Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button className="absolute top-2 right-3 text-gray-400 hover:text-red-400 text-xl" onClick={() => setShowEdit(false)}>&times;</button>
            <h3 className="text-xl font-bold text-yellow-300 mb-4">Edit Relay</h3>
            <form onSubmit={handleEditRelay} className="space-y-4">
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
                <label className="block text-gray-200 mb-1">GPIO Pin *</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-600" 
                  value={editForm.gpio_pin} 
                  onChange={e => setEditForm(f => ({ ...f, gpio_pin: e.target.value }))} 
                  required 
                />
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="edit_status" 
                  checked={editForm.status} 
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.checked }))} 
                />
                <label htmlFor="edit_status" className="ml-2 text-gray-200">ON</label>
              </div>
              <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded font-semibold mt-2">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button className="absolute top-2 right-3 text-gray-400 hover:text-red-400 text-xl" onClick={() => setShowDeleteConfirm(false)}>&times;</button>
            <h3 className="text-xl font-bold text-red-400 mb-4">Delete Relay</h3>
            <p className="text-gray-200 mb-4">
              Are you sure you want to delete the relay "{relayToDelete?.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold" 
                onClick={() => {
                  handleDeleteRelay(relayToDelete.id);
                  setShowDeleteConfirm(false);
                }}
              >
                Delete
              </button>
              <button 
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-semibold" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelayManager; 
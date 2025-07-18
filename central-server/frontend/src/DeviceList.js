import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addError, setAddError] = useState(null);
  const [form, setForm] = useState({ name: '', ip_address: '', description: '', is_active: true });
  const navigate = useNavigate();

  const backendUrl = window.location.origin.replace(/:\d+$/, ':5000');

  const fetchDevices = () => {
    setLoading(true);
    fetch(`${backendUrl}/api/devices`)
      .then(res => res.json())
      .then(data => {
        setDevices(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch devices');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDevices();
    // eslint-disable-next-line
  }, []);

  const handleAddDevice = (e) => {
    e.preventDefault();
    setAddError(null);
    if (!form.name.trim()) {
      setAddError('Device name is required');
      return;
    }
    fetch(`${backendUrl}/api/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
      .then(async res => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to add device');
        return res.json();
      })
      .then(() => {
        setShowAdd(false);
        setForm({ name: '', ip_address: '', description: '', is_active: true });
        fetchDevices();
      })
      .catch(err => setAddError(err.message));
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-cyan-300">Devices</h2>
        <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded font-semibold" onClick={() => setShowAdd(true)}>
          + Add Device
        </button>
      </div>
      {loading ? (
        <p className="text-gray-300">Loading...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : devices.length === 0 ? (
        <p className="text-gray-400">No devices found.</p>
      ) : (
        <table className="w-full text-left text-gray-200">
          <thead>
            <tr>
              <th className="py-2">Name</th>
              <th className="py-2">IP Address</th>
              <th className="py-2">Active</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {devices.map(device => (
              <tr key={device.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                <td className="py-2 font-semibold">{device.name}</td>
                <td className="py-2">{device.ip_address || '-'}</td>
                <td className="py-2">{device.is_active ? 'Yes' : 'No'}</td>
                <td className="py-2">
                  <button
                    className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1 rounded mr-2"
                    onClick={() => navigate(`/devices/${device.id}/relays`)}
                  >
                    Relays
                  </button>
                  {/* Edit/Delete buttons to be implemented */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Add Device Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button className="absolute top-2 right-3 text-gray-400 hover:text-red-400 text-xl" onClick={() => setShowAdd(false)}>&times;</button>
            <h3 className="text-xl font-bold text-cyan-300 mb-4">Add Device</h3>
            <form onSubmit={handleAddDevice} className="space-y-4">
              <div>
                <label className="block text-gray-200 mb-1">Name *</label>
                <input type="text" className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-gray-200 mb-1">IP Address</label>
                <input type="text" className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={form.ip_address} onChange={e => setForm(f => ({ ...f, ip_address: e.target.value }))} />
              </div>
              <div>
                <label className="block text-gray-200 mb-1">Description</label>
                <textarea className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <label htmlFor="is_active" className="ml-2 text-gray-200">Active</label>
              </div>
              {addError && <p className="text-red-400 text-sm">{addError}</p>}
              <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded font-semibold mt-2">Add Device</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeviceList; 
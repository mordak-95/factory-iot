import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addError, setAddError] = useState(null);
  const [form, setForm] = useState({ name: '', ip_address: '', description: '', is_active: true });
  const [showEdit, setShowEdit] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editForm, setEditForm] = useState({ id: null, name: '', ip_address: '', description: '', is_active: true });
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
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

  const openEdit = (device) => {
    setEditForm({ ...device });
    setEditError(null);
    setShowEdit(true);
  };

  const handleEditDevice = (e) => {
    e.preventDefault();
    setEditError(null);
    if (!editForm.name.trim()) {
      setEditError('Device name is required');
      return;
    }
    fetch(`${backendUrl}/api/devices/${editForm.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm)
    })
      .then(async res => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to update device');
        return res.json();
      })
      .then(() => {
        setShowEdit(false);
        fetchDevices();
      })
      .catch(err => setEditError(err.message));
  };

  const openDelete = (id) => {
    setDeleteId(id);
    setDeleteError(null);
    setShowDelete(true);
  };

  const handleDeleteDevice = () => {
    fetch(`${backendUrl}/api/devices/${deleteId}`, {
      method: 'DELETE'
    })
      .then(async res => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete device');
        return res.json();
      })
      .then(() => {
        setShowDelete(false);
        setDeleteId(null);
        fetchDevices();
      })
      .catch(err => setDeleteError(err.message));
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
            {devices.slice().sort((a, b) => a.id - b.id).map(device => (
              <tr key={device.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                <td className="py-2 font-semibold">{device.name}</td>
                <td className="py-2">{device.ip_address || '-'}</td>
                <td className="py-2">{device.is_active ? 'Yes' : 'No'}</td>
                <td className="py-2 flex gap-2">
                  <button
                    className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1 rounded"
                    onClick={() => navigate(`/devices/${device.id}/relays`)}
                  >
                    Relays
                  </button>
                  <button
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                    onClick={() => openEdit(device)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    onClick={() => openDelete(device.id)}
                  >
                    Delete
                  </button>
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
      {/* Edit Device Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button className="absolute top-2 right-3 text-gray-400 hover:text-red-400 text-xl" onClick={() => setShowEdit(false)}>&times;</button>
            <h3 className="text-xl font-bold text-yellow-300 mb-4">Edit Device</h3>
            <form onSubmit={handleEditDevice} className="space-y-4">
              <div>
                <label className="block text-gray-200 mb-1">Name *</label>
                <input type="text" className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-gray-200 mb-1">IP Address</label>
                <input type="text" className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={editForm.ip_address} onChange={e => setEditForm(f => ({ ...f, ip_address: e.target.value }))} />
              </div>
              <div>
                <label className="block text-gray-200 mb-1">Description</label>
                <textarea className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="edit_is_active" checked={editForm.is_active} onChange={e => setEditForm(f => ({ ...f, is_active: e.target.checked }))} />
                <label htmlFor="edit_is_active" className="ml-2 text-gray-200">Active</label>
              </div>
              {editError && <p className="text-red-400 text-sm">{editError}</p>}
              <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded font-semibold mt-2">Save Changes</button>
            </form>
          </div>
        </div>
      )}
      {/* Delete Device Modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button className="absolute top-2 right-3 text-gray-400 hover:text-red-400 text-xl" onClick={() => setShowDelete(false)}>&times;</button>
            <h3 className="text-xl font-bold text-red-400 mb-4">Delete Device</h3>
            <p className="text-gray-200 mb-4">Are you sure you want to delete this device?</p>
            {deleteError && <p className="text-red-400 text-sm">{deleteError}</p>}
            <div className="flex gap-4">
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold" onClick={handleDeleteDevice}>Delete</button>
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-semibold" onClick={() => setShowDelete(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeviceList; 
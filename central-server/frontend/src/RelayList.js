import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function RelayList() {
  const { deviceId } = useParams();
  const [relays, setRelays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addError, setAddError] = useState(null);
  const [form, setForm] = useState({ name: '', gpio_pin: '', status: false });
  const [toggleLoading, setToggleLoading] = useState({});
  const [showEdit, setShowEdit] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editForm, setEditForm] = useState({ id: null, name: '', gpio_pin: '', status: false });
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const backendUrl = window.location.origin.replace(/:\d+$/, ':5000');

  const fetchRelays = () => {
    setLoading(true);
    fetch(`${backendUrl}/api/devices/${deviceId}/relays`)
      .then(res => res.json())
      .then(data => {
        setRelays(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch relays');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRelays();
    // eslint-disable-next-line
  }, [deviceId]);

  const handleAddRelay = (e) => {
    e.preventDefault();
    setAddError(null);
    if (!form.name.trim() || !form.gpio_pin) {
      setAddError('Relay name and GPIO pin are required');
      return;
    }
    fetch(`${backendUrl}/api/devices/${deviceId}/relays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, gpio_pin: Number(form.gpio_pin) })
    })
      .then(async res => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to add relay');
        return res.json();
      })
      .then(() => {
        setShowAdd(false);
        setForm({ name: '', gpio_pin: '', status: false });
        fetchRelays();
      })
      .catch(err => setAddError(err.message));
  };

  const handleToggleStatus = (relay) => {
    setToggleLoading(t => ({ ...t, [relay.id]: true }));
    fetch(`${backendUrl}/api/relays/${relay.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: !relay.status })
    })
      .then(async res => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to update relay');
        return res.json();
      })
      .then(() => fetchRelays())
      .catch(() => {})
      .finally(() => setToggleLoading(t => ({ ...t, [relay.id]: false })));
  };

  const openEdit = (relay) => {
    setEditForm({ ...relay });
    setEditError(null);
    setShowEdit(true);
  };

  const handleEditRelay = (e) => {
    e.preventDefault();
    setEditError(null);
    if (!editForm.name.trim() || !editForm.gpio_pin) {
      setEditError('Relay name and GPIO pin are required');
      return;
    }
    fetch(`${backendUrl}/api/relays/${editForm.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editForm.name, gpio_pin: Number(editForm.gpio_pin), status: editForm.status })
    })
      .then(async res => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to update relay');
        return res.json();
      })
      .then(() => {
        setShowEdit(false);
        fetchRelays();
      })
      .catch(err => setEditError(err.message));
  };

  const openDelete = (id) => {
    setDeleteId(id);
    setDeleteError(null);
    setShowDelete(true);
  };

  const handleDeleteRelay = () => {
    fetch(`${backendUrl}/api/relays/${deleteId}`, {
      method: 'DELETE'
    })
      .then(async res => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete relay');
        return res.json();
      })
      .then(() => {
        setShowDelete(false);
        setDeleteId(null);
        fetchRelays();
      })
      .catch(err => setDeleteError(err.message));
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-cyan-300">Relays for Device #{deviceId}</h2>
        <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded font-semibold" onClick={() => setShowAdd(true)}>
          + Add Relay
        </button>
      </div>
      {loading ? (
        <p className="text-gray-300">Loading...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : relays.length === 0 ? (
        <p className="text-gray-400">No relays found for this device.</p>
      ) : (
        <table className="w-full text-left text-gray-200">
          <thead>
            <tr>
              <th className="py-2">Name</th>
              <th className="py-2">GPIO Pin</th>
              <th className="py-2">Status</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {relays.map(relay => (
              <tr key={relay.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                <td className="py-2 font-semibold">{relay.name}</td>
                <td className="py-2">{relay.gpio_pin}</td>
                <td className="py-2">
                  <button
                    className={`px-3 py-1 rounded font-semibold ${relay.status ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'} text-white`}
                    onClick={() => handleToggleStatus(relay)}
                    disabled={toggleLoading[relay.id]}
                  >
                    {toggleLoading[relay.id] ? '...' : relay.status ? 'ON' : 'OFF'}
                  </button>
                </td>
                <td className="py-2 flex gap-2">
                  <button
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                    onClick={() => openEdit(relay)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    onClick={() => openDelete(relay.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Add Relay Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button className="absolute top-2 right-3 text-gray-400 hover:text-red-400 text-xl" onClick={() => setShowAdd(false)}>&times;</button>
            <h3 className="text-xl font-bold text-cyan-300 mb-4">Add Relay</h3>
            <form onSubmit={handleAddRelay} className="space-y-4">
              <div>
                <label className="block text-gray-200 mb-1">Name *</label>
                <input type="text" className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-gray-200 mb-1">GPIO Pin *</label>
                <input type="number" className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={form.gpio_pin} onChange={e => setForm(f => ({ ...f, gpio_pin: e.target.value }))} required />
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="status" checked={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.checked }))} />
                <label htmlFor="status" className="ml-2 text-gray-200">ON</label>
              </div>
              {addError && <p className="text-red-400 text-sm">{addError}</p>}
              <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded font-semibold mt-2">Add Relay</button>
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
                <input type="text" className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-gray-200 mb-1">GPIO Pin *</label>
                <input type="number" className="w-full px-3 py-2 rounded bg-gray-800 text-white" value={editForm.gpio_pin} onChange={e => setEditForm(f => ({ ...f, gpio_pin: e.target.value }))} required />
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="edit_status" checked={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.checked }))} />
                <label htmlFor="edit_status" className="ml-2 text-gray-200">ON</label>
              </div>
              {editError && <p className="text-red-400 text-sm">{editError}</p>}
              <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded font-semibold mt-2">Save Changes</button>
            </form>
          </div>
        </div>
      )}
      {/* Delete Relay Modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <button className="absolute top-2 right-3 text-gray-400 hover:text-red-400 text-xl" onClick={() => setShowDelete(false)}>&times;</button>
            <h3 className="text-xl font-bold text-red-400 mb-4">Delete Relay</h3>
            <p className="text-gray-200 mb-4">Are you sure you want to delete this relay?</p>
            {deleteError && <p className="text-red-400 text-sm">{deleteError}</p>}
            <div className="flex gap-4">
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold" onClick={handleDeleteRelay}>Delete</button>
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-semibold" onClick={() => setShowDelete(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RelayList; 
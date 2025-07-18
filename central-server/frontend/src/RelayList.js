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
                <td className="py-2">{relay.status ? 'ON' : 'OFF'}</td>
                <td className="py-2">
                  {/* Edit/Delete buttons to be implemented */}
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
    </div>
  );
}

export default RelayList; 
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const backendUrl = window.location.origin.replace(/:\d+$/, ':5000');
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
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-cyan-300">Devices</h2>
        <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded font-semibold" disabled>
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
    </div>
  );
}

export default DeviceList; 
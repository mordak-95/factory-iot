import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import HealthCheck from './HealthCheck';
import DeviceList from './DeviceList';
import RelayList from './RelayList';

function Navigation({ serverIp }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (serverIp) {
      navigator.clipboard.writeText(serverIp);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };
  return (
    <nav className="bg-gray-900 text-cyan-300 px-4 py-3 flex gap-6 shadow-md items-center">
      <Link to="/devices" className="hover:text-cyan-400 font-semibold">Devices</Link>
      <Link to="/health" className="hover:text-cyan-400 font-semibold">Health Check</Link>
      <span className="ml-auto text-xs text-cyan-200 bg-gray-800 px-3 py-1 rounded flex items-center gap-2">
        Central Server IP: {serverIp || '...'}
        <button
          className="ml-2 px-2 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-xs"
          onClick={handleCopy}
          disabled={!serverIp}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </span>
    </nav>
  );
}

function App() {
  const [serverIp, setServerIp] = useState('');
  useEffect(() => {
    const backendUrl = window.location.origin.replace(/:\d+$/, ':5000');
    fetch(`${backendUrl}/api/server_info`).then(res => res.json()).then(data => {
      setServerIp(data.ip);
    }).catch(() => setServerIp('Error'));
  }, []);
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-cyan-900 flex flex-col">
        <Navigation serverIp={serverIp} />
        <div className="flex-1 flex flex-col items-center justify-start py-8">
          <Routes>
            <Route path="/devices" element={<DeviceList />} />
            <Route path="/devices/:deviceId/relays" element={<RelayList />} />
            <Route path="/health" element={<HealthCheck />} />
            <Route path="*" element={<DeviceList />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App; 
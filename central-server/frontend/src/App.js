import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import HealthCheck from './HealthCheck';
import DeviceList from './DeviceList';

function RelayList() {
  const { deviceId } = useParams();
  return <div className="p-4 text-white">Relay List Page for Device ID: {deviceId} (to be implemented)</div>;
}

function Navigation() {
  return (
    <nav className="bg-gray-900 text-cyan-300 px-4 py-3 flex gap-6 shadow-md">
      <Link to="/devices" className="hover:text-cyan-400 font-semibold">Devices</Link>
      <Link to="/health" className="hover:text-cyan-400 font-semibold">Health Check</Link>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-cyan-900 flex flex-col">
        <Navigation />
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
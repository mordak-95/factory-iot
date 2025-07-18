import React from 'react';
import HealthCheck from './HealthCheck';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-cyan-900 flex flex-col items-center justify-start py-8">
      <header className="w-full max-w-2xl mb-8">
        <h1 className="text-4xl font-extrabold text-cyan-400 tracking-tight text-center drop-shadow-lg">Factory IoT Central Server</h1>
        <p className="text-gray-300 text-center mt-2">Monitor and manage your IoT infrastructure in real time</p>
      </header>
      <HealthCheck />
    </div>
  );
}

export default App; 
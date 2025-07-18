import React from 'react';

const Header = ({ lastUpdate }) => {
  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString();
  };

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-xl">🏭</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Factory IoT</h1>
              <p className="text-blue-200 text-sm">Industrial IoT Management System</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <nav className="hidden md:flex space-x-6">
              <a href="#dashboard" className="hover:text-blue-200 transition-colors">Dashboard</a>
              <a href="#devices" className="hover:text-blue-200 transition-colors">Devices</a>
              <a href="#analytics" className="hover:text-blue-200 transition-colors">Analytics</a>
              <a href="#settings" className="hover:text-blue-200 transition-colors">Settings</a>
            </nav>
            
            {lastUpdate && (
              <div className="flex items-center space-x-2 bg-blue-700 px-3 py-2 rounded-lg">
                <span className="text-blue-200 text-sm">Last Update:</span>
                <span className="text-white font-medium text-sm">{formatTime(lastUpdate)}</span>
              </div>
            )}
            
            <button className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors">
              Login
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 
import React from 'react';

const Header = ({ lastUpdate }) => {
  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString();
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-bold text-white">Central IoT Server</h1>
            <p className="text-gray-400 text-sm">Device Management System</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {lastUpdate && (
            <div className="flex items-center space-x-2 bg-gray-700 px-3 py-2 rounded-lg">
              <span className="text-gray-300 text-sm">Last Update:</span>
              <span className="text-white font-medium text-sm">{formatTime(lastUpdate)}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 
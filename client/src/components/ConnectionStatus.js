import React from 'react';

const ConnectionStatus = ({ isConnected, lastUpdate }) => {
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg border ${
        isConnected 
          ? 'bg-green-900/50 border-green-500 text-green-400' 
          : 'bg-red-900/50 border-red-500 text-red-400'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-400' : 'bg-red-400'
        } animate-pulse`}></div>
        <span className="text-sm font-medium">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        {lastUpdate && (
          <span className="text-xs opacity-75">
            {new Date(lastUpdate).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus; 
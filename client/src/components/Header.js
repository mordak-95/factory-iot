import React from 'react';
import './Header.css';

const Header = ({ lastUpdate }) => {
  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString();
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-title">🏭 Factory IoT</h1>
          <p className="header-subtitle">Industrial IoT Management System</p>
        </div>
        <div className="header-right">
          {lastUpdate && (
            <div className="last-update">
              <span className="update-label">Last Update:</span>
              <span className="update-time">{formatTime(lastUpdate)}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 
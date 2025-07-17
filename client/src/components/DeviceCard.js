import React, { useState } from 'react';
import './DeviceCard.css';

const DeviceCard = ({ device, onUpdateValue, onUpdateStatus, onRelayControl, isRelay }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newValue, setNewValue] = useState(device.value);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#4ade80';
      case 'inactive': return '#f87171';
      case 'error': return '#fbbf24';
      case 'maintenance': return '#60a5fa';
      default: return '#a0a0a0';
    }
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'temperature': return '🌡️';
      case 'humidity': return '💧';
      case 'conveyor': return '🔄';
      case 'pressure': return '📊';
      case 'level': return '📈';
      case 'relay': return '🔌';
      default: return '📡';
    }
  };

  const handleValueUpdate = () => {
    onUpdateValue(device.id, newValue);
    setIsEditing(false);
  };

  const handleStatusChange = (newStatus) => {
    onUpdateStatus(device.id, newStatus);
  };

  const formatLastUpdate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="device-card">
      <div className="device-header">
        <div className="device-icon">{getDeviceIcon(device.type)}</div>
        <div className="device-info">
          <h3 className="device-name">{device.name}</h3>
          <p className="device-id">ID: {device.id}</p>
        </div>
        <div 
          className="device-status"
          style={{ backgroundColor: getStatusColor(device.status) }}
        >
          {device.status}
        </div>
      </div>

      <div className="device-body">
        {isRelay ? (
          <div className="device-value-section">
            <label className="value-label">Relay Control:</label>
            <div className="value-display">
              <span className="value-number">{device.value}</span>
            </div>
            <div className="value-actions">
              <button
                className="btn-save"
                onClick={() => onRelayControl('on')}
                disabled={device.value === 'ON'}
              >
                Turn ON
              </button>
              <button
                className="btn-cancel"
                onClick={() => onRelayControl('off')}
                disabled={device.value === 'OFF'}
              >
                Turn OFF
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="device-value-section">
              <label className="value-label">Current Value:</label>
              {isEditing ? (
                <div className="value-edit">
                  <input
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="value-input"
                    step="0.1"
                  />
                  <div className="value-actions">
                    <button 
                      onClick={handleValueUpdate}
                      className="btn-save"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="btn-cancel"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="value-display">
                  <span className="value-number">{device.value}</span>
                  <span className="value-unit">{device.unit}</span>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="btn-edit"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            <div className="device-controls">
              <label className="control-label">Status Control:</label>
              <div className="status-buttons">
                {['active', 'inactive', 'maintenance', 'error'].map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`status-btn ${device.status === status ? 'active' : ''}`}
                    style={{
                      backgroundColor: device.status === status ? getStatusColor(status) : '#3a3a3a'
                    }}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        <div className="device-footer">
          <span className="last-update">
            {device.last_update && <>Last Update: {formatLastUpdate(device.last_update)}</>}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DeviceCard; 
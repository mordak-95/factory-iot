import React from 'react';
import './SystemStats.css';

const SystemStats = ({ stats }) => {
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProgressColor = (percent) => {
    if (percent < 50) return '#4ade80';
    if (percent < 80) return '#fbbf24';
    return '#f87171';
  };

  const ProgressBar = ({ value, max, label, unit = '%' }) => (
    <div className="progress-item">
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        <span className="progress-value">
          {value}{unit}
        </span>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ 
            width: `${(value / max) * 100}%`,
            backgroundColor: getProgressColor((value / max) * 100)
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="system-stats">
      <div className="stats-grid">
        <div className="stat-card">
          <h3 className="stat-title">🖥️ CPU</h3>
          <div className="stat-content">
            <div className="stat-main">
              <span className="stat-number">{stats.cpu.percent.toFixed(1)}%</span>
              <span className="stat-unit">Usage</span>
            </div>
            <div className="stat-details">
              <p>Cores: {stats.cpu.count}</p>
              {stats.cpu.frequency && (
                <p>Freq: {(stats.cpu.frequency.current / 1000).toFixed(1)} GHz</p>
              )}
            </div>
          </div>
          <ProgressBar 
            value={stats.cpu.percent} 
            max={100} 
            label="CPU Usage" 
          />
        </div>

        <div className="stat-card">
          <h3 className="stat-title">💾 Memory</h3>
          <div className="stat-content">
            <div className="stat-main">
              <span className="stat-number">{stats.memory.percent.toFixed(1)}%</span>
              <span className="stat-unit">Used</span>
            </div>
            <div className="stat-details">
              <p>Used: {formatBytes(stats.memory.used)}</p>
              <p>Total: {formatBytes(stats.memory.total)}</p>
            </div>
          </div>
          <ProgressBar 
            value={stats.memory.percent} 
            max={100} 
            label="Memory Usage" 
          />
        </div>

        <div className="stat-card">
          <h3 className="stat-title">💿 Disk</h3>
          <div className="stat-content">
            <div className="stat-main">
              <span className="stat-number">{stats.disk.percent.toFixed(1)}%</span>
              <span className="stat-unit">Used</span>
            </div>
            <div className="stat-details">
              <p>Used: {formatBytes(stats.disk.used)}</p>
              <p>Free: {formatBytes(stats.disk.free)}</p>
            </div>
          </div>
          <ProgressBar 
            value={stats.disk.percent} 
            max={100} 
            label="Disk Usage" 
          />
        </div>

        <div className="stat-card">
          <h3 className="stat-title">🌐 Network</h3>
          <div className="stat-content">
            <div className="stat-main">
              <span className="stat-number">-</span>
              <span className="stat-unit">Activity</span>
            </div>
            <div className="stat-details">
              <p>Sent: {formatBytes(stats.network.bytes_sent)}</p>
              <p>Recv: {formatBytes(stats.network.bytes_recv)}</p>
            </div>
          </div>
        </div>

        {/* Chipset Temperature Card */}
        {stats.temperature && stats.temperature.current !== undefined && (
          <div className="stat-card">
            <h3 className="stat-title">🌡️ Chipset Temp</h3>
            <div className="stat-content">
              <div className="stat-main">
                <span className="stat-number">{stats.temperature.current.toFixed(1)}°C</span>
                <span className="stat-unit">{stats.temperature.label || stats.temperature.sensor}</span>
              </div>
              <div className="stat-details">
                {stats.temperature.high !== null && (
                  <p>High: {stats.temperature.high}°C</p>
                )}
                {stats.temperature.critical !== null && (
                  <p>Critical: {stats.temperature.critical}°C</p>
                )}
                <p>Sensor: {stats.temperature.sensor}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="stats-footer">
        <span className="timestamp">
          Last Update: {new Date(stats.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default SystemStats; 
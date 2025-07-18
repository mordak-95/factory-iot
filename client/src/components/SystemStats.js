import React from 'react';

const SystemStats = ({ stats }) => {
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProgressColor = (percent) => {
    if (percent < 50) return 'bg-green-500';
    if (percent < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const ProgressBar = ({ value, max, label, unit = '%' }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">
          {value}{unit}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor((value / max) * 100)}`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );

  const StatCard = ({ title, icon, mainValue, mainUnit, details, progress }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="text-2xl">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold text-gray-900">{mainValue}</span>
          <span className="text-lg text-gray-600">{mainUnit}</span>
        </div>
        
        {details && (
          <div className="space-y-1">
            {details.map((detail, index) => (
              <p key={index} className="text-sm text-gray-600">{detail}</p>
            ))}
          </div>
        )}
        
        {progress && (
          <ProgressBar 
            value={progress.value} 
            max={progress.max} 
            label={progress.label}
            unit={progress.unit}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* CPU Card */}
        <StatCard
          title="CPU"
          icon="🖥️"
          mainValue={stats.cpu.percent.toFixed(1)}
          mainUnit="%"
          details={[
            `Cores: ${stats.cpu.count}`,
            stats.cpu.frequency && `Freq: ${(stats.cpu.frequency.current / 1000).toFixed(1)} GHz`
          ].filter(Boolean)}
          progress={{
            value: stats.cpu.percent,
            max: 100,
            label: "CPU Usage",
            unit: "%"
          }}
        />

        {/* Memory Card */}
        <StatCard
          title="Memory"
          icon="💾"
          mainValue={stats.memory.percent.toFixed(1)}
          mainUnit="%"
          details={[
            `Used: ${formatBytes(stats.memory.used)}`,
            `Total: ${formatBytes(stats.memory.total)}`
          ]}
          progress={{
            value: stats.memory.percent,
            max: 100,
            label: "Memory Usage",
            unit: "%"
          }}
        />

        {/* Disk Card */}
        <StatCard
          title="Disk"
          icon="💿"
          mainValue={stats.disk.percent.toFixed(1)}
          mainUnit="%"
          details={[
            `Used: ${formatBytes(stats.disk.used)}`,
            `Free: ${formatBytes(stats.disk.free)}`
          ]}
          progress={{
            value: stats.disk.percent,
            max: 100,
            label: "Disk Usage",
            unit: "%"
          }}
        />

        {/* Network Card */}
        <StatCard
          title="Network"
          icon="🌐"
          mainValue="-"
          mainUnit=""
          details={[
            `Sent: ${formatBytes(stats.network.bytes_sent)}`,
            `Recv: ${formatBytes(stats.network.bytes_recv)}`
          ]}
        />

        {/* Temperature Card */}
        {stats.temperature && stats.temperature.current !== undefined && (
          <StatCard
            title="Chipset Temp"
            icon="🌡️"
            mainValue={stats.temperature.current.toFixed(1)}
            mainUnit="°C"
            details={[
              stats.temperature.high !== null && `High: ${stats.temperature.high}°C`,
              stats.temperature.critical !== null && `Critical: ${stats.temperature.critical}°C`,
              `Sensor: ${stats.temperature.sensor}`
            ].filter(Boolean)}
          />
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <span className="text-sm text-gray-600">
          Last Update: {new Date(stats.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default SystemStats; 
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
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-gray-300">{label}</span>
        <span className="text-xs text-gray-400">
          {value}{unit}
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1">
        <div 
          className={`h-1 rounded-full transition-all duration-300 ${getProgressColor((value / max) * 100)}`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );

  const StatCard = ({ title, icon, mainValue, mainUnit, details, progress }) => (
    <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3">
      <div className="flex items-center space-x-2 mb-2">
        <div className="text-sm">{icon}</div>
        <h3 className="text-xs font-semibold text-white">{title}</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-baseline space-x-1">
          <span className="text-lg font-bold text-white">{mainValue}</span>
          <span className="text-xs text-gray-400">{mainUnit}</span>
        </div>
        
        {details && (
          <div className="space-y-0.5">
            {details.map((detail, index) => (
              <p key={index} className="text-xs text-gray-400">{detail}</p>
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
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* CPU Card */}
        <StatCard
          title="CPU"
          icon="🖥️"
          mainValue={stats.cpu.percent.toFixed(1)}
          mainUnit="%"
          details={[
            `Cores: ${stats.cpu.count}`
          ]}
          progress={{
            value: stats.cpu.percent,
            max: 100,
            label: "Usage",
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
            `Used: ${formatBytes(stats.memory.used)}`
          ]}
          progress={{
            value: stats.memory.percent,
            max: 100,
            label: "Usage",
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
            `Used: ${formatBytes(stats.disk.used)}`
          ]}
          progress={{
            value: stats.disk.percent,
            max: 100,
            label: "Usage",
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
            title="Temp"
            icon="🌡️"
            mainValue={stats.temperature.current.toFixed(1)}
            mainUnit="°C"
            details={[
              `Sensor: ${stats.temperature.sensor}`
            ]}
          />
        )}

        {/* Timestamp */}
        <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">Last Update</div>
            <div className="text-xs text-white">
              {new Date(stats.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStats; 
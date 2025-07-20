import React, { useEffect, useState } from 'react';
import { Activity, Database, Server, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

function HealthCheck() {
  const [status, setStatus] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const backendUrl = window.location.origin.replace(/:\d+$/, ':5000');
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${backendUrl}/health`);
        const data = await res.json();
        setStatus(data);
      } catch (err) {
        setError('Failed to fetch health status');
      } finally {
        setLoading(false);
      }
    };
    const fetchModelStatus = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/model_status`);
        const data = await res.json();
        setModelStatus(data);
      } catch (err) {
        setModelStatus({ error: 'Failed to fetch model status' });
      }
    };
    fetchStatus();
    fetchModelStatus();
  }, []);

  const StatusCard = ({ title, icon: Icon, status, details, isError = false }) => (
    <div className={`bg-gray-800 border rounded-lg p-4 ${isError ? 'border-red-500' : 'border-gray-700'}`}>
      <div className="flex items-center space-x-3 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isError ? 'bg-red-600' : 'bg-gray-600'
        }`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          {status ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
          <span className={`text-sm font-medium ${
            status ? 'text-green-400' : 'text-red-400'
          }`}>
            {status ? 'Healthy' : 'Unhealthy'}
          </span>
        </div>
        
        {details && (
          <div className="text-sm text-gray-400">
            {details}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Checking system health...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">System Health Check</h1>
              <p className="text-gray-400">Monitor backend services and database status</p>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Health Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Backend Status */}
          <StatusCard
            title="Backend Service"
            icon={Server}
            status={status?.status === 'ok'}
            details={status ? `Status: ${status.status}` : 'Service unavailable'}
            isError={!status || status.status !== 'ok'}
          />

          {/* Database Status */}
          <StatusCard
            title="Database"
            icon={Database}
            status={status?.db === 'connected'}
            details={status ? `Database: ${status.db}` : 'Database connection failed'}
            isError={!status || status.db !== 'connected'}
          />
        </div>

        {/* Model Status */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">Database Models</h2>
          </div>
          
          {modelStatus ? (
            modelStatus.error ? (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                {modelStatus.error}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  {modelStatus.all_ok ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                  )}
                  <span className={`font-medium ${
                    modelStatus.all_ok ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {modelStatus.all_ok ? 'All models/tables are created.' : 'Some tables are missing!'}
                  </span>
                </div>
                
                {!modelStatus.all_ok && (
                  <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
                    <h3 className="text-yellow-300 font-medium mb-2">Missing Tables:</h3>
                    <ul className="space-y-1">
                      {Object.entries(modelStatus.tables).map(([table, exists]) =>
                        !exists ? (
                          <li key={table} className="flex items-center space-x-2 text-yellow-200">
                            <XCircle className="w-4 h-4" />
                            <span>{table}</span>
                          </li>
                        ) : null
                      )}
                    </ul>
                  </div>
                )}
                
                {modelStatus.all_ok && (
                  <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-green-300">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">All database tables are properly configured</span>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-400">Checking model status...</span>
            </div>
          )}
        </div>

        {/* System Information */}
        {status && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">System Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Backend Status</p>
                <p className="text-white font-medium">{status.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Database Connection</p>
                <p className="text-white font-medium">{status.db}</p>
              </div>
              {status.timestamp && (
                <div>
                  <p className="text-sm text-gray-400">Last Check</p>
                  <p className="text-white font-medium">
                    {new Date(status.timestamp).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HealthCheck; 
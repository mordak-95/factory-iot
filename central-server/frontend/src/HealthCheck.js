import React, { useEffect, useState } from 'react';
import { Activity, Database, Server, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

function HealthCheck({ isDarkMode }) {
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
    <div className={`border rounded-lg p-4 transition-colors duration-200 ${
      isDarkMode 
        ? `bg-gray-800 ${isError ? 'border-red-500' : 'border-gray-700'}`
        : `bg-white ${isError ? 'border-red-500' : 'border-gray-200'}`
    }`}>
      <div className="flex items-center space-x-3 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isError ? 'bg-red-600' : (isDarkMode ? 'bg-gray-600' : 'bg-gray-200')
        }`}>
          <Icon className={`w-4 h-4 ${
            isDarkMode ? 'text-white' : 'text-gray-700'
          }`} />
        </div>
        <h3 className={`text-lg font-semibold transition-colors duration-200 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>{title}</h3>
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
          <div className={`text-sm transition-colors duration-200 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
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
          <p className={`transition-colors duration-200 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>Checking system health...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className={`border rounded-lg p-6 transition-colors duration-200 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold transition-colors duration-200 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>System Health Check</h1>
              <p className={`transition-colors duration-200 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Monitor backend services and database status</p>
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

          {/* Model Status */}
          <StatusCard
            title="Database Models"
            icon={Database}
            status={modelStatus?.all_ok}
            details={modelStatus ? 
              (modelStatus.all_ok ? 'All models/tables are created' : 'Some tables are missing') : 
              'Model status unavailable'
            }
            isError={!modelStatus || !modelStatus.all_ok}
          />
        </div>



        {/* System Information */}
        {status && (
          <div className={`border rounded-lg p-6 transition-colors duration-200 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 transition-colors duration-200 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>System Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className={`text-sm transition-colors duration-200 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Backend Status</p>
                <p className={`font-medium transition-colors duration-200 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{status.status}</p>
              </div>
              <div>
                <p className={`text-sm transition-colors duration-200 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Database Connection</p>
                <p className={`font-medium transition-colors duration-200 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{status.db}</p>
              </div>
              {status.timestamp && (
                <div>
                  <p className={`text-sm transition-colors duration-200 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Last Check</p>
                  <p className={`font-medium transition-colors duration-200 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
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
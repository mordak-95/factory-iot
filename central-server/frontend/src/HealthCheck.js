import React, { useEffect, useState } from 'react';

function HealthCheck() {
  const [status, setStatus] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const res = await fetch('/health');
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
        const res = await fetch('/api/model_status');
        const data = await res.json();
        setModelStatus(data);
      } catch (err) {
        setModelStatus({ error: 'Failed to fetch model status' });
      }
    };
    fetchStatus();
    fetchModelStatus();
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-cyan-300 mb-4">Backend Health</h2>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : status ? (
        <div>
          <p className="text-green-400">Status: {status.status}</p>
          <p className="text-green-400">Database: {status.db}</p>
        </div>
      ) : null}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-cyan-200 mb-2">Model Status</h3>
        {modelStatus ? (
          modelStatus.error ? (
            <p className="text-red-400">{modelStatus.error}</p>
          ) : (
            <div>
              <p className={modelStatus.all_ok ? "text-green-400" : "text-yellow-400"}>
                {modelStatus.all_ok ? 'All models/tables are created.' : 'Some tables are missing!'}
              </p>
              {!modelStatus.all_ok && (
                <ul className="list-disc list-inside text-yellow-300">
                  {Object.entries(modelStatus.tables).map(([table, exists]) =>
                    !exists ? <li key={table}>{table} is missing</li> : null
                  )}
                </ul>
              )}
            </div>
          )
        ) : (
          <p className="text-gray-400">Checking model status...</p>
        )}
      </div>
    </div>
  );
}

export default HealthCheck; 
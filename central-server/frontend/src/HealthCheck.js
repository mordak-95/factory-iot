import React, { useEffect, useState } from 'react';

function HealthCheck() {
  const [status, setStatus] = useState('loading');
  const [dbStatus, setDbStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const backendUrl = window.location.origin.replace(/:\d+$/, ':5000');
    fetch(`${backendUrl}/health`)
      .then(res => res.json())
      .then(data => {
        setStatus(data.status);
        setDbStatus(data.db);
        setError(data.error || '');
      })
      .catch(err => {
        setStatus('error');
        setDbStatus('unreachable');
        setError(err.message);
      });
  }, []);

  const statusColor = status === 'ok' ? 'text-green-500' : status === 'loading' ? 'text-yellow-500' : 'text-red-500';
  const dbColor = dbStatus === 'ok' ? 'text-green-500' : dbStatus === 'unreachable' ? 'text-red-500' : 'text-yellow-500';

  return (
    <div className="bg-gray-800 border-l-4 border-cyan-400 shadow-lg rounded-xl p-6 max-w-md mx-auto my-8 text-white font-sans">
      <h2 className="text-2xl font-bold mb-4 tracking-wide">Health Check</h2>
      <p className="mb-2">Backend status: <b className={statusColor}>{status}</b></p>
      <p className="mb-2">Database status: <b className={dbColor}>{dbStatus}</b></p>
      {error && <p className="text-red-400 font-semibold">Error: {error}</p>}
    </div>
  );
}

export default HealthCheck; 
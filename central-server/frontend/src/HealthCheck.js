import React, { useEffect, useState } from 'react';

function HealthCheck() {
  const [status, setStatus] = useState('loading');
  const [dbStatus, setDbStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/health')
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

  return (
    <div style={{border: '1px solid #ccc', padding: 16, borderRadius: 8, maxWidth: 400}}>
      <h2>Health Check</h2>
      <p>Backend status: <b>{status}</b></p>
      <p>Database status: <b>{dbStatus}</b></p>
      {error && <p style={{color: 'red'}}>Error: {error}</p>}
    </div>
  );
}

export default HealthCheck; 
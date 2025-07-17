import React, { useEffect, useState } from 'react';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function App() {
  const [raspberries, setRaspberries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/raspberries`)
      .then(res => res.json())
      .then(data => {
        setRaspberries(data.raspberries || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch data');
        setLoading(false);
      });
  }, []);

  return (
    <div className="App">
      <h1>Factory IoT Central Dashboard</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{color:'red'}}>{error}</p>}
      <div className="raspberry-list">
        {raspberries.map(r => (
          <div key={r._id} className="raspberry-card">
            <h2>{r.name} <span style={{fontSize:12, color:'#888'}}>({r._id})</span></h2>
            <p><b>Location:</b> {r.location || '-'}</p>
            <p><b>IP:</b> {r.ip || '-'}</p>
            <p><b>Last Seen:</b> {r.last_seen ? new Date(r.last_seen).toLocaleString() : '-'}</p>
            <h3>Relays</h3>
            <ul>
              {(r.relays || []).map(relay => (
                <li key={relay.relay_id}>
                  <b>{relay.name || relay.relay_id}</b> (Pin: {relay.bcm_pin}) - Status: <span style={{color: relay.status === 'on' ? 'green' : 'red'}}>{relay.status}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App; 
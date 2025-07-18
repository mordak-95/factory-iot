const config = {
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  WS_BASE_URL: process.env.REACT_APP_WS_URL || 'ws://localhost:5000',
  POLLING_INTERVAL: 30000, // 30 seconds
  RECONNECT_DELAY: 5000, // 5 seconds
};

export default config; 
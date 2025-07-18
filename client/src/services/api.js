import config from '../config';

class ApiService {
  constructor() {
    this.baseURL = config.API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Get system statistics
  async getSystemStats() {
    return this.request('/api/stats');
  }

  // Get all devices
  async getDevices() {
    return this.request('/api/devices');
  }

  // Get single device by ID
  async getDevice(id) {
    return this.request(`/api/devices/${id}`);
  }

  // Update device status
  async updateDeviceStatus(id, status) {
    return this.request(`/api/devices/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Get device sensor data
  async getDeviceData(id) {
    return this.request(`/api/devices/${id}/data`);
  }

  // Get alerts
  async getAlerts() {
    return this.request('/api/alerts');
  }

  // Get system health
  async getSystemHealth() {
    return this.request('/api/health');
  }

  // WebSocket connection for real-time updates
  connectWebSocket(onMessage) {
    const wsUrl = config.WS_BASE_URL + '/ws';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after delay
      setTimeout(() => {
        this.connectWebSocket(onMessage);
      }, config.RECONNECT_DELAY);
    };

    return ws;
  }
}

const apiService = new ApiService();
export default apiService; 
import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import config from '../config';

export const useApiData = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let result;
      switch (endpoint) {
        case 'stats':
          result = await apiService.getSystemStats();
          break;
        case 'devices':
          result = await apiService.getDevices();
          break;
        case 'alerts':
          result = await apiService.getAlerts();
          break;
        case 'health':
          result = await apiService.getSystemHealth();
          break;
        default:
          throw new Error(`Unknown endpoint: ${endpoint}`);
      }
      
      setData(result);
    } catch (err) {
      setError(err.message);
      console.error(`Error fetching ${endpoint}:`, err);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
    
    // Set up polling if enabled
    let interval;
    if (options.polling && options.interval) {
      interval = setInterval(fetchData, options.interval);
    } else if (options.polling) {
      // Use default polling interval from config
      interval = setInterval(fetchData, config.POLLING_INTERVAL);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchData, options.polling, options.interval]);

  return { data, loading, error, refetch: fetchData };
};

export const useWebSocket = (onMessage) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    const handleMessage = (data) => {
      setLastMessage(data);
      if (onMessage) {
        onMessage(data);
      }
    };

    const ws = apiService.connectWebSocket(handleMessage);
    
    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [onMessage]);

  return { isConnected, lastMessage };
};

export const useRealTimeData = () => {
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState({});
  const [alerts, setAlerts] = useState([]);

  // Initial data fetch with polling as fallback
  const { data: initialDevices, loading: devicesLoading } = useApiData('devices', { polling: true });
  const { data: initialStats, loading: statsLoading } = useApiData('stats', { polling: true });
  const { data: initialAlerts, loading: alertsLoading } = useApiData('alerts', { polling: true });

  // WebSocket for real-time updates
  const { isConnected } = useWebSocket((data) => {
    if (data.type === 'device_update') {
      setDevices(prevDevices => 
        prevDevices.map(device => 
          device.id === data.device.id ? data.device : device
        )
      );
    } else if (data.type === 'stats_update') {
      setStats(data.stats);
    } else if (data.type === 'alert_update') {
      setAlerts(data.alerts);
    }
  });

  // Update state when initial data is loaded
  useEffect(() => {
    if (initialDevices) setDevices(initialDevices);
  }, [initialDevices]);

  useEffect(() => {
    if (initialStats) setStats(initialStats);
  }, [initialStats]);

  useEffect(() => {
    if (initialAlerts) setAlerts(initialAlerts);
  }, [initialAlerts]);

  const loading = devicesLoading || statsLoading || alertsLoading;

  return {
    devices,
    stats,
    alerts,
    loading,
    isConnected,
    updateDevice: async (id, updates) => {
      try {
        await apiService.updateDeviceStatus(id, updates.status);
        // Optimistic update
        setDevices(prevDevices =>
          prevDevices.map(device =>
            device.id === id ? { ...device, ...updates } : device
          )
        );
      } catch (error) {
        console.error('Error updating device:', error);
        // Revert optimistic update on error
        const { data: refreshedDevices } = await apiService.getDevices();
        setDevices(refreshedDevices);
      }
    }
  };
}; 
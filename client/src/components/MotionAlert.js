import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Bell } from 'lucide-react';

const MotionAlert = ({ isVisible, onClose, alert }) => {
  if (!isVisible || !alert) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-red-600 border border-red-700 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">
              Motion Detected!
            </p>
            <p className="text-sm text-red-100 mt-1">
              {alert.message}
            </p>
            <p className="text-xs text-red-200 mt-2">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={onClose}
              className="text-red-200 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MotionAlertManager = () => {
  const [alerts, setAlerts] = useState([]);
  const [visibleAlerts, setVisibleAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 2000); // Check for new alerts every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/motion_alerts`);
      if (response.ok) {
        const data = await response.json();
        const newAlerts = data.alerts || [];
        
        // Check for new alerts
        const newAlertIds = newAlerts.map(a => a.id);
        const currentAlertIds = alerts.map(a => a.id);
        const newAlertsOnly = newAlerts.filter(a => !currentAlertIds.includes(a.id));
        
        if (newAlertsOnly.length > 0) {
          setAlerts(newAlerts);
          // Show new alerts
          newAlertsOnly.forEach(alert => {
            showAlert(alert);
          });
        }
        
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (err) {
      console.error('Error fetching motion alerts:', err);
      setIsConnected(false);
    }
  };

  const showAlert = (alert) => {
    // Add alert to visible alerts
    setVisibleAlerts(prev => [...prev, alert]);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      hideAlert(alert.id);
    }, 10000);
  };

  const hideAlert = (alertId) => {
    setVisibleAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const clearAllAlerts = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/motion_alerts/clear`, { method: 'POST' });
      setAlerts([]);
      setVisibleAlerts([]);
    } catch (err) {
      console.error('Error clearing alerts:', err);
    }
  };

  if (!isConnected) return null;

  return (
    <>
      {/* Alert Bell Icon with Count */}
      {alerts.length > 0 && (
        <div className="fixed top-4 left-4 z-40">
          <div className="relative">
            <button
              onClick={clearAllAlerts}
              className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-colors"
              title={`${alerts.length} motion alerts - Click to clear all`}
            >
              <Bell className="h-5 w-5" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-red-600 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {alerts.length > 99 ? '99+' : alerts.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Motion Alerts */}
      {visibleAlerts.map(alert => (
        <MotionAlert
          key={alert.id}
          isVisible={true}
          onClose={() => hideAlert(alert.id)}
          alert={alert}
        />
      ))}
    </>
  );
};

export default MotionAlertManager;

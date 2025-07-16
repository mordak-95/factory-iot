#!/usr/bin/env python3
"""
Factory IoT Backend
A Flask-based REST API for factory IoT management
"""

import os
import json
import psutil
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load configuration
def load_config():
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'settings.json')
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {
            "backend": {
                "port": 5000,
                "host": "0.0.0.0",
                "debug": False
            }
        }

config = load_config()

# Sample IoT data
iot_devices = {
    "sensor_001": {
        "id": "sensor_001",
        "name": "Temperature Sensor 1",
        "type": "temperature",
        "value": 25.5,
        "unit": "°C",
        "status": "active",
        "last_update": datetime.now().isoformat()
    },
    "sensor_002": {
        "id": "sensor_002",
        "name": "Humidity Sensor 1",
        "type": "humidity",
        "value": 60.2,
        "unit": "%",
        "status": "active",
        "last_update": datetime.now().isoformat()
    },
    "actuator_001": {
        "id": "actuator_001",
        "name": "Conveyor Belt 1",
        "type": "conveyor",
        "value": "running",
        "unit": "status",
        "status": "active",
        "last_update": datetime.now().isoformat()
    }
}

@app.route('/')
def index():
    """Root endpoint"""
    return jsonify({
        "message": "Factory IoT Backend API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/health')
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "system": {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage('/').percent
        }
    })

@app.route('/api/devices')
def get_devices():
    """Get all IoT devices"""
    return jsonify({
        "devices": list(iot_devices.values()),
        "count": len(iot_devices),
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/devices/<device_id>')
def get_device(device_id):
    """Get specific device by ID"""
    if device_id in iot_devices:
        return jsonify(iot_devices[device_id])
    else:
        return jsonify({"error": "Device not found"}), 404

@app.route('/api/devices/<device_id>/value', methods=['POST'])
def update_device_value(device_id):
    """Update device value"""
    if device_id not in iot_devices:
        return jsonify({"error": "Device not found"}), 404
    
    data = request.get_json()
    if not data or 'value' not in data:
        return jsonify({"error": "Value is required"}), 400
    
    iot_devices[device_id]['value'] = data['value']
    iot_devices[device_id]['last_update'] = datetime.now().isoformat()
    
    return jsonify({
        "message": "Device value updated",
        "device": iot_devices[device_id]
    })

@app.route('/api/devices/<device_id>/status', methods=['POST'])
def update_device_status(device_id):
    """Update device status"""
    if device_id not in iot_devices:
        return jsonify({"error": "Device not found"}), 404
    
    data = request.get_json()
    if not data or 'status' not in data:
        return jsonify({"error": "Status is required"}), 400
    
    valid_statuses = ['active', 'inactive', 'error', 'maintenance']
    if data['status'] not in valid_statuses:
        return jsonify({"error": f"Invalid status. Must be one of: {valid_statuses}"}), 400
    
    iot_devices[device_id]['status'] = data['status']
    iot_devices[device_id]['last_update'] = datetime.now().isoformat()
    
    return jsonify({
        "message": "Device status updated",
        "device": iot_devices[device_id]
    })

@app.route('/api/system/stats')
def system_stats():
    """Get system statistics"""
    return jsonify({
        "cpu": {
            "percent": psutil.cpu_percent(interval=1),
            "count": psutil.cpu_count(),
            "frequency": psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None
        },
        "memory": {
            "total": psutil.virtual_memory().total,
            "available": psutil.virtual_memory().available,
            "percent": psutil.virtual_memory().percent,
            "used": psutil.virtual_memory().used
        },
        "disk": {
            "total": psutil.disk_usage('/').total,
            "used": psutil.disk_usage('/').used,
            "free": psutil.disk_usage('/').free,
            "percent": psutil.disk_usage('/').percent
        },
        "network": {
            "bytes_sent": psutil.net_io_counters().bytes_sent,
            "bytes_recv": psutil.net_io_counters().bytes_recv
        },
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/config')
def get_config():
    """Get current configuration"""
    return jsonify(config)

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    port = config.get('backend', {}).get('port', 5000)
    host = config.get('backend', {}).get('host', '0.0.0.0')
    debug = config.get('backend', {}).get('debug', False)
    
    print(f"Starting Factory IoT Backend on {host}:{port}")
    app.run(host=host, port=port, debug=debug) 
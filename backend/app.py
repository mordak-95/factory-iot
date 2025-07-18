#!/usr/bin/env python3
"""
Factory IoT Backend
A Flask-based REST API for factory IoT management
"""

import os
import json
import psutil
import time
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from threading import Thread
import requests
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)

# Load .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))
DEVICE_ID = os.getenv('DEVICE_ID')
DEVICE_TOKEN = os.getenv('DEVICE_TOKEN')
CENTRAL_SERVER_URL = os.getenv('CENTRAL_SERVER_URL', 'http://localhost:5000')
RELAY_CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'relay_config.json')
SYNC_INTERVAL = 30

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

try:
    from gpiozero import OutputDevice
    RELAY_ENABLED = True
except ImportError:
    RELAY_ENABLED = False
    OutputDevice = None

# Relay management
relay_objs = {}
relay_defs = []

def load_relay_config():
    global relay_defs, relay_objs
    try:
        with open(RELAY_CONFIG_PATH, 'r') as f:
            relay_defs = json.load(f)
    except Exception:
        relay_defs = []
    # (Re)initialize relay objects
    if RELAY_ENABLED:
        relay_objs = {}
        for r in relay_defs:
            relay_objs[str(r['id'])] = OutputDevice(r['gpio_pin'])
            # Sync relay state with status
            if r.get('status'):
                relay_objs[str(r['id'])].on()
            else:
                relay_objs[str(r['id'])].off()
    print(f"[backend] Loaded relay config: {relay_defs}")

def sync_relay_config():
    if not DEVICE_ID or not DEVICE_TOKEN:
        print('[backend] DEVICE_ID and DEVICE_TOKEN not set, skipping sync.')
        return
    url = f"{CENTRAL_SERVER_URL}/api/devices/{DEVICE_ID}/relays/config"
    headers = {'X-Device-Token': DEVICE_TOKEN}
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            with open(RELAY_CONFIG_PATH, 'w') as f:
                json.dump(data['relays'], f, indent=2)
            print(f"[backend] Synced relay config from central server.")
            load_relay_config()
        else:
            print(f"[backend] Failed to sync relay config: {resp.status_code} {resp.text}")
    except Exception as e:
        print(f"[backend] Exception syncing relay config: {e}")

def update_central_status(relay_id, status):
    if not DEVICE_ID or not DEVICE_TOKEN:
        print('[backend] DEVICE_ID and DEVICE_TOKEN not set, cannot update central.')
        return
    url = f"{CENTRAL_SERVER_URL}/api/relays/{relay_id}/status"
    headers = {'Content-Type': 'application/json', 'X-Device-Token': DEVICE_TOKEN}
    data = {'status': status}
    try:
        resp = requests.put(url, headers=headers, json=data, timeout=10)
        if resp.status_code == 200:
            print(f"[backend] Updated relay {relay_id} status to {status} in central server.")
        else:
            print(f"[backend] Failed to update relay {relay_id} status: {resp.status_code} {resp.text}")
    except Exception as e:
        print(f"[backend] Exception updating relay status: {e}")

def periodic_sync():
    while True:
        sync_relay_config()
        time.sleep(SYNC_INTERVAL)

# Start periodic sync in background
Thread(target=periodic_sync, daemon=True).start()
load_relay_config()

# تعریف پین‌های رله (BCM)
# RELAY_PINS = {
#     "relay1": 17,  # GPIO17
#     "relay2": 27,  # GPIO27
#     "relay3": 22   # GPIO22
# }

# نگهداری آبجکت‌های رله
# relays = {}
# if RELAY_ENABLED:
#     for relay_id, pin in RELAY_PINS.items():
#         relays[relay_id] = OutputDevice(pin)

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
    # Get temperatures (chipset/CPU)
    temps = None
    try:
        temp_data = psutil.sensors_temperatures()
        if temp_data:
            # Pick the first available sensor and its first value
            for sensor_name, entries in temp_data.items():
                if entries:
                    temps = {
                        'sensor': sensor_name,
                        'label': entries[0].label,
                        'current': entries[0].current,
                        'high': entries[0].high,
                        'critical': entries[0].critical
                    }
                    break
    except Exception:
        temps = None

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
        "temperature": temps,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/config')
def get_config():
    """Get current configuration"""
    return jsonify(config)

@app.route('/api/relays', methods=['GET'])
def get_relays():
    """لیست رله‌ها و وضعیت فعلی آن‌ها"""
    if not RELAY_ENABLED:
        return jsonify({"error": "Relay control not available on this system."}), 501
    status = {}
    for r in relay_defs:
        relay_id = r['id']
        obj = relay_objs.get(str(relay_id))
        status[str(relay_id)] = obj.value if obj else False
    return jsonify({"relays": status})

@app.route('/api/relays/<relay_id>', methods=['POST'])
def control_relay(relay_id):
    """روشن یا خاموش کردن رله مشخص شده"""
    if not RELAY_ENABLED:
        return jsonify({"error": "Relay control not available on this system."}), 501
    relay_def = next((r for r in relay_defs if str(r['id']) == str(relay_id)), None)
    if not relay_def or str(relay_id) not in relay_objs:
        return jsonify({"error": "Relay not found"}), 404
    data = request.get_json()
    if not data or "action" not in data:
        return jsonify({"error": "Missing 'action' in request body"}), 400
    action = data["action"].lower()
    relay = relay_objs[str(relay_id)]
    if action == "on":
        relay.on()
        update_central_status(relay_id, True)
        return jsonify({"status": f"{relay_id} turned on"}), 200
    elif action == "off":
        relay.off()
        update_central_status(relay_id, False)
        return jsonify({"status": f"{relay_id} turned off"}), 200
    else:
        return jsonify({"error": "Invalid action, use 'on' or 'off'"}), 400

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
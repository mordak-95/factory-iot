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
MOTION_SENSOR_CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'motion_sensor_config.json')
SYNC_INTERVAL = 5

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
    from gpiozero import OutputDevice, MotionSensor
    RELAY_ENABLED = True
    MOTION_SENSOR_ENABLED = True
    OutputDevice = OutputDevice
    MotionSensor = MotionSensor
except ImportError:
    RELAY_ENABLED = False
    MOTION_SENSOR_ENABLED = False
    OutputDevice = None
    MotionSensor = None

# Relay management
relay_objs = {}
relay_defs = []

# Motion sensor management
motion_sensor_objs = {}
motion_sensor_defs = []
motion_detection_callbacks = []
motion_alerts = []  # Store motion alerts for frontend

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

# Motion sensor management
motion_sensor_objs = {}
motion_sensor_defs = []
motion_detection_callbacks = []

def load_motion_sensor_config():
    global motion_sensor_defs, motion_sensor_objs
    try:
        with open(MOTION_SENSOR_CONFIG_PATH, 'r') as f:
            motion_sensor_defs = json.load(f)
            print(f"[DEBUG] Loaded motion sensor config: {motion_sensor_defs}")
    except Exception as e:
        print(f"[DEBUG] Failed to load motion sensor config: {e}")
        motion_sensor_defs = []
    
    # (Re)initialize motion sensor objects
    if MOTION_SENSOR_ENABLED:
        motion_sensor_objs = {}
        motion_detection_callbacks.clear()
        
        print(f"[DEBUG] Initializing {len(motion_sensor_defs)} motion sensors...")
        
        for ms in motion_sensor_defs:
            if ms.get('is_active', True):
                try:
                    print(f"[DEBUG] Setting up motion sensor {ms['id']} on GPIO {ms['gpio_pin']}")
                    motion_sensor = MotionSensor(ms['gpio_pin'])
                    motion_sensor_objs[str(ms['id'])] = motion_sensor
                    
                    # Set up motion detection callback
                    def create_callback(sensor_id):
                        def callback():
                            print(f"[DEBUG] Motion callback triggered for sensor {sensor_id}")
                            handle_motion_detection(sensor_id)
                        return callback
                    
                    motion_sensor.when_motion = create_callback(ms['id'])
                    motion_detection_callbacks.append(motion_sensor)
                    print(f"[DEBUG] Motion sensor {ms['id']} callback set successfully")
                    
                except Exception as e:
                    print(f"Failed to initialize motion sensor {ms['id']} on GPIO {ms['gpio_pin']}: {e}")
    else:
        print("[DEBUG] Motion sensor control not enabled")

def is_motion_detection_allowed(sensor_config):
    """Check if motion detection is allowed based on time scheduling"""
    if not sensor_config.get('enable_scheduling', False):
        return True
    
    now = datetime.now()
    current_time = now.time()
    current_weekday = now.weekday()  # 0=Monday, 6=Sunday
    
    # Check weekday/weekend monitoring
    is_weekend = current_weekday >= 5  # Saturday or Sunday
    if is_weekend and not sensor_config.get('weekend_monitoring', True):
        return False
    if not is_weekend and not sensor_config.get('weekday_monitoring', True):
        return False
    
    # Check time range
    start_time = sensor_config.get('start_time')
    end_time = sensor_config.get('end_time')
    
    if start_time and end_time:
        # Convert string times to time objects if needed
        if isinstance(start_time, str):
            start_time = datetime.strptime(start_time, '%H:%M').time()
        if isinstance(end_time, str):
            end_time = datetime.strptime(end_time, '%H:%M').time()
        
        # Handle overnight ranges (e.g., 22:00 to 06:00)
        if start_time > end_time:
            return current_time >= start_time or current_time <= end_time
        else:
            return start_time <= current_time <= end_time
    
    return True

def handle_motion_detection(sensor_id):
    """Handle motion detection from GPIO sensor with time scheduling"""
    try:
        print(f"Motion detected on sensor {sensor_id}")
        
        # Find sensor config
        sensor_config = next((s for s in motion_sensor_defs if s['id'] == sensor_id), None)
        if not sensor_config:
            print(f"Sensor config not found for sensor {sensor_id}")
            return
        
        # Always send alert to frontend regardless of scheduling
        send_motion_alert_to_frontend(sensor_id, sensor_config)
        
        # Check if motion detection is allowed based on scheduling for central server reporting
        if not is_motion_detection_allowed(sensor_config):
            print(f"Motion detection not allowed for sensor {sensor_id} at current time (no central server report)")
            return
        
        print(f"Motion detection allowed for sensor {sensor_id}, reporting to central server")
        
        # Report to central server
        report_motion_to_central_server(sensor_id)
        
    except Exception as e:
        print(f"Error handling motion detection: {e}")

def send_motion_alert_to_frontend(sensor_id, sensor_config):
    """Send motion alert to frontend via WebSocket or HTTP endpoint"""
    try:
        # Store motion alert in memory for frontend to fetch
        motion_alerts.append({
            'id': len(motion_alerts) + 1,
            'sensor_id': sensor_id,
            'sensor_name': sensor_config.get('name', f'Sensor {sensor_id}'),
            'timestamp': datetime.now().isoformat(),
            'message': f'Motion detected on {sensor_config.get("name", f"Sensor {sensor_id}")}'
        })
        
        # Keep only last 100 alerts
        if len(motion_alerts) > 100:
            motion_alerts.pop(0)
            
        print(f"Motion alert sent to frontend for sensor {sensor_id}")
        
    except Exception as e:
        print(f"Error sending motion alert to frontend: {e}")

def report_motion_to_central_server(sensor_id):
    """Report motion detection to central server"""
    try:
        url = f"{CENTRAL_SERVER_URL}/api/motion_sensors/{sensor_id}/motion"
        headers = {
            'Content-Type': 'application/json',
            'X-Device-Token': DEVICE_TOKEN
        }
        
        response = requests.post(url, headers=headers, timeout=10)
        if response.status_code == 200:
            print(f"Motion reported to central server for sensor {sensor_id}")
        else:
            print(f"Failed to report motion to central server: {response.status_code}")
            
    except Exception as e:
        print(f"Error reporting motion to central server: {e}")

# Load configurations on startup
load_relay_config()
load_motion_sensor_config()

# Background sync thread
def sync_with_central_server():
    """Background thread to sync with central server"""
    while True:
        try:
            # Sync relay config
            if RELAY_ENABLED:
                sync_relay_config()
            
            # Sync motion sensor config
            if MOTION_SENSOR_ENABLED:
                sync_motion_sensor_config()
                
        except Exception as e:
            print(f"Error in sync thread: {e}")
        
        time.sleep(SYNC_INTERVAL)

def sync_motion_sensor_config():
    """Sync motion sensor configuration with central server"""
    global motion_sensor_defs
    try:
        url = f"{CENTRAL_SERVER_URL}/api/devices/{DEVICE_ID}/motion_sensors/config"
        headers = {'X-Device-Token': DEVICE_TOKEN}
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            new_motion_sensor_defs = data.get('motion_sensors', [])
            
            # Check if config changed
            if new_motion_sensor_defs != motion_sensor_defs:
                print("Motion sensor config changed, updating...")
                motion_sensor_defs = new_motion_sensor_defs
                
                # Save to file
                with open(MOTION_SENSOR_CONFIG_PATH, 'w') as f:
                    json.dump(motion_sensor_defs, f, indent=2)
                
                # Reload motion sensor objects
                load_motion_sensor_config()
                
    except Exception as e:
        print(f"Error syncing motion sensor config: {e}")

# Start background sync thread
if DEVICE_ID and DEVICE_TOKEN:
    sync_thread = Thread(target=sync_with_central_server, daemon=True)
    sync_thread.start()
    print(f"Started sync thread for device {DEVICE_ID}")
else:
    print("Warning: DEVICE_ID or DEVICE_TOKEN not set, sync disabled")

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

# Motion Sensor APIs
@app.route('/api/motion_sensors', methods=['GET'])
def get_motion_sensors():
    """Get list of motion sensors and their current status"""
    if not MOTION_SENSOR_ENABLED:
        return jsonify({"error": "Motion sensor control not available on this system."}), 501
    
    sensors_status = []
    for ms in motion_sensor_defs:
        sensor_obj = motion_sensor_objs.get(str(ms['id']))
        sensors_status.append({
            'id': ms['id'],
            'name': ms['name'],
            'gpio_pin': ms['gpio_pin'],
            'is_active': ms.get('is_active', True),
            'status': 'active' if sensor_obj else 'inactive'
        })
    
    return jsonify({"motion_sensors": sensors_status})

@app.route('/api/motion_sensors/<sensor_id>/status', methods=['GET'])
def get_motion_sensor_status(sensor_id):
    """Get status of a specific motion sensor"""
    if not MOTION_SENSOR_ENABLED:
        return jsonify({"error": "Motion sensor control not available on this system."}), 501
    
    sensor_def = next((ms for ms in motion_sensor_defs if str(ms['id']) == str(sensor_id)), None)
    if not sensor_def:
        return jsonify({"error": "Motion sensor not found"}), 404
    
    sensor_obj = motion_sensor_objs.get(str(sensor_id))
    return jsonify({
        'id': sensor_def['id'],
        'name': sensor_def['name'],
        'gpio_pin': sensor_def['gpio_pin'],
        'is_active': sensor_def.get('is_active', True),
        'status': 'active' if sensor_obj else 'inactive'
    })

@app.route('/api/motion_sensors/<sensor_id>/test', methods=['POST'])
def test_motion_sensor(sensor_id):
    """Test motion sensor by simulating motion detection"""
    if not MOTION_SENSOR_ENABLED:
        return jsonify({"error": "Motion sensor control not available on this system."}), 501
    
    sensor_def = next((ms for ms in motion_sensor_defs if str(ms['id']) == str(sensor_id)), None)
    if not sensor_def:
        return jsonify({"error": "Motion sensor not found"}), 404
    
    # Simulate motion detection
    handle_motion_detection(sensor_id)
    
    return jsonify({
        "message": f"Motion sensor {sensor_id} test triggered",
        "sensor": sensor_def['name']
    })

@app.route('/api/motion_sensors/test_all', methods=['POST'])
def test_all_motion_sensors():
    """Test all motion sensors by simulating motion detection"""
    if not MOTION_SENSOR_ENABLED:
        return jsonify({"error": "Motion sensor control not available on this system."}), 501
    
    if not motion_sensor_defs:
        return jsonify({"error": "No motion sensors configured"}), 404
    
    results = []
    for sensor in motion_sensor_defs:
        try:
            # Simulate motion detection
            handle_motion_detection(sensor['id'])
            results.append({
                "sensor_id": sensor['id'],
                "name": sensor['name'],
                "status": "success"
            })
        except Exception as e:
            results.append({
                "sensor_id": sensor['id'],
                "name": sensor['name'],
                "status": "error",
                "error": str(e)
            })
    
    return jsonify({
        "message": "All motion sensors tested",
        "results": results
    })

@app.route('/api/motion_sensors/config', methods=['GET'])
def get_motion_sensor_config():
    """Get current motion sensor configuration"""
    return jsonify({
        "motion_sensors": motion_sensor_defs,
        "enabled": MOTION_SENSOR_ENABLED,
        "count": len(motion_sensor_defs)
    })

@app.route('/api/motion_alerts', methods=['GET'])
def get_motion_alerts():
    """Get motion alerts for frontend"""
    return jsonify({
        "alerts": motion_alerts,
        "count": len(motion_alerts)
    })

@app.route('/api/motion_alerts/clear', methods=['POST'])
def clear_motion_alerts():
    """Clear all motion alerts"""
    global motion_alerts
    motion_alerts.clear()
    return jsonify({"message": "All motion alerts cleared"})

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
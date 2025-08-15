from flask import Flask, jsonify, request, abort
import psycopg2
import os
from dotenv import load_dotenv
from flask_cors import CORS
from models import Device, Relay, Base, get_engine
from sqlalchemy import inspect
from sqlalchemy.orm import sessionmaker
import secrets
import socket
from datetime import datetime, time
from models import MotionSensor, MotionLog

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load environment variables from .env
load_dotenv()
DB_NAME = os.getenv('DB_NAME', 'central_db')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASS = os.getenv('DB_PASS', 'password')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')

# Auto-migrate: create tables if not exist (safe, non-destructive)
engine = get_engine()
Base.metadata.create_all(engine)

Session = sessionmaker(bind=engine)

@app.route('/')
def index():
    return 'Central Server Backend is running.'

@app.route('/health')
def health():
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            host=DB_HOST,
            port=DB_PORT,
            connect_timeout=3
        )
        cur = conn.cursor()
        cur.execute('SELECT 1;')
        cur.fetchone()
        cur.close()
        conn.close()
        return jsonify({"status": "ok", "db": "ok"}), 200
    except Exception as e:
        return jsonify({"status": "error", "db": "unreachable", "error": str(e)}), 500

@app.route('/api/model_status')
def model_status():
    """Check if all main tables exist in the database."""
    engine = get_engine()
    inspector = inspect(engine)
    required_tables = ['devices', 'relays', 'sensors', 'status_logs']
    existing_tables = inspector.get_table_names()
    status = {table: (table in existing_tables) for table in required_tables}
    all_ok = all(status.values())
    return jsonify({"tables": status, "all_ok": all_ok})

# Helper: get device by token
def get_device_by_token(token):
    session = Session()
    device = session.query(Device).filter_by(token=token).first()
    session.close()
    return device

# Device CRUD
@app.route('/api/devices', methods=['GET'])
def list_devices():
    session = Session()
    devices = session.query(Device).all()
    result = [
        {
            'id': d.id,
            'name': d.name,
            'ip_address': d.ip_address,
            'token': d.token,
            'last_seen': d.last_seen.isoformat() if d.last_seen else None,
            'description': d.description,
            'is_active': d.is_active
        } for d in devices
    ]
    session.close()
    return jsonify(result)

@app.route('/api/devices', methods=['POST'])
def create_device():
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({'error': 'Device name is required'}), 400
    session = Session()
    token = data.get('token') or secrets.token_hex(16)
    device = Device(
        name=data['name'],
        ip_address=data.get('ip_address'),
        token=token,
        description=data.get('description'),
        is_active=data.get('is_active', True)
    )
    session.add(device)
    session.commit()
    result = {'id': device.id, 'name': device.name, 'token': device.token}
    session.close()
    return jsonify(result), 201

# Endpoint: Get device token (admin use)
@app.route('/api/devices/<int:device_id>/token', methods=['GET'])
def get_device_token(device_id):
    session = Session()
    device = session.query(Device).get(device_id)
    if not device:
        session.close()
        return jsonify({'error': 'Device not found'}), 404
    result = {'id': device.id, 'token': device.token}
    session.close()
    return jsonify(result)

@app.route('/api/devices/<int:device_id>', methods=['GET'])
def get_device(device_id):
    session = Session()
    device = session.query(Device).get(device_id)
    if not device:
        session.close()
        return jsonify({'error': 'Device not found'}), 404
    result = {
        'id': device.id,
        'name': device.name,
        'ip_address': device.ip_address,
        'token': device.token,
        'last_seen': device.last_seen.isoformat() if device.last_seen else None,
        'description': device.description,
        'is_active': device.is_active
    }
    session.close()
    return jsonify(result)

@app.route('/api/devices/<int:device_id>', methods=['PUT'])
def update_device(device_id):
    data = request.get_json()
    session = Session()
    device = session.query(Device).get(device_id)
    if not device:
        session.close()
        return jsonify({'error': 'Device not found'}), 404
    for field in ['name', 'ip_address', 'token', 'description', 'is_active']:
        if field in data:
            setattr(device, field, data[field])
    session.commit()
    session.close()
    return jsonify({'message': 'Device updated'})

@app.route('/api/devices/<int:device_id>', methods=['DELETE'])
def delete_device(device_id):
    session = Session()
    device = session.query(Device).get(device_id)
    if not device:
        session.close()
        return jsonify({'error': 'Device not found'}), 404
    session.delete(device)
    session.commit()
    session.close()
    return jsonify({'message': 'Device deleted'})

# Relay CRUD (per device)
@app.route('/api/relays', methods=['GET'])
def list_all_relays():
    session = Session()
    relays = session.query(Relay).all()
    result = [
        {
            'id': r.id,
            'device_id': r.device_id,
            'name': r.name,
            'gpio_pin': r.gpio_pin,
            'status': r.status,
            'last_update': r.last_update.isoformat() if r.last_update else None
        } for r in relays
    ]
    session.close()
    return jsonify({'relays': result})

@app.route('/api/devices/<int:device_id>/relays', methods=['GET'])
def list_relays(device_id):
    session = Session()
    relays = session.query(Relay).filter_by(device_id=device_id).all()
    result = [
        {
            'id': r.id,
            'device_id': r.device_id,
            'name': r.name,
            'gpio_pin': r.gpio_pin,
            'status': r.status,
            'last_update': r.last_update.isoformat() if r.last_update else None
        } for r in relays
    ]
    session.close()
    return jsonify(result)

@app.route('/api/devices/<int:device_id>/relays', methods=['POST'])
def create_relay(device_id):
    data = request.get_json()
    if not data or 'name' not in data or 'gpio_pin' not in data:
        return jsonify({'error': 'Relay name and gpio_pin are required'}), 400
    session = Session()
    device = session.query(Device).get(device_id)
    if not device:
        session.close()
        return jsonify({'error': 'Device not found'}), 404
    relay = Relay(
        device_id=device_id,
        name=data['name'],
        gpio_pin=data['gpio_pin'],
        status=data.get('status', False)
    )
    session.add(relay)
    session.commit()
    result = {'id': relay.id, 'name': relay.name}
    session.close()
    return jsonify(result), 201

@app.route('/api/relays/<int:relay_id>', methods=['PUT'])
def update_relay(relay_id):
    data = request.get_json()
    session = Session()
    relay = session.query(Relay).get(relay_id)
    if not relay:
        session.close()
        return jsonify({'error': 'Relay not found'}), 404
    for field in ['name', 'gpio_pin', 'status']:
        if field in data:
            setattr(relay, field, data[field])
    session.commit()
    session.close()
    return jsonify({'message': 'Relay updated'})

@app.route('/api/relays/<int:relay_id>', methods=['DELETE'])
def delete_relay(relay_id):
    session = Session()
    relay = session.query(Relay).get(relay_id)
    if not relay:
        session.close()
        return jsonify({'error': 'Relay not found'}), 404
    session.delete(relay)
    session.commit()
    session.close()
    return jsonify({'message': 'Relay deleted'})

# Endpoint: Get relay config for a device
@app.route('/api/devices/<int:device_id>/relays/config', methods=['GET'])
def get_device_relay_config(device_id):
    session = Session()
    device = session.query(Device).get(device_id)
    if not device:
        session.close()
        return jsonify({'error': 'Device not found'}), 404
    relays = session.query(Relay).filter_by(device_id=device_id).all()
    result = [
        {
            'id': r.id,
            'name': r.name,
            'gpio_pin': r.gpio_pin,
            'status': r.status
        } for r in relays
    ]
    session.close()
    return jsonify({'relays': result})

# Endpoint: Device updates relay status
@app.route('/api/relays/<int:relay_id>/status', methods=['PUT'])
def update_relay_status_from_device(relay_id):
    token = request.headers.get('X-Device-Token') or request.json.get('token')
    if not token:
        return jsonify({'error': 'Device token required'}), 401
    session = Session()
    relay = session.query(Relay).get(relay_id)
    if not relay:
        session.close()
        return jsonify({'error': 'Relay not found'}), 404
    device = session.query(Device).get(relay.device_id)
    if not device or device.token != token:
        session.close()
        return jsonify({'error': 'Unauthorized device'}), 403
    data = request.get_json()
    if not data or 'status' not in data:
        session.close()
        return jsonify({'error': 'Status is required'}), 400
    relay.status = bool(data['status'])
    session.commit()
    session.close()
    return jsonify({'message': 'Relay status updated'})

# Motion Sensor Management APIs
@app.route('/api/motion_sensors', methods=['GET'])
def list_all_motion_sensors():
    session = Session()
    motion_sensors = session.query(MotionSensor).all()
    result = [
        {
            'id': ms.id,
            'name': ms.name,
            'gpio_pin': ms.gpio_pin,
            'is_active': ms.is_active,
            'last_motion_detected': ms.last_motion_detected.isoformat() if ms.last_motion_detected else None,
            'motion_count': ms.motion_count,
            'last_update': ms.last_update.isoformat() if ms.last_update else None,
            'device_id': ms.device_id,
            'start_time': ms.start_time.strftime('%H:%M') if ms.start_time else None,
            'end_time': ms.end_time.strftime('%H:%M') if ms.end_time else None,
            'timezone': ms.timezone,
            'enable_scheduling': ms.enable_scheduling,
            'weekend_monitoring': ms.weekend_monitoring,
            'weekday_monitoring': ms.weekday_monitoring,
            'sensitivity': ms.sensitivity,
            'delay_time': ms.delay_time,
            'trigger_mode': ms.trigger_mode
        } for ms in motion_sensors
    ]
    session.close()
    return jsonify({'motion_sensors': result})

@app.route('/api/devices/<int:device_id>/motion_sensors', methods=['GET'])
def list_device_motion_sensors(device_id):
    session = Session()
    device = session.query(Device).get(device_id)
    if not device:
        session.close()
        return jsonify({'error': 'Device not found'}), 404
    motion_sensors = session.query(MotionSensor).filter_by(device_id=device_id).all()
    result = [
        {
            'id': ms.id,
            'name': ms.name,
            'gpio_pin': ms.gpio_pin,
            'is_active': ms.is_active,
            'last_motion_detected': ms.last_motion_detected.isoformat() if ms.last_motion_detected else None,
            'motion_count': ms.motion_count,
            'last_update': ms.last_update.isoformat() if ms.last_update else None
        } for ms in motion_sensors
    ]
    session.close()
    return jsonify(result)

@app.route('/api/devices/<int:device_id>/motion_sensors', methods=['POST'])
def create_motion_sensor(device_id):
    data = request.get_json()
    if not data or 'name' not in data or 'gpio_pin' not in data:
        return jsonify({'error': 'Name and gpio_pin are required'}), 400
    
    session = Session()
    device = session.query(Device).get(device_id)
    if not device:
        session.close()
        return jsonify({'error': 'Device not found'}), 404
    
    # Parse time strings to Time objects
    start_time = None
    end_time = None
    if data.get('start_time'):
        try:
            start_time = datetime.strptime(data['start_time'], '%H:%M').time()
        except ValueError:
            return jsonify({'error': 'Invalid start_time format. Use HH:MM'}), 400
    
    if data.get('end_time'):
        try:
            end_time = datetime.strptime(data['end_time'], '%H:%M').time()
        except ValueError:
            return jsonify({'error': 'Invalid end_time format. Use HH:MM'}), 400
    
    motion_sensor = MotionSensor(
        device_id=device_id,
        name=data['name'],
        gpio_pin=data['gpio_pin'],
        is_active=data.get('is_active', True),
        start_time=start_time,
        end_time=end_time,
        timezone=data.get('timezone', 'UTC'),
        enable_scheduling=data.get('enable_scheduling', False),
        weekend_monitoring=data.get('weekend_monitoring', True),
        weekday_monitoring=data.get('weekday_monitoring', True),
        sensitivity=data.get('sensitivity', 'medium'),
        delay_time=data.get('delay_time', 3),
        trigger_mode=data.get('trigger_mode', 'single')
    )
    
    session.add(motion_sensor)
    session.commit()
    
    # Get the ID before closing the session
    sensor_id = motion_sensor.id
    session.close()
    
    return jsonify({
        'message': 'Motion sensor created', 
        'id': sensor_id,
        'sensor': {
            'id': sensor_id,
            'name': motion_sensor.name,
            'gpio_pin': motion_sensor.gpio_pin,
            'start_time': motion_sensor.start_time.strftime('%H:%M') if motion_sensor.start_time else None,
            'end_time': motion_sensor.end_time.strftime('%H:%M') if motion_sensor.end_time else None,
            'enable_scheduling': motion_sensor.enable_scheduling
        }
    }), 201

@app.route('/api/motion_sensors/<int:motion_sensor_id>', methods=['PUT'])
def update_motion_sensor(motion_sensor_id):
    data = request.get_json()
    session = Session()
    motion_sensor = session.query(MotionSensor).get(motion_sensor_id)
    if not motion_sensor:
        session.close()
        return jsonify({'error': 'Motion sensor not found'}), 404
    
    # Update basic fields
    for field in ['name', 'gpio_pin', 'is_active', 'timezone', 'enable_scheduling', 
                  'weekend_monitoring', 'weekday_monitoring', 'sensitivity', 
                  'delay_time', 'trigger_mode']:
        if field in data:
            setattr(motion_sensor, field, data[field])
    
    # Update time fields
    if 'start_time' in data:
        if data['start_time']:
            try:
                motion_sensor.start_time = datetime.strptime(data['start_time'], '%H:%M').time()
            except ValueError:
                return jsonify({'error': 'Invalid start_time format. Use HH:MM'}), 400
        else:
            motion_sensor.start_time = None
    
    if 'end_time' in data:
        if data['end_time']:
            try:
                motion_sensor.end_time = datetime.strptime(data['end_time'], '%H:%M').time()
            except ValueError:
                return jsonify({'error': 'Invalid end_time format. Use HH:MM'}), 400
        else:
            motion_sensor.end_time = None
    
    session.commit()
    session.close()
    return jsonify({'message': 'Motion sensor updated'})

@app.route('/api/motion_sensors/<int:motion_sensor_id>', methods=['DELETE'])
def delete_motion_sensor(motion_sensor_id):
    session = Session()
    motion_sensor = session.query(MotionSensor).get(motion_sensor_id)
    if not motion_sensor:
        session.close()
        return jsonify({'error': 'Motion sensor not found'}), 404
    session.delete(motion_sensor)
    session.commit()
    session.close()
    return jsonify({'message': 'Motion sensor deleted'})

# Endpoint: Get motion sensor config for a device
@app.route('/api/devices/<int:device_id>/motion_sensors/config', methods=['GET'])
def get_device_motion_sensor_config(device_id):
    session = Session()
    device = session.query(Device).get(device_id)
    if not device:
        session.close()
        return jsonify({'error': 'Device not found'}), 404
    motion_sensors = session.query(MotionSensor).filter_by(device_id=device_id, is_active=True).all()
    result = [
        {
            'id': ms.id,
            'name': ms.name,
            'gpio_pin': ms.gpio_pin,
            'is_active': ms.is_active
        } for ms in motion_sensors
    ]
    session.close()
    return jsonify({'motion_sensors': result})

# Endpoint: Device reports motion detection
@app.route('/api/motion_sensors/<int:motion_sensor_id>/motion', methods=['POST'])
def report_motion_detection(motion_sensor_id):
    token = request.headers.get('X-Device-Token') or request.json.get('token')
    if not token:
        return jsonify({'error': 'Device token required'}), 401
    session = Session()
    motion_sensor = session.query(MotionSensor).get(motion_sensor_id)
    if not motion_sensor:
        session.close()
        return jsonify({'error': 'Motion sensor not found'}), 404
    device = session.query(Device).get(motion_sensor.device_id)
    if not device or device.token != token:
        session.close()
        return jsonify({'error': 'Unauthorized device'}), 403
    # Update motion sensor status
    motion_sensor.last_motion_detected = datetime.datetime.utcnow()
    motion_sensor.motion_count += 1
    motion_sensor.last_update = datetime.datetime.utcnow()
    # Create motion log
    motion_log = MotionLog(
        motion_sensor_id=motion_sensor_id,
        device_id=device.id,
        motion_detected=datetime.datetime.utcnow()
    )
    session.add(motion_log)
    session.commit()
    session.close()
    return jsonify({'message': 'Motion detected and logged'})

# Endpoint: Get motion logs for a device
@app.route('/api/devices/<int:device_id>/motion_logs', methods=['GET'])
def get_device_motion_logs(device_id):
    session = Session()
    device = session.query(Device).get(device_id)
    if not device:
        session.close()
        return jsonify({'error': 'Device not found'}), 404
    motion_logs = session.query(MotionLog).filter_by(device_id=device_id).order_by(MotionLog.motion_detected.desc()).limit(100).all()
    result = [
        {
            'id': ml.id,
            'motion_sensor_id': ml.motion_sensor_id,
            'motion_detected': ml.motion_detected.isoformat(),
            'is_alert_sent': ml.is_alert_sent,
            'alert_sent_at': ml.alert_sent_at.isoformat() if ml.alert_sent_at else None
        } for ml in motion_logs
    ]
    session.close()
    return jsonify(result)

def get_lan_ip():
    try:
        import netifaces
        for iface in netifaces.interfaces():
            addrs = netifaces.ifaddresses(iface)
            if netifaces.AF_INET in addrs:
                for addr in addrs[netifaces.AF_INET]:
                    ip = addr['addr']
                    if not ip.startswith('127.') and not ip.startswith('169.254.'):
                        return ip
    except Exception:
        pass
    # fallback: try socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('10.255.255.255', 1))
        ip = s.getsockname()[0]
        s.close()
        if not ip.startswith('127.') and not ip.startswith('169.254.'):
            return ip
    except Exception:
        pass
    return '127.0.0.1'

@app.route('/api/server_info')
def server_info():
    ip = get_lan_ip()
    return jsonify({'ip': ip})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000) 
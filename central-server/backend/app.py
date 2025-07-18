from flask import Flask, jsonify, request
import psycopg2
import os
from dotenv import load_dotenv
from flask_cors import CORS
from models import Device, Relay, Base, get_engine
from sqlalchemy import inspect
from sqlalchemy.orm import sessionmaker

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
    device = Device(
        name=data['name'],
        ip_address=data.get('ip_address'),
        token=data.get('token'),
        description=data.get('description'),
        is_active=data.get('is_active', True)
    )
    session.add(device)
    session.commit()
    result = {'id': device.id, 'name': device.name}
    session.close()
    return jsonify(result), 201

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000) 
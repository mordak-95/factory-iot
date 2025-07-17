from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# MongoDB connection
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URI)
db = client['factory_iot']
raspberries = db['raspberries']
relay_logs = db['relay_logs']

@app.route('/')
def index():
    return {'msg': 'Central Backend Running'}

# ثبت یا آپدیت رزبری‌پای و رله‌ها
@app.route('/api/raspberry', methods=['POST'])
def register_raspberry():
    data = request.get_json()
    if not data or 'raspberry_id' not in data or 'relays' not in data:
        return jsonify({'error': 'raspberry_id and relays required'}), 400
    raspberry_id = data['raspberry_id']
    relays = data['relays']
    update = {
        'name': data.get('name', raspberry_id),
        'location': data.get('location', ''),
        'ip': data.get('ip', request.remote_addr),
        'relays': relays,
        'last_seen': datetime.utcnow()
    }
    raspberries.update_one({'_id': raspberry_id}, {'$set': update}, upsert=True)
    return jsonify({'msg': 'Raspberry registered/updated'})

# دریافت لیست همه رزبری‌پای‌ها و رله‌هایشان
@app.route('/api/raspberries', methods=['GET'])
def get_raspberries():
    docs = list(raspberries.find())
    for d in docs:
        d['_id'] = str(d['_id'])
    return jsonify({'raspberries': docs})

# دریافت اطلاعات یک رزبری‌پای خاص
@app.route('/api/raspberry/<raspberry_id>', methods=['GET'])
def get_raspberry(raspberry_id):
    doc = raspberries.find_one({'_id': raspberry_id})
    if not doc:
        return jsonify({'error': 'Not found'}), 404
    doc['_id'] = str(doc['_id'])
    return jsonify(doc)

# ثبت لاگ تغییر وضعیت رله
@app.route('/api/relay-log', methods=['POST'])
def log_relay_action():
    data = request.get_json()
    if not data or 'raspberry_id' not in data or 'relay_id' not in data or 'action' not in data:
        return jsonify({'error': 'raspberry_id, relay_id, action required'}), 400
    log_entry = {
        'raspberry_id': data['raspberry_id'],
        'relay_id': data['relay_id'],
        'action': data['action'],
        'timestamp': datetime.utcnow(),
        'user': data.get('user', 'system')
    }
    relay_logs.insert_one(log_entry)
    return jsonify({'msg': 'Log saved'})

# دریافت لاگ‌های یک رزبری‌پای یا رله خاص
@app.route('/api/relay-logs', methods=['GET'])
def get_relay_logs():
    raspberry_id = request.args.get('raspberry_id')
    relay_id = request.args.get('relay_id')
    query = {}
    if raspberry_id:
        query['raspberry_id'] = raspberry_id
    if relay_id:
        query['relay_id'] = relay_id
    logs = list(relay_logs.find(query).sort('timestamp', -1).limit(100))
    for l in logs:
        l['_id'] = str(l['_id'])
    return jsonify({'logs': logs})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001) 
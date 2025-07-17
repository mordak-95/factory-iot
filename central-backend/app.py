import os
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

# PostgreSQL connection
PG_URL = os.environ.get('PG_URL', 'dbname=factoryiotdb user=factoryiot password=factoryiotpass host=localhost')
def get_conn():
    return psycopg2.connect(PG_URL)

def init_db():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('''
    CREATE TABLE IF NOT EXISTS raspberries (
        id TEXT PRIMARY KEY,
        name TEXT,
        location TEXT,
        ip TEXT,
        last_seen TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS relays (
        id SERIAL PRIMARY KEY,
        raspberry_id TEXT REFERENCES raspberries(id) ON DELETE CASCADE,
        relay_id TEXT,
        bcm_pin INT,
        name TEXT,
        status TEXT,
        last_update TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS relay_logs (
        id SERIAL PRIMARY KEY,
        raspberry_id TEXT,
        relay_id TEXT,
        action TEXT,
        timestamp TIMESTAMP,
        "user" TEXT
    );
    ''')
    conn.commit()
    cur.close()
    conn.close()

@app.route('/')
def index():
    return {'msg': 'Central Backend Running'}

@app.before_first_request
def setup():
    init_db()

# ثبت یا آپدیت رزبری‌پای و رله‌ها
@app.route('/api/raspberry', methods=['POST'])
def register_raspberry():
    data = request.get_json()
    if not data or 'raspberry_id' not in data or 'relays' not in data:
        return jsonify({'error': 'raspberry_id and relays required'}), 400
    raspberry_id = data['raspberry_id']
    relays = data['relays']
    name = data.get('name', raspberry_id)
    location = data.get('location', '')
    ip = data.get('ip', request.remote_addr)
    last_seen = datetime.utcnow()
    conn = get_conn()
    cur = conn.cursor()
    # Upsert raspberry
    cur.execute('''
        INSERT INTO raspberries (id, name, location, ip, last_seen)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, location=EXCLUDED.location, ip=EXCLUDED.ip, last_seen=EXCLUDED.last_seen
    ''', (raspberry_id, name, location, ip, last_seen))
    # حذف رله‌های قبلی و درج جدید
    cur.execute('DELETE FROM relays WHERE raspberry_id=%s', (raspberry_id,))
    for relay in relays:
        cur.execute('''
            INSERT INTO relays (raspberry_id, relay_id, bcm_pin, name, status, last_update)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (
            raspberry_id,
            relay.get('relay_id'),
            relay.get('bcm_pin'),
            relay.get('name'),
            relay.get('status'),
            relay.get('last_update') or last_seen
        ))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'msg': 'Raspberry registered/updated'})

# دریافت لیست همه رزبری‌پای‌ها و رله‌هایشان
@app.route('/api/raspberries', methods=['GET'])
def get_raspberries():
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT * FROM raspberries')
    rasp_list = cur.fetchall()
    for r in rasp_list:
        cur.execute('SELECT relay_id, bcm_pin, name, status, last_update FROM relays WHERE raspberry_id=%s', (r['id'],))
        r['relays'] = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify({'raspberries': rasp_list})

# دریافت اطلاعات یک رزبری‌پای خاص
@app.route('/api/raspberry/<raspberry_id>', methods=['GET'])
def get_raspberry(raspberry_id):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('SELECT * FROM raspberries WHERE id=%s', (raspberry_id,))
    doc = cur.fetchone()
    if not doc:
        cur.close()
        conn.close()
        return jsonify({'error': 'Not found'}), 404
    cur.execute('SELECT relay_id, bcm_pin, name, status, last_update FROM relays WHERE raspberry_id=%s', (raspberry_id,))
    doc['relays'] = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(doc)

# ثبت لاگ تغییر وضعیت رله
@app.route('/api/relay-log', methods=['POST'])
def log_relay_action():
    data = request.get_json()
    if not data or 'raspberry_id' not in data or 'relay_id' not in data or 'action' not in data:
        return jsonify({'error': 'raspberry_id, relay_id, action required'}), 400
    log_entry = (
        data['raspberry_id'],
        data['relay_id'],
        data['action'],
        datetime.utcnow(),
        data.get('user', 'system')
    )
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('''
        INSERT INTO relay_logs (raspberry_id, relay_id, action, timestamp, "user")
        VALUES (%s, %s, %s, %s, %s)
    ''', log_entry)
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'msg': 'Log saved'})

# دریافت لاگ‌های یک رزبری‌پای یا رله خاص
@app.route('/api/relay-logs', methods=['GET'])
def get_relay_logs():
    raspberry_id = request.args.get('raspberry_id')
    relay_id = request.args.get('relay_id')
    query = []
    params = []
    if raspberry_id:
        query.append('raspberry_id=%s')
        params.append(raspberry_id)
    if relay_id:
        query.append('relay_id=%s')
        params.append(relay_id)
    where = ('WHERE ' + ' AND '.join(query)) if query else ''
    sql = f'SELECT * FROM relay_logs {where} ORDER BY timestamp DESC LIMIT 100'
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(sql, params)
    logs = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify({'logs': logs})

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5001) 
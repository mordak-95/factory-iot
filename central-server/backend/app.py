from flask import Flask, jsonify
import psycopg2
import os
from dotenv import load_dotenv
from flask_cors import CORS
from models import Base, get_engine

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000) 
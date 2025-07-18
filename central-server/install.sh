#!/bin/bash
# نصب و راه‌اندازی سرور مرکزی (Ubuntu/Raspberry Pi 5)
# این اسکریپت را با دسترسی sudo اجرا کنید
set -e

# --- تنظیمات ---
DB_NAME="central_db"
DB_USER="postgres"
DB_PASS="password"
DB_PORT="5432"
BACKEND_PORT="5000"
FRONTEND_PORT="3000"

# --- نصب پیش‌نیازها ---
echo "[1/8] نصب ابزارهای پایه..."
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv postgresql postgresql-contrib curl git

# نصب Node.js (LTS)
echo "[2/8] نصب Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g yarn

# --- راه‌اندازی و پیکربندی PostgreSQL ---
echo "[3/8] راه‌اندازی PostgreSQL..."
sudo systemctl enable postgresql
sudo systemctl start postgresql

# ساخت دیتابیس و کاربر (در صورت نیاز)
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" || true
sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# --- راه‌اندازی backend (Python) ---
echo "[4/8] راه‌اندازی backend..."
cd $(dirname "$0")/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
# تنظیم متغیرهای محیطی برای اتصال به دیتابیس
export DB_NAME=$DB_NAME
export DB_USER=$DB_USER
export DB_PASS=$DB_PASS
export DB_PORT=$DB_PORT
# اجرای backend در پس‌زمینه
nohup venv/bin/python app.py &
BACKEND_PID=$!
cd ..

# --- راه‌اندازی frontend (ReactJS) ---
echo "[5/8] راه‌اندازی frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
  yarn install
fi
nohup yarn start --port $FRONTEND_PORT &
FRONTEND_PID=$!
cd ..

# --- پایان ---
echo "[6/8] همه سرویس‌ها اجرا شدند."
echo "- Backend: http://localhost:$BACKEND_PORT"
echo "- Frontend: http://localhost:$FRONTEND_PORT"
echo "- PostgreSQL: پورت $DB_PORT, دیتابیس $DB_NAME, کاربر $DB_USER"
echo "برای توقف سرویس‌ها از دستور kill استفاده کنید (PIDها: $BACKEND_PID, $FRONTEND_PID)" 
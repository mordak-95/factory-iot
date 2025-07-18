#!/bin/bash
# نصب و راه‌اندازی سرور مرکزی (Ubuntu/Raspberry Pi 5)
# این اسکریپت را با دسترسی sudo اجرا کنید
set -e

# --- تنظیمات ---
DB_NAME="central_db"
DB_USER="postgres"
DB_PASS="password"
DB_PORT="5432"
DB_HOST="localhost"
BACKEND_PORT="5000"
FRONTEND_PORT="3000"

# --- نصب پیش‌نیازها ---
echo "[1/8] نصب ابزارهای پایه..."
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv postgresql postgresql-contrib curl git

# نصب Node.js (LTS) اگر نصب نیست
if ! command -v node &> /dev/null; then
  echo "[2/8] نصب Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
if ! command -v yarn &> /dev/null; then
  sudo npm install -g yarn
fi

# --- راه‌اندازی و پیکربندی PostgreSQL ---
echo "[3/8] راه‌اندازی PostgreSQL..."
sudo systemctl enable postgresql
sudo systemctl start postgresql

# ساخت دیتابیس و کاربر (در صورت نیاز)
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" || true
sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# --- ایجاد فایل env برای backend ---
cd $(dirname "$0")/backend
cat > .env <<EOF
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASS
DB_PORT=$DB_PORT
DB_HOST=$DB_HOST
EOF

# --- راه‌اندازی backend (Python) ---
echo "[4/8] راه‌اندازی backend..."
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
nohup venv/bin/python app.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# --- راه‌اندازی frontend (ReactJS) ---
echo "[5/8] راه‌اندازی frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
  yarn install
fi
nohup yarn start --port $FRONTEND_PORT > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# --- پایان ---
echo "[6/8] همه سرویس‌ها اجرا شدند."
echo "- Backend: http://localhost:$BACKEND_PORT (لاگ: backend.log)"
echo "- Frontend: http://localhost:$FRONTEND_PORT (لاگ: frontend.log)"
echo "- PostgreSQL: پورت $DB_PORT, دیتابیس $DB_NAME, کاربر $DB_USER"
echo "برای توقف سرویس‌ها از دستور زیر استفاده کنید:"
echo "  kill $BACKEND_PID $FRONTEND_PID" 
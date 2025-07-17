# Factory IoT - Real-Time Installation Guide

## 🚀 نصب سریع (توصیه شده)

```bash
bash <(curl -Ls https://raw.githubusercontent.com/mordak-95/factory-iot/master/install.sh)
```

## 📋 پیش‌نیازها

### Raspberry Pi
- Raspberry Pi OS Lite (Bullseye یا جدیدتر)
- حداقل 2GB RAM
- اتصال اینترنت
- نمایشگر لمسی (اختیاری اما توصیه شده)

### سایر سیستم‌ها
- Ubuntu 20.04+ / Debian 11+
- Python 3.8+
- Node.js 18+
- حداقل 2GB RAM

## 🔧 نصب دستی

### 1. کلون کردن مخزن
```bash
git clone https://github.com/mordak-95/factory-iot.git
cd factory-iot
```

### 2. نصب Backend (Real-Time WebSocket)
```bash
cd backend

# ایجاد محیط مجازی
python3 -m venv venv
source venv/bin/activate

# نصب dependencies
pip install --upgrade pip
pip install -r requirements.txt

# تست نصب WebSocket
python3 -c "import flask_socketio; print('✓ Flask-SocketIO installed')"
python3 -c "import eventlet; print('✓ Eventlet installed')"

cd ..
```

### 3. نصب Frontend (Real-Time Client)
```bash
cd client

# نصب dependencies
npm install

# تست نصب WebSocket client
npm list socket.io-client

cd ..
```

### 4. اجرای سیستم
```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
python app.py

# Terminal 2: Frontend
cd client
npm start
```

## 🌐 دسترسی به سیستم

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **WebSocket**: ws://localhost:5000

## ⚡ ویژگی‌های Real-Time

### قبل از ارتقا
- ❌ به‌روزرسانی هر 5 ثانیه
- ❌ تأخیر 5000ms
- ❌ مصرف بالای منابع

### بعد از ارتقا
- ✅ به‌روزرسانی لحظه‌ای (< 100ms)
- ✅ WebSocket communication
- ✅ HTTP fallback
- ✅ چندین کلاینت همزمان

## 🔍 تست عملکرد Real-Time

### 1. تست خودکار
```bash
python3 test_realtime.py
```

### 2. تست دستی
1. مرورگر را باز کنید: http://localhost:3000
2. وضعیت اتصال را بررسی کنید:
   - 🟢 Real-time Connected = WebSocket فعال
   - 🔴 HTTP Fallback = WebSocket غیرفعال
3. تغییر وضعیت دستگاه‌ها را تست کنید
4. آمار سیستم را در real-time مشاهده کنید

### 3. تست WebSocket
```bash
# نصب socketio-client برای تست
pip install socketio-client

# اجرای تست
python3 -c "
import socketio
sio = socketio.Client()
sio.connect('http://localhost:5000')
print('WebSocket connected successfully')
sio.disconnect()
"
```

## 🛠️ مدیریت سرویس‌ها

### نصب به عنوان سرویس سیستم
```bash
# ایجاد سرویس‌ها
sudo systemctl enable factory-iot-backend.service
sudo systemctl enable factory-iot-frontend.service

# شروع سرویس‌ها
sudo systemctl start factory-iot-backend.service
sudo systemctl start factory-iot-frontend.service

# بررسی وضعیت
sudo systemctl status factory-iot-backend.service
sudo systemctl status factory-iot-frontend.service
```

### مشاهده لاگ‌ها
```bash
# لاگ Backend
journalctl -u factory-iot-backend.service -f

# لاگ Frontend
journalctl -u factory-iot-frontend.service -f

# لاگ نصب
cat ~/factory-iot-install.log
```

## 🔧 تنظیمات پیشرفته

### تغییر پورت‌ها
```bash
# Backend
vim config/settings.json
# تغییر "port": 5000

# Frontend
vim client/package.json
# تغییر "start": "PORT=3001 react-scripts start"
```

### تنظیم WebSocket
```bash
# Backend - تغییر async_mode
vim backend/app.py
# socketio = SocketIO(app, async_mode='threading')

# Frontend - تغییر timeout
vim client/src/App.js
# timeout: 30000
```

### تنظیم فاصله به‌روزرسانی
```bash
# تغییر فاصله آمار سیستم
vim backend/app.py
# time.sleep(1)  # هر 1 ثانیه
```

## 🐛 عیب‌یابی

### مشکل: WebSocket متصل نمی‌شود
```bash
# بررسی firewall
sudo ufw status
sudo ufw allow 5000

# بررسی port
netstat -tlnp | grep 5000

# بررسی CORS
curl -H "Origin: http://localhost:3000" http://localhost:5000/api/health
```

### مشکل: Frontend به Backend متصل نمی‌شود
```bash
# بررسی متغیر محیطی
echo $REACT_APP_API_URL

# تنظیم دستی
export REACT_APP_API_URL=http://localhost:5000
npm start
```

### مشکل: سرویس‌ها شروع نمی‌شوند
```bash
# بررسی وابستگی‌ها
sudo systemctl list-dependencies factory-iot-backend.service

# بررسی لاگ‌ها
journalctl -u factory-iot-backend.service --no-pager

# تست دستی
cd backend && source venv/bin/activate && python app.py
```

## 📊 Performance Monitoring

### بررسی عملکرد Real-Time
```bash
# تست latency
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/api/health

# تست WebSocket
python3 -c "
import time
import socketio
sio = socketio.Client()
start = time.time()
sio.connect('http://localhost:5000')
print(f'WebSocket connection time: {(time.time() - start) * 1000:.1f}ms')
sio.disconnect()
"
```

### Monitoring System Resources
```bash
# CPU و Memory
htop

# Network connections
netstat -tlnp | grep -E ':(3000|5000)'

# WebSocket connections
ss -tuln | grep 5000
```

## 🔄 به‌روزرسانی سیستم

### به‌روزرسانی کد
```bash
cd factory-iot
git pull origin master

# به‌روزرسانی dependencies
cd backend && source venv/bin/activate && pip install -r requirements.txt
cd ../client && npm install

# راه‌اندازی مجدد سرویس‌ها
sudo systemctl restart factory-iot-backend.service
sudo systemctl restart factory-iot-frontend.service
```

### به‌روزرسانی سیستم
```bash
sudo apt update && sudo apt upgrade -y
sudo systemctl daemon-reload
```

## 📞 پشتیبانی

### لاگ‌های مفید
- `~/factory-iot-install.log` - لاگ نصب
- `journalctl -u factory-iot-backend.service` - لاگ Backend
- `journalctl -u factory-iot-frontend.service` - لاگ Frontend
- `~/.config/openbox/autostart` - تنظیمات Kiosk

### اطلاعات سیستم
```bash
# نسخه‌های نصب شده
python3 --version
node --version
npm --version

# وضعیت سرویس‌ها
systemctl list-units --type=service | grep factory-iot

# پورت‌های فعال
ss -tlnp | grep -E ':(3000|5000)'
```

## 🎯 نتیجه‌گیری

سیستم Factory IoT با موفقیت به Real-Time ارتقا یافته و حالا:

- ✅ تأخیر کمتر از 100ms
- ✅ WebSocket communication
- ✅ HTTP fallback
- ✅ چندین کلاینت همزمان
- ✅ به‌روزرسانی لحظه‌ای
- ✅ مصرف منابع بهینه

برای شروع کار، مرورگر را باز کنید و به http://localhost:3000 بروید! 
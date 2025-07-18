# Central Server

این پوشه شامل کدهای سرور مرکزی برای مدیریت و ارتباط با دیوایس‌ها است.

## اجزا
- backend (پایتون، Flask یا FastAPI)
- frontend (ReactJS)
- دیتابیس PostgreSQL
- اسکریپت نصب خودکار (install.sh)

## راه‌اندازی سریع
برای نصب و راه‌اندازی خودکار روی Ubuntu یا Raspberry Pi 5:
```bash
./install.sh
```

## ساختار پوشه
- backend/ : کدهای بک‌اند
- frontend/ : کدهای فرانت‌اند
- install.sh : اسکریپت نصب و راه‌اندازی 
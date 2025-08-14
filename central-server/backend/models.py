from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, Time
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine

# Load environment variables from .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

DB_NAME = os.getenv('DB_NAME', 'central_db')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASS = os.getenv('DB_PASS', 'password')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')

DATABASE_URL = f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}'

def get_engine():
    return create_engine(DATABASE_URL)

Base = declarative_base()

class Device(Base):
    __tablename__ = 'devices'
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    ip_address = Column(String(45))
    token = Column(String(128))
    last_seen = Column(DateTime)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    relays = relationship('Relay', back_populates='device')
    sensors = relationship('Sensor', back_populates='device')
    status_logs = relationship('StatusLog', back_populates='device')
    motion_sensors = relationship('MotionSensor', back_populates='device')

class Relay(Base):
    __tablename__ = 'relays'
    id = Column(Integer, primary_key=True)
    device_id = Column(Integer, ForeignKey('devices.id'))
    name = Column(String(100), nullable=False)
    gpio_pin = Column(Integer, nullable=False)
    status = Column(Boolean, default=False)
    last_update = Column(DateTime, default=datetime.datetime.utcnow)
    device = relationship('Device', back_populates='relays')
    status_logs = relationship('StatusLog', back_populates='relay')

class Sensor(Base):
    __tablename__ = 'sensors'
    id = Column(Integer, primary_key=True)
    device_id = Column(Integer, ForeignKey('devices.id'))
    name = Column(String(100), nullable=False)
    type = Column(String(50))
    value = Column(String(100))
    unit = Column(String(20))
    last_update = Column(DateTime, default=datetime.datetime.utcnow)
    device = relationship('Device', back_populates='sensors')
    status_logs = relationship('StatusLog', back_populates='sensor')

class MotionSensor(Base):
    __tablename__ = 'motion_sensors'
    id = Column(Integer, primary_key=True)
    device_id = Column(Integer, ForeignKey('devices.id'))
    name = Column(String(100), nullable=False)
    gpio_pin = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    last_motion_detected = Column(DateTime)
    motion_count = Column(Integer, default=0)
    last_update = Column(DateTime, default=datetime.datetime.utcnow)
    device = relationship('Device', back_populates='motion_sensors')
    motion_logs = relationship('MotionLog', back_populates='motion_sensor')

class MotionLog(Base):
    __tablename__ = 'motion_logs'
    id = Column(Integer, primary_key=True)
    motion_sensor_id = Column(Integer, ForeignKey('motion_sensors.id'))
    device_id = Column(Integer, ForeignKey('devices.id'))
    motion_detected = Column(DateTime, default=datetime.datetime.utcnow)
    is_alert_sent = Column(Boolean, default=False)
    alert_sent_at = Column(DateTime)
    motion_sensor = relationship('MotionSensor', back_populates='motion_logs')

class StatusLog(Base):
    __tablename__ = 'status_logs'
    id = Column(Integer, primary_key=True)
    device_id = Column(Integer, ForeignKey('devices.id'))
    relay_id = Column(Integer, ForeignKey('relays.id'), nullable=True)
    sensor_id = Column(Integer, ForeignKey('sensors.id'), nullable=True)
    status = Column(String(100))
    value = Column(String(100))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    device = relationship('Device', back_populates='status_logs')
    relay = relationship('Relay', back_populates='status_logs')
    sensor = relationship('Sensor', back_populates='status_logs') 
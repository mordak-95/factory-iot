#!/usr/bin/env python3
"""
Test script for Factory IoT Real-Time WebSocket functionality
"""

import requests
import time
import json
from datetime import datetime

def test_http_api():
    """Test HTTP API endpoints"""
    base_url = "http://localhost:5000"
    
    print("🔍 Testing HTTP API endpoints...")
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/api/health")
        if response.status_code == 200:
            print("✅ Health endpoint: OK")
        else:
            print("❌ Health endpoint: FAILED")
    except Exception as e:
        print(f"❌ Health endpoint: ERROR - {e}")
    
    # Test devices endpoint
    try:
        response = requests.get(f"{base_url}/api/devices")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Devices endpoint: OK ({data['count']} devices)")
        else:
            print("❌ Devices endpoint: FAILED")
    except Exception as e:
        print(f"❌ Devices endpoint: ERROR - {e}")
    
    # Test system stats endpoint
    try:
        response = requests.get(f"{base_url}/api/system/stats")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ System stats endpoint: OK (CPU: {data['cpu']['percent']}%)")
        else:
            print("❌ System stats endpoint: FAILED")
    except Exception as e:
        print(f"❌ System stats endpoint: ERROR - {e}")

def test_device_updates():
    """Test device value updates"""
    base_url = "http://localhost:5000"
    
    print("\n🔧 Testing device updates...")
    
    # Test updating device value
    try:
        new_value = 30.5
        response = requests.post(
            f"{base_url}/api/devices/sensor_001/value",
            json={"value": new_value}
        )
        if response.status_code == 200:
            print(f"✅ Device value update: OK (set to {new_value})")
        else:
            print("❌ Device value update: FAILED")
    except Exception as e:
        print(f"❌ Device value update: ERROR - {e}")
    
    # Test updating device status
    try:
        new_status = "maintenance"
        response = requests.post(
            f"{base_url}/api/devices/sensor_001/status",
            json={"status": new_status}
        )
        if response.status_code == 200:
            print(f"✅ Device status update: OK (set to {new_status})")
        else:
            print("❌ Device status update: FAILED")
    except Exception as e:
        print(f"❌ Device status update: ERROR - {e}")

def test_relay_control():
    """Test relay control"""
    base_url = "http://localhost:5000"
    
    print("\n⚡ Testing relay control...")
    
    # Test relay status
    try:
        response = requests.get(f"{base_url}/api/relays")
        if response.status_code == 200:
            data = response.json()
            if "relays" in data:
                print("✅ Relay status: OK")
                for relay_id, status in data["relays"].items():
                    print(f"   - {relay_id}: {'ON' if status else 'OFF'}")
            else:
                print("⚠️  Relay control not available on this system")
        else:
            print("❌ Relay status: FAILED")
    except Exception as e:
        print(f"❌ Relay status: ERROR - {e}")

def test_websocket_connection():
    """Test WebSocket connection (basic check)"""
    print("\n🔌 Testing WebSocket connection...")
    
    try:
        import socketio
        sio = socketio.Client()
        
        connected = False
        
        @sio.event
        def connect():
            nonlocal connected
            connected = True
            print("✅ WebSocket connection: ESTABLISHED")
        
        @sio.event
        def disconnect():
            print("⚠️  WebSocket connection: DISCONNECTED")
        
        @sio.event
        def devices_update(data):
            print(f"📡 Received devices update: {data['count']} devices")
        
        @sio.event
        def system_stats_update(data):
            print(f"📊 Received system stats update: CPU {data['cpu']['percent']}%")
        
        # Try to connect
        sio.connect('http://localhost:5000', timeout=5)
        
        if connected:
            # Request data
            sio.emit('request_devices')
            sio.emit('request_system_stats')
            
            # Wait for updates
            time.sleep(3)
            
            sio.disconnect()
        else:
            print("❌ WebSocket connection: FAILED")
            
    except ImportError:
        print("⚠️  socketio-client not installed, skipping WebSocket test")
    except Exception as e:
        print(f"❌ WebSocket connection: ERROR - {e}")

def performance_test():
    """Test performance with multiple rapid updates"""
    base_url = "http://localhost:5000"
    
    print("\n⚡ Performance test: Multiple rapid updates...")
    
    start_time = time.time()
    success_count = 0
    total_requests = 10
    
    for i in range(total_requests):
        try:
            response = requests.post(
                f"{base_url}/api/devices/sensor_001/value",
                json={"value": 25.0 + i}
            )
            if response.status_code == 200:
                success_count += 1
        except Exception:
            pass
    
    end_time = time.time()
    duration = end_time - start_time
    avg_time = duration / total_requests * 1000  # Convert to milliseconds
    
    print(f"✅ Performance test: {success_count}/{total_requests} successful")
    print(f"   - Total time: {duration:.2f}s")
    print(f"   - Average response time: {avg_time:.1f}ms")
    
    if avg_time < 100:
        print("   - Performance: EXCELLENT (< 100ms)")
    elif avg_time < 500:
        print("   - Performance: GOOD (< 500ms)")
    else:
        print("   - Performance: NEEDS IMPROVEMENT (> 500ms)")

def main():
    """Run all tests"""
    print("🏭 Factory IoT Real-Time System Test")
    print("=" * 50)
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Check if server is running
    try:
        response = requests.get("http://localhost:5000/", timeout=5)
        if response.status_code == 200:
            print("✅ Backend server is running")
        else:
            print("❌ Backend server is not responding correctly")
            return
    except Exception:
        print("❌ Backend server is not running. Please start the server first.")
        print("   Run: cd backend && python app.py")
        return
    
    # Run tests
    test_http_api()
    test_device_updates()
    test_relay_control()
    test_websocket_connection()
    performance_test()
    
    print("\n" + "=" * 50)
    print("🎯 Test completed!")
    print("\n📋 Next steps:")
    print("1. Open http://localhost:3000 in your browser")
    print("2. Check for '🟢 Real-time Connected' status")
    print("3. Test real-time updates by changing device values")
    print("4. Monitor console for WebSocket events")

if __name__ == "__main__":
    main() 
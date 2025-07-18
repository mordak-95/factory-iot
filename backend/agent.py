import os
import time
import requests
import json

CENTRAL_SERVER_URL = os.getenv('CENTRAL_SERVER_URL', 'http://localhost:5000')
DEVICE_ID = os.getenv('DEVICE_ID')
DEVICE_TOKEN = os.getenv('DEVICE_TOKEN')
RELAY_CONFIG_PATH = 'relay_config.json'
SYNC_INTERVAL = 5  # seconds

if not DEVICE_ID or not DEVICE_TOKEN:
    print('ERROR: DEVICE_ID and DEVICE_TOKEN must be set as environment variables.')
    exit(1)

def fetch_relay_config():
    url = f"{CENTRAL_SERVER_URL}/api/devices/{DEVICE_ID}/relays/config"
    headers = {'X-Device-Token': DEVICE_TOKEN}
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            with open(RELAY_CONFIG_PATH, 'w') as f:
                json.dump(data['relays'], f, indent=2)
            print(f"[agent] Synced relay config: {data['relays']}")
        else:
            print(f"[agent] Failed to fetch relay config: {resp.status_code} {resp.text}")
    except Exception as e:
        print(f"[agent] Exception fetching relay config: {e}")

def update_relay_status(relay_id, status):
    url = f"{CENTRAL_SERVER_URL}/api/relays/{relay_id}/status"
    headers = {'Content-Type': 'application/json', 'X-Device-Token': DEVICE_TOKEN}
    data = {'status': status}
    try:
        resp = requests.put(url, headers=headers, json=data, timeout=10)
        if resp.status_code == 200:
            print(f"[agent] Updated relay {relay_id} status to {status}")
        else:
            print(f"[agent] Failed to update relay {relay_id} status: {resp.status_code} {resp.text}")
    except Exception as e:
        print(f"[agent] Exception updating relay status: {e}")

def main():
    print(f"[agent] Starting agent for device {DEVICE_ID}")
    while True:
        fetch_relay_config()
        time.sleep(SYNC_INTERVAL)

if __name__ == '__main__':
    main() 
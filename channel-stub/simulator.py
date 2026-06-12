import threading
import requests
import random
import time

# Event simulation config
FAILURE_RATE = 0.10        # 10% messages fail
DELIVERY_DELAY = (1, 4)    # seconds
OPEN_RATE = 0.45           # 45% open karte hain
CLICK_RATE = 0.25          # 25% click karte hain
CONVERT_RATE = 0.10        # 10% convert karte hain
RETRY_DELAY = 30           # seconds baad retry

def simulate_message(comm, callback_url):
    """Single message ka full lifecycle simulate karo"""
    
    comm_id = comm['comm_id']
    idempotency_key = comm['idempotency_key']
    
    def send_event(event_type):
        """Callback CRM ko bhejo"""
        try:
            requests.post(callback_url, json={
                'comm_id': comm_id,
                'event_type': event_type,
                'idempotency_key': idempotency_key
            }, timeout=5)
            print(f"📡 Callback sent: {comm['customer_name']} → {event_type}")
        except Exception as e:
            print(f"❌ Callback failed: {e}")

    # Step 1 — Delivery attempt
    delay = random.uniform(*DELIVERY_DELAY)
    time.sleep(delay)

    # 10% fail hote hain
    if random.random() < FAILURE_RATE:
        send_event('failed')
        
        # Retry after 30 seconds
        def retry():
            time.sleep(RETRY_DELAY)
            print(f"🔄 Retrying: {comm['customer_name']}")
            # Retry mein 50% chance of success
            if random.random() < 0.5:
                send_event('delivered')
                simulate_engagement(comm, send_event)
            else:
                send_event('failed')
                print(f"❌ Permanently failed: {comm['customer_name']}")
        
        retry_thread = threading.Thread(target=retry)
        retry_thread.daemon = True
        retry_thread.start()
        return

    # Step 2 — Delivered
    send_event('delivered')

    # Step 3 — Simulate engagement
    simulate_engagement(comm, send_event)

def simulate_engagement(comm, send_event):
    """Engagement events simulate karo"""
    
    # Open kiya?
    time.sleep(random.uniform(2, 8))
    if random.random() < OPEN_RATE:
        send_event('opened')
        
        # Click kiya?
        time.sleep(random.uniform(1, 5))
        if random.random() < CLICK_RATE:
            send_event('clicked')
            
            # Convert kiya?
            time.sleep(random.uniform(2, 10))
            if random.random() < CONVERT_RATE:
                send_event('converted')

def process_campaign(campaign_id, communications, callback_url):
    """Campaign ke saare messages process karo"""
    
    print(f"\n🚀 Processing campaign: {campaign_id}")
    print(f"📨 Total messages: {len(communications)}")
    
    threads = []
    for comm in communications:
        t = threading.Thread(
            target=simulate_message,
            args=(comm, callback_url)
        )
        t.daemon = True
        threads.append(t)
    
    # Staggered start — ek saath nahi, thoda thoda karke
    for i, t in enumerate(threads):
        time.sleep(random.uniform(0.1, 0.5))
        t.start()
    
    print(f"✅ All {len(threads)} messages dispatched!")
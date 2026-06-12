from flask import Flask, jsonify, request
from flask_cors import CORS
import threading
from simulator import process_campaign

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'Channel Stub Running ✅'})

@app.route('/send', methods=['POST'])
def send():
    data = request.json
    
    campaign_id = data.get('campaign_id')
    communications = data.get('communications', [])
    callback_url = data.get('callback_url')
    
    if not campaign_id or not communications or not callback_url:
        return jsonify({'error': 'Missing fields'}), 400
    
    print(f"\n📥 Received campaign: {campaign_id}")
    print(f"📨 Messages to send: {len(communications)}")
    
    # Background mein process karo — immediately respond karo
    thread = threading.Thread(
        target=process_campaign,
        args=(campaign_id, communications, callback_url)
    )
    thread.daemon = True
    thread.start()
    
    return jsonify({
        'status': 'accepted',
        'campaign_id': campaign_id,
        'message_count': len(communications)
    }), 202

if __name__ == '__main__':
    app.run(debug=True, port=5001)
from flask import Blueprint, jsonify, request
from models import db, Communication, CommunicationEvent
from datetime import datetime
import json

receipts_bp = Blueprint('receipts', __name__)

# Event priority order
EVENT_ORDER = ['sent', 'delivered', 'opened', 'clicked', 'converted', 'failed']

@receipts_bp.route('/receipts', methods=['POST'])
def receive_receipt():
    data = request.json
    
    comm_id = data.get('comm_id')
    event_type = data.get('event_type')
    idempotency_key = data.get('idempotency_key')

    if not comm_id or not event_type:
        return jsonify({'error': 'Missing fields'}), 400

    # Find communication
    comm = Communication.query.get(comm_id)
    if not comm:
        return jsonify({'error': 'Communication not found'}), 404

    # ✅ IDEMPOTENCY CHECK
    # Agar yeh exact event pehle aa chuka hai toh ignore karo
    existing_event = CommunicationEvent.query.filter_by(
        communication_id=comm_id,
        event_type=event_type
    ).first()

    if existing_event:
        print(f"⚠️ Duplicate event ignored: {comm_id} - {event_type}")
        return jsonify({'status': 'duplicate_ignored'}), 200

    # ✅ EVENT ORDERING CHECK
    # Sirf valid progression allow karo
    existing_events = [e.event_type for e in comm.events]
    
    if event_type != 'failed':
        if event_type in EVENT_ORDER:
            current_index = EVENT_ORDER.index(event_type)
            # Check karo ki previous events exist karte hain
            if current_index > 1:  # delivered ke baad
                prev_event = EVENT_ORDER[current_index - 1]
                if prev_event not in existing_events and prev_event != 'sent':
                    print(f"⚠️ Out of order event: {event_type}")

    # ✅ Save new event
    new_event = CommunicationEvent(
        communication_id=comm_id,
        event_type=event_type,
        timestamp=datetime.utcnow()
    )
    db.session.add(new_event)

    # Update communication status
    if event_type == 'failed':
        comm.status = 'failed'
    elif event_type in EVENT_ORDER:
        comm.status = event_type

    db.session.commit()

    # ✅ Push SSE update to war room
    try:
        from routes.campaigns import push_update, get_campaign_stats
        stats = get_campaign_stats(comm.campaign_id)
        push_update(str(comm.campaign_id), {
            'type': 'stats_update',
            'campaign_id': str(comm.campaign_id),
            'stats': stats,
            'event': {
                'comm_id': comm_id,
                'event_type': event_type,
                'customer_name': comm.customer.name,
                'timestamp': datetime.utcnow().isoformat()
            }
        })
    except Exception as e:
        print(f"SSE push error: {e}")

    print(f"✅ Event saved: {comm.customer.name} - {event_type}")
    return jsonify({'status': 'ok'}), 200
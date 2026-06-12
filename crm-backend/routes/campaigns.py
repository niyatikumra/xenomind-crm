from flask import Blueprint, jsonify, request, Response
from models import db, Customer, Campaign, Communication, CommunicationEvent
from datetime import datetime
import uuid
import requests
import os
import json
import queue
import threading

campaigns_bp = Blueprint('campaigns', __name__)

# SSE queue for live updates
campaign_queues = {}

def get_queue(campaign_id):
    if campaign_id not in campaign_queues:
        campaign_queues[campaign_id] = queue.Queue()
    return campaign_queues[campaign_id]

def push_update(campaign_id, data):
    if campaign_id in campaign_queues:
        campaign_queues[campaign_id].put(data)

@campaigns_bp.route('/campaigns', methods=['GET'])
def get_campaigns():
    campaigns = Campaign.query.order_by(Campaign.created_at.desc()).all()
    result = []
    for c in campaigns:
        stats = get_campaign_stats(c.id)
        result.append({
            'id': c.id,
            'name': c.name,
            'segment_tag': c.segment_tag,
            'message': c.message,
            'channel': c.channel,
            'status': c.status,
            'created_at': c.created_at.isoformat(),
            'fired_at': c.fired_at.isoformat() if c.fired_at else None,
            'stats': stats
        })
    return jsonify(result)

@campaigns_bp.route('/campaigns/<campaign_id>', methods=['GET'])
def get_campaign(campaign_id):
    c = Campaign.query.get_or_404(campaign_id)
    stats = get_campaign_stats(campaign_id)
    return jsonify({
        'id': c.id,
        'name': c.name,
        'segment_tag': c.segment_tag,
        'message': c.message,
        'channel': c.channel,
        'status': c.status,
        'created_at': c.created_at.isoformat(),
        'fired_at': c.fired_at.isoformat() if c.fired_at else None,
        'stats': stats
    })

def get_campaign_stats(campaign_id):
    comms = Communication.query.filter_by(campaign_id=campaign_id).all()
    stats = {
        'total': len(comms),
        'sent': 0,
        'delivered': 0,
        'opened': 0,
        'clicked': 0,
        'converted': 0,
        'failed': 0
    }
    for comm in comms:
        statuses = [e.event_type for e in comm.events]
        if 'converted' in statuses:
            stats['converted'] += 1
        elif 'clicked' in statuses:
            stats['clicked'] += 1
        elif 'opened' in statuses:
            stats['opened'] += 1
        elif 'delivered' in statuses:
            stats['delivered'] += 1
        elif 'failed' in statuses:
            stats['failed'] += 1
        else:
            stats['sent'] += 1
    return stats

@campaigns_bp.route('/campaigns', methods=['POST'])
def create_campaign():
    data = request.json
    campaign = Campaign(
        name=data['name'],
        segment_tag=data['segment_tag'],
        message=data['message'],
        channel=data.get('channel', 'whatsapp'),
        status='draft'
    )
    db.session.add(campaign)
    db.session.commit()
    return jsonify({'id': campaign.id, 'status': 'created'}), 201

@campaigns_bp.route('/campaigns/<campaign_id>/fire', methods=['POST'])
def fire_campaign(campaign_id):
    campaign = Campaign.query.get_or_404(campaign_id)

    if campaign.segment_tag in ['all_customers', 'all', 'everyone']:
        customers = Customer.query.all()
    else:
        customers = Customer.query.filter_by(
            segment_tag=campaign.segment_tag
        ).all()

    if not customers:
        return jsonify({'error': 'No customers in this segment'}), 400

    # Create communications
    communications = []
    for customer in customers:
        idempotency_key = f"{campaign_id}:{customer.id}:v1"
        
        # Check if already exists
        existing = Communication.query.filter_by(
            idempotency_key=idempotency_key
        ).first()
        if existing:
            continue

        comm = Communication(
            campaign_id=campaign_id,
            customer_id=customer.id,
            channel=campaign.channel,
            status='sent',
            idempotency_key=idempotency_key
        )
        db.session.add(comm)
        db.session.flush()

        # Add sent event
        event = CommunicationEvent(
            communication_id=comm.id,
            event_type='sent'
        )
        db.session.add(event)
        communications.append({
            'comm_id': comm.id,
            'customer_name': customer.name,
            'customer_phone': customer.phone,
            'message': campaign.message.replace('{name}', customer.name),
            'channel': campaign.channel,
            'idempotency_key': idempotency_key
        })

    campaign.status = 'fired'
    campaign.fired_at = datetime.utcnow()
    db.session.commit()

    # Send to channel stub in background
    def send_to_stub():
        stub_url = os.getenv('CHANNEL_STUB_URL', 'http://localhost:5001')
        callback_url = os.getenv('CRM_CALLBACK_URL', 'http://localhost:5000')
        try:
            requests.post(f"{stub_url}/send", json={
                'campaign_id': campaign_id,
                'communications': communications,
                'callback_url': f"{callback_url}/api/receipts"
            }, timeout=5)
        except Exception as e:
            print(f"Channel stub error: {e}")

    thread = threading.Thread(target=send_to_stub)
    thread.daemon = True
    thread.start()

    return jsonify({
        'status': 'fired',
        'campaign_id': campaign_id,
        'total_sent': len(communications)
    })

# SSE endpoint for live updates
@campaigns_bp.route('/campaigns/<campaign_id>/stream', methods=['GET'])
def stream_campaign(campaign_id):
    def event_stream():
        q = get_queue(campaign_id)
        while True:
            try:
                data = q.get(timeout=30)
                yield f"data: {json.dumps(data)}\n\n"
            except queue.Empty:
                # Send heartbeat
                yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"

    return Response(
        event_stream(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'
        }
    )
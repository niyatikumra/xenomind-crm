from flask import Blueprint, jsonify, request
from models import db, Customer, Campaign
from datetime import datetime
import os
import requests as http_requests
import json
import re

chat_bp = Blueprint('chat', __name__)

def get_db_context():
    total_customers = Customer.query.count()
    segments = {
        'vip': Customer.query.filter_by(segment_tag='vip').count(),
        'slipped_vip': Customer.query.filter_by(segment_tag='slipped_vip').count(),
        'churned': Customer.query.filter_by(segment_tag='churned').count(),
        'at_risk': Customer.query.filter_by(segment_tag='at_risk').count(),
        'new': Customer.query.filter_by(segment_tag='new').count(),
        'loyal': Customer.query.filter_by(segment_tag='loyal').count(),
    }
    recent_campaigns = Campaign.query.order_by(
        Campaign.created_at.desc()
    ).limit(3).all()
    campaigns_info = []
    for c in recent_campaigns:
        campaigns_info.append(f"{c.name} ({c.status}) - segment: {c.segment_tag}")

    return f"""You are XenoMind, an AI assistant for DRIP — a trendy Indian fashion brand CRM.
You help the marketing manager make smart campaign decisions.

CURRENT DATA:
- Total customers: {total_customers}
- VIP customers (active, high spend): {segments['vip']}
- Slipped VIPs (were VIP, now 60+ days inactive): {segments['slipped_vip']}
- Churned customers (60+ days inactive): {segments['churned']}
- At-risk customers (showing dropoff): {segments['at_risk']}
- New customers (first purchase): {segments['new']}
- Loyal customers (regular buyers): {segments['loyal']}

RECENT CAMPAIGNS: {', '.join(campaigns_info) if campaigns_info else 'None yet'}

AVAILABLE SEGMENTS: vip, slipped_vip, churned, at_risk, new, loyal
AVAILABLE CHANNELS: whatsapp, sms, email, rcs

YOUR JOB:
When user asks to create/send a campaign, ALWAYS respond with a JSON block like this:
{{
  "intent": "create_campaign",
  "campaign_name": "...",
  "segment_tag": "...",
  "message": "...(use {{name}} for personalization)...",
  "channel": "...",
  "customer_count": <number>,
  "reasoning": "..."
}}

For general questions, respond naturally without JSON.
For campaign requests, ALWAYS include the JSON block.
Keep responses concise and actionable.
You understand Indian fashion market context."""

@chat_bp.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')
    conversation_history = data.get('history', [])

    if not user_message:
        return jsonify({'error': 'Message required'}), 400

    try:
        messages = [{"role": "system", "content": get_db_context()}]
        
        for msg in conversation_history:
            messages.append({
                "role": msg['role'],
                "content": msg['content']
            })
        
        messages.append({"role": "user", "content": user_message})

        response = http_requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
                "Content-Type": "application/json"
            },
            data=json.dumps({
                "model": "openai/gpt-oss-20b:free",
                "messages": messages
            })
        )

        result = response.json()
        
        if 'error' in result:
            print(f"OpenRouter returned error: {result['error']}")
            raise Exception(str(result['error']))

        ai_response = result['choices'][0]['message']['content']

        # Check if campaign intent detected
        campaign_data = None
        if '"intent": "create_campaign"' in ai_response:
            try:
                json_match = re.search(r'\{[\s\S]*"intent"[\s\S]*\}', ai_response)
                if json_match:
                    campaign_data = json.loads(json_match.group())
            except:
                pass

        return jsonify({
            'response': ai_response,
            'campaign_data': campaign_data
        })

    except Exception as e:
        print(f"OpenRouter API error: {e}")
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/campaigns/from-chat', methods=['POST'])
def create_campaign_from_chat():
    data = request.json
    try:
        campaign = Campaign(
            name=data['campaign_name'],
            segment_tag=data['segment_tag'],
            message=data['message'],
            channel=data.get('channel', 'whatsapp'),
            status='draft'
        )
        db.session.add(campaign)
        db.session.commit()
        return jsonify({
            'status': 'created',
            'campaign_id': campaign.id,
            'campaign': {
                'id': campaign.id,
                'name': campaign.name,
                'segment_tag': campaign.segment_tag,
                'message': campaign.message,
                'channel': campaign.channel,
                'status': campaign.status
            }
        }), 201
    except Exception as e:
        print(f"OpenRouter API error: {e}")
        
        # Fallback response agar API fail ho jaye
        msg_lower = user_message.lower()
        
        if any(word in msg_lower for word in ['churn', 'inactive', 'win back', 'win-back', '60 day', 'come back']):
            segment = 'churned'
            campaign_msg = "Hey {name}! DRIP misses you 💫 It's been a while — here's 20% off to welcome you back. Code: COMEBACK20"
            camp_name = "Win Back Campaign"
        elif any(word in msg_lower for word in ['vip', 'loyal', 'reward', 'early access']):
            segment = 'vip'
            campaign_msg = "Hey {name}, you're DRIP royalty 👑 Early access to our new drop — just for you!"
            camp_name = "VIP Early Access"
        elif any(word in msg_lower for word in ['new', 'welcome', 'first']):
            segment = 'new'
            campaign_msg = "Welcome to DRIP, {name}! 👋 Here's 15% off your next order. Code: DRIPMORE"
            camp_name = "Welcome Campaign"
        else:
            segment = 'at_risk'
            campaign_msg = "Hey {name}! New collection just dropped 🔥 Don't miss out — shop now!"
            camp_name = "Collection Alert"

        fallback_json = {
            "intent": "create_campaign",
            "campaign_name": camp_name,
            "segment_tag": segment,
            "message": campaign_msg,
            "channel": "whatsapp",
            "customer_count": 0,
            "reasoning": "XenoMind is running on backup logic right now, but still picked the best segment and message based on your request."
        }

        return jsonify({
            'response': f"I'm running on backup mode right now (high demand), but here's a campaign based on your request:\n\n{json.dumps(fallback_json, indent=2)}",
            'campaign_data': fallback_json
        })
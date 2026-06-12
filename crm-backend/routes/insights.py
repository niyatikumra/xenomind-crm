from flask import Blueprint, jsonify
from models import db, Customer, Campaign
from datetime import datetime, timedelta

insights_bp = Blueprint('insights', __name__)

@insights_bp.route('/insights', methods=['GET'])
def get_insights():
    now = datetime.utcnow()
    insights = []

    # Insight 1 — Slipped VIPs
    slipped_vips = Customer.query.filter_by(segment_tag='slipped_vip').all()
    if slipped_vips:
        names = [c.name.split()[0] for c in slipped_vips[:3]]
        insights.append({
            'id': 'slipped_vip',
            'priority': 'high',
            'emoji': '🔴',
            'title': f'{len(slipped_vips)} VIP customers are slipping away',
            'description': f'{", ".join(names)} and {len(slipped_vips)-3} others haven\'t shopped in 60+ days. They used to love DRIP.',
            'segment_tag': 'slipped_vip',
            'customer_count': len(slipped_vips),
            'suggested_message': "Hey {name}! DRIP misses you 💫 Your style deserves an upgrade. Here's 20% off just for you — Code: COMEBACK20. Valid 48hrs only!",
            'suggested_channel': 'whatsapp',
            'action': 'Start Win-Back Campaign'
        })

    # Insight 2 — Churned customers
    churned = Customer.query.filter_by(segment_tag='churned').all()
    if churned:
        insights.append({
            'id': 'churned',
            'priority': 'high',
            'emoji': '🔴',
            'title': f'{len(churned)} customers have gone cold',
            'description': f'These customers haven\'t purchased in 60+ days. A targeted offer could bring them back.',
            'segment_tag': 'churned',
            'customer_count': len(churned),
            'suggested_message': "Hey {name}! It's been a while 👀 New drops just landed at DRIP — and we saved your size. Shop now & get free shipping. Code: WEBACK",
            'suggested_channel': 'sms',
            'action': 'Launch Re-engagement Campaign'
        })

    # Insight 3 — At risk
    at_risk = Customer.query.filter_by(segment_tag='at_risk').all()
    if at_risk:
        insights.append({
            'id': 'at_risk',
            'priority': 'medium',
            'emoji': '🟡',
            'title': f'{len(at_risk)} customers showing drop-off signs',
            'description': f'Purchase frequency is declining. Catch them before they churn.',
            'segment_tag': 'at_risk',
            'customer_count': len(at_risk),
            'suggested_message': "Hey {name}! New collection just dropped 🔥 Styles selling fast — grab yours before it's gone. Shop DRIP now!",
            'suggested_channel': 'whatsapp',
            'action': 'Send Collection Alert'
        })

    # Insight 4 — New customers
    new_customers = Customer.query.filter_by(segment_tag='new').all()
    if new_customers:
        insights.append({
            'id': 'new',
            'priority': 'medium',
            'emoji': '🟡',
            'title': f'{len(new_customers)} new customers need nurturing',
            'description': f'First-time buyers who haven\'t returned yet. A welcome nudge increases retention by 3x.',
            'segment_tag': 'new',
            'customer_count': len(new_customers),
            'suggested_message': "Welcome to DRIP, {name}! 👋 You've got great taste. Here's 15% off your next order — because first love deserves a sequel. Code: DRIPMORE",
            'suggested_channel': 'email',
            'action': 'Send Welcome Campaign'
        })

    # Insight 5 — VIP appreciation
    vips = Customer.query.filter_by(segment_tag='vip').all()
    if vips:
        insights.append({
            'id': 'vip',
            'priority': 'low',
            'emoji': '🟢',
            'title': f'{len(vips)} VIP customers deserve recognition',
            'description': f'Your most loyal shoppers. Reward them before they feel ignored.',
            'segment_tag': 'vip',
            'customer_count': len(vips),
            'suggested_message': "Hey {name}, you're officially DRIP royalty 👑 Early access to our new drop — just for you. Shop 24hrs before everyone else!",
            'suggested_channel': 'whatsapp',
            'action': 'Send VIP Early Access'
        })

    # Stats summary
    total_customers = Customer.query.count()
    total_campaigns = Campaign.query.count()
    fired_campaigns = Campaign.query.filter_by(status='fired').count()

    return jsonify({
        'insights': insights[:3],  # Top 3 only on dashboard
        'all_insights': insights,
        'stats': {
            'total_customers': total_customers,
            'total_campaigns': total_campaigns,
            'fired_campaigns': fired_campaigns,
            'segments': {
                'vip': len(vips) if vips else 0,
                'slipped_vip': len(slipped_vips) if slipped_vips else 0,
                'churned': len(churned) if churned else 0,
                'at_risk': len(at_risk) if at_risk else 0,
                'new': len(new_customers) if new_customers else 0,
            }
        }
    })
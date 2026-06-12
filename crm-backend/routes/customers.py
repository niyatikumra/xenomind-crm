from flask import Blueprint, jsonify, request
from models import db, Customer, Order

customers_bp = Blueprint('customers', __name__)

@customers_bp.route('/customers', methods=['GET'])
def get_customers():
    customers = Customer.query.all()
    result = []
    for c in customers:
        result.append({
            'id': c.id,
            'name': c.name,
            'email': c.email,
            'phone': c.phone,
            'city': c.city,
            'total_spent': c.total_spent,
            'last_purchase_date': c.last_purchase_date.isoformat() if c.last_purchase_date else None,
            'segment_tag': c.segment_tag,
            'order_count': len(c.orders)
        })
    return jsonify(result)

@customers_bp.route('/customers/<customer_id>', methods=['GET'])
def get_customer(customer_id):
    c = Customer.query.get_or_404(customer_id)
    orders = []
    for o in c.orders:
        orders.append({
            'id': o.id,
            'product_name': o.product_name,
            'amount': o.amount,
            'category': o.category,
            'order_date': o.order_date.isoformat()
        })
    return jsonify({
        'id': c.id,
        'name': c.name,
        'email': c.email,
        'phone': c.phone,
        'city': c.city,
        'total_spent': c.total_spent,
        'segment_tag': c.segment_tag,
        'orders': orders
    })

@customers_bp.route('/segments', methods=['GET'])
def get_segments():
    from datetime import datetime, timedelta
    now = datetime.utcnow()

    segments = {
        'vip': Customer.query.filter(
            Customer.segment_tag == 'vip'
        ).count(),
        'slipped_vip': Customer.query.filter(
            Customer.segment_tag == 'slipped_vip'
        ).count(),
        'churned': Customer.query.filter(
            Customer.segment_tag == 'churned'
        ).count(),
        'at_risk': Customer.query.filter(
            Customer.segment_tag == 'at_risk'
        ).count(),
        'new': Customer.query.filter(
            Customer.segment_tag == 'new'
        ).count(),
        'loyal': Customer.query.filter(
            Customer.segment_tag == 'loyal'
        ).count(),
    }
    return jsonify(segments)
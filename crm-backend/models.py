from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

def generate_uuid():
    return str(uuid.uuid4())

class Customer(db.Model):
    __tablename__ = 'customers'
    id = db.Column(db.String, primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    city = db.Column(db.String(50))
    total_spent = db.Column(db.Float, default=0.0)
    last_purchase_date = db.Column(db.DateTime)
    segment_tag = db.Column(db.String(50), default='new')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    orders = db.relationship('Order', backref='customer', lazy=True)
    communications = db.relationship('Communication', backref='customer', lazy=True)

class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.String, primary_key=True, default=generate_uuid)
    customer_id = db.Column(db.String, db.ForeignKey('customers.id'), nullable=False)
    product_name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50))
    order_date = db.Column(db.DateTime, default=datetime.utcnow)

class Campaign(db.Model):
    __tablename__ = 'campaigns'
    id = db.Column(db.String, primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False)
    segment_tag = db.Column(db.String(50))
    message = db.Column(db.Text, nullable=False)
    channel = db.Column(db.String(20), default='whatsapp')
    status = db.Column(db.String(20), default='draft')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    fired_at = db.Column(db.DateTime)
    communications = db.relationship('Communication', backref='campaign', lazy=True)

class Communication(db.Model):
    __tablename__ = 'communications'
    id = db.Column(db.String, primary_key=True, default=generate_uuid)
    campaign_id = db.Column(db.String, db.ForeignKey('campaigns.id'), nullable=False)
    customer_id = db.Column(db.String, db.ForeignKey('customers.id'), nullable=False)
    channel = db.Column(db.String(20))
    status = db.Column(db.String(20), default='sent')
    idempotency_key = db.Column(db.String(100), unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    events = db.relationship('CommunicationEvent', backref='communication', lazy=True)

class CommunicationEvent(db.Model):
    __tablename__ = 'communication_events'
    id = db.Column(db.String, primary_key=True, default=generate_uuid)
    communication_id = db.Column(db.String, db.ForeignKey('communications.id'), nullable=False)
    event_type = db.Column(db.String(20))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
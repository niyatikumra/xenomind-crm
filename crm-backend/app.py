from flask import Flask
from flask_cors import CORS
from models import db
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Database config
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///xenomind.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Init DB
db.init_app(app)

# Register routes
from routes.customers import customers_bp
from routes.campaigns import campaigns_bp
from routes.insights import insights_bp
from routes.chat import chat_bp
from routes.receipts import receipts_bp

app.register_blueprint(customers_bp, url_prefix='/api')
app.register_blueprint(campaigns_bp, url_prefix='/api')
app.register_blueprint(insights_bp, url_prefix='/api')
app.register_blueprint(chat_bp, url_prefix='/api')
app.register_blueprint(receipts_bp, url_prefix='/api')

# Create tables
with app.app_context():
    db.create_all()
    print("✅ Database tables created!")

if __name__ == '__main__':
    app.run(debug=True, port=5000)
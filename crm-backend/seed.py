from app import app
from models import db, Customer, Order
from datetime import datetime, timedelta
import random

products = [
    ("Oversized Hoodie", "topwear", 2499),
    ("Baggy Cargo Pants", "bottomwear", 3299),
    ("Varsity Jacket", "outerwear", 4999),
    ("Graphic Tee", "topwear", 999),
    ("Wide Leg Jeans", "bottomwear", 2999),
    ("Bomber Jacket", "outerwear", 5499),
    ("Ribbed Tank Top", "topwear", 799),
    ("Track Pants", "bottomwear", 1799),
    ("Denim Jacket", "outerwear", 4499),
    ("Printed Co-ord Set", "co-ord", 3499),
    ("Knit Sweater", "topwear", 2299),
    ("Pleated Skirt", "bottomwear", 1999),
    ("Puffer Vest", "outerwear", 3999),
    ("Slip Dress", "dress", 2199),
    ("Relaxed Chinos", "bottomwear", 2799),
]

customers_data = [
    ("Priya Sharma", "priya.sharma@gmail.com", "9876543210", "Mumbai"),
    ("Rahul Mehta", "rahul.mehta@gmail.com", "9876543211", "Delhi"),
    ("Sneha Patel", "sneha.patel@gmail.com", "9876543212", "Pune"),
    ("Arjun Singh", "arjun.singh@gmail.com", "9876543213", "Bangalore"),
    ("Kavya Nair", "kavya.nair@gmail.com", "9876543214", "Chennai"),
    ("Rohan Gupta", "rohan.gupta@gmail.com", "9876543215", "Hyderabad"),
    ("Ananya Joshi", "ananya.joshi@gmail.com", "9876543216", "Mumbai"),
    ("Vikram Reddy", "vikram.reddy@gmail.com", "9876543217", "Bangalore"),
    ("Ishaan Kapoor", "ishaan.kapoor@gmail.com", "9876543218", "Delhi"),
    ("Meera Iyer", "meera.iyer@gmail.com", "9876543219", "Chennai"),
    ("Aditya Kumar", "aditya.kumar@gmail.com", "9876543220", "Pune"),
    ("Riya Desai", "riya.desai@gmail.com", "9876543221", "Ahmedabad"),
    ("Karan Malhotra", "karan.malhotra@gmail.com", "9876543222", "Mumbai"),
    ("Pooja Verma", "pooja.verma@gmail.com", "9876543223", "Delhi"),
    ("Siddharth Rao", "siddharth.rao@gmail.com", "9876543224", "Bangalore"),
    ("Tanvi Kulkarni", "tanvi.kulkarni@gmail.com", "9876543225", "Pune"),
    ("Nikhil Shah", "nikhil.shah@gmail.com", "9876543226", "Surat"),
    ("Divya Menon", "divya.menon@gmail.com", "9876543227", "Kochi"),
    ("Aarav Tiwari", "aarav.tiwari@gmail.com", "9876543228", "Lucknow"),
    ("Shreya Bose", "shreya.bose@gmail.com", "9876543229", "Kolkata"),
    ("Manav Chopra", "manav.chopra@gmail.com", "9876543230", "Delhi"),
    ("Nisha Pillai", "nisha.pillai@gmail.com", "9876543231", "Trivandrum"),
    ("Rajat Saxena", "rajat.saxena@gmail.com", "9876543232", "Agra"),
    ("Simran Kaur", "simran.kaur@gmail.com", "9876543233", "Chandigarh"),
    ("Yash Agarwal", "yash.agarwal@gmail.com", "9876543234", "Jaipur"),
    ("Tara Bhatt", "tara.bhatt@gmail.com", "9876543235", "Dehradun"),
    ("Kunal Sinha", "kunal.sinha@gmail.com", "9876543236", "Patna"),
    ("Aditi Pandey", "aditi.pandey@gmail.com", "9876543237", "Varanasi"),
    ("Harsh Vardhan", "harsh.vardhan@gmail.com", "9876543238", "Noida"),
    ("Pari Thakur", "pari.thakur@gmail.com", "9876543239", "Shimla"),
    ("Dev Anand", "dev.anand@gmail.com", "9876543240", "Mumbai"),
    ("Zara Khan", "zara.khan@gmail.com", "9876543241", "Delhi"),
    ("Ayaan Mirza", "ayaan.mirza@gmail.com", "9876543242", "Hyderabad"),
    ("Kritika Jain", "kritika.jain@gmail.com", "9876543243", "Indore"),
    ("Sahil Negi", "sahil.negi@gmail.com", "9876543244", "Manali"),
    ("Bhavna Soni", "bhavna.soni@gmail.com", "9876543245", "Rajkot"),
    ("Parth Trivedi", "parth.trivedi@gmail.com", "9876543246", "Vadodara"),
    ("Khushi Mishra", "khushi.mishra@gmail.com", "9876543247", "Bhopal"),
    ("Rehan Sheikh", "rehan.sheikh@gmail.com", "9876543248", "Pune"),
    ("Naina Rawat", "naina.rawat@gmail.com", "9876543249", "Haridwar"),
    ("Veer Pratap", "veer.pratap@gmail.com", "9876543250", "Lucknow"),
    ("Anvi Sharma", "anvi.sharma@gmail.com", "9876543251", "Jaipur"),
    ("Kabir Das", "kabir.das@gmail.com", "9876543252", "Kolkata"),
    ("Mahi Patel", "mahi.patel@gmail.com", "9876543253", "Surat"),
    ("Rishabh Joshi", "rishabh.joshi@gmail.com", "9876543254", "Nashik"),
    ("Sana Qureshi", "sana.qureshi@gmail.com", "9876543255", "Mumbai"),
    ("Dhruv Malhotra", "dhruv.malhotra@gmail.com", "9876543256", "Gurgaon"),
    ("Pihu Aggarwal", "pihu.aggarwal@gmail.com", "9876543257", "Amritsar"),
    ("Arnav Bhatia", "arnav.bhatia@gmail.com", "9876543258", "Delhi"),
    ("Lavanya Rao", "lavanya.rao@gmail.com", "9876543259", "Vizag"),
]

def get_segment(days_inactive, total_spent, order_count):
    if days_inactive > 60 and total_spent > 5000:
        return "slipped_vip"
    elif days_inactive > 60:
        return "churned"
    elif days_inactive <= 15 and total_spent > 10000:
        return "vip"
    elif order_count == 1:
        return "new"
    elif days_inactive <= 30:
        return "loyal"
    else:
        return "at_risk"

def seed():
    with app.app_context():
        db.drop_all()
        db.create_all()

        print("🌱 Seeding DRIP customers...")

        for i, (name, email, phone, city) in enumerate(customers_data):
            # Different activity patterns
            if i < 10:
                days_inactive = random.randint(1, 15)      # Active/VIP
            elif i < 20:
                days_inactive = random.randint(61, 90)     # Churned
            elif i < 30:
                days_inactive = random.randint(16, 45)     # At risk
            else:
                days_inactive = random.randint(1, 90)      # Mixed

            last_purchase = datetime.utcnow() - timedelta(days=days_inactive)
            order_count = random.randint(1, 8)
            total_spent = 0

            customer = Customer(
                name=name,
                email=email,
                phone=phone,
                city=city,
                last_purchase_date=last_purchase,
            )
            db.session.add(customer)
            db.session.flush()

            # Create orders
            for j in range(order_count):
                product, category, base_price = random.choice(products)
                price = base_price + random.randint(-200, 500)
                order_date = last_purchase - timedelta(days=random.randint(0, 180))

                order = Order(
                    customer_id=customer.id,
                    product_name=product,
                    amount=price,
                    category=category,
                    order_date=order_date
                )
                db.session.add(order)
                total_spent += price

            customer.total_spent = total_spent
            customer.segment_tag = get_segment(days_inactive, total_spent, order_count)

        db.session.commit()
        print(f"✅ 50 customers seeded!")
        print(f"✅ Orders seeded!")
        print("🎉 DRIP data ready!")

if __name__ == '__main__':
    seed()
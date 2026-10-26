import uuid
from datetime import datetime
from app.database import connection
from app.services.auth_service import hash_password

def seed_database():
    print("Initializing database tables...")
    connection.init_db()

    conn = connection.get_connection()
    cursor = conn.cursor()

    # Clear existing tables to ensure a clean, reproducible seed state
    cursor.execute("DELETE FROM reservations")
    cursor.execute("DELETE FROM prescriptions")
    cursor.execute("DELETE FROM frames")
    cursor.execute("DELETE FROM sessions")
    cursor.execute("DELETE FROM users")
    conn.commit()

    print("Seeding Admin and Customers...")
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    # 1. Admin Account
    admin_id = str(uuid.uuid4())
    cursor.execute('''
        INSERT INTO users (id, name, email, password_hash, role, phone, dob, address, created_at)
        VALUES (?, ?, ?, ?, 'admin', ?, ?, ?, ?)
    ''', (admin_id, "Shop Admin", "admin@specsup.com", hash_password("admin123"), "+91 98765 43210", "1985-05-15", "SpecsUp Optical Shop, MG Road, Mumbai", now_str))

    # 2. Customers
    customers = [
        {
            "name": "Rahul Sharma",
            "email": "rahul@gmail.com",
            "password": "password123",
            "phone": "+91 98201 11223",
            "dob": "1998-04-12",
            "address": "A-402, Sunshine Heights, Andheri West, Mumbai",
            "case": "increasing" # Rapid myopic progression
        },
        {
            "name": "Ananya Patel",
            "email": "ananya@gmail.com",
            "password": "password123",
            "phone": "+91 98332 44556",
            "dob": "1996-09-25",
            "address": "12, Nilgiri Enclave, Satellite, Ahmedabad",
            "case": "stable" # Perfectly stable power
        },
        {
            "name": "Vikram Singh",
            "email": "vikram@gmail.com",
            "password": "password123",
            "phone": "+91 99110 77889",
            "dob": "2001-11-03",
            "address": "Plot 55, Sector 14, Gurgaon",
            "case": "single" # Only 1 checkup (insufficient data test)
        },
        {
            "name": "Neha Gupta",
            "email": "neha@gmail.com",
            "password": "password123",
            "phone": "+91 98112 33445",
            "dob": "1994-01-30",
            "address": "Flat 3B, Lakeview Apts, Koramangala, Bengaluru",
            "case": "decreasing" # Hyperopic shift / power decreasing
        },
        {
            "name": "Arjun Mehta",
            "email": "arjun@gmail.com",
            "password": "password123",
            "phone": "+91 97234 56789",
            "dob": "1999-07-19",
            "address": "C-14, Green Park Extension, New Delhi",
            "case": "astigmatic"
        }
    ]

    customer_ids = {}
    for c in customers:
        cid = str(uuid.uuid4())
        customer_ids[c["email"]] = cid
        cursor.execute('''
            INSERT INTO users (id, name, email, password_hash, role, phone, dob, address, created_at)
            VALUES (?, ?, ?, ?, 'customer', ?, ?, ?, ?)
        ''', (cid, c["name"], c["email"], hash_password(c["password"]), c["phone"], c["dob"], c["address"], now_str))

    print("Seeding Prescriptions...")
    # Prescriptions for Rahul Sharma (Case: Increasing Myopia)
    rahul_id = customer_ids["rahul@gmail.com"]
    cursor.execute('''
        INSERT INTO prescriptions (id, customer_id, checkup_date, right_sph, right_cyl, right_axis, right_pd, left_sph, left_cyl, left_axis, left_pd, notes, created_at)
        VALUES (?, ?, '2024-01-10', -1.25, -0.25, 90, 31.5, -1.50, -0.50, 85, 31.0, 'Mild eye strain after screen usage. Baseline examination.', '2024-01-10 11:00:00')
    ''', (str(uuid.uuid4()), rahul_id))
    cursor.execute('''
        INSERT INTO prescriptions (id, customer_id, checkup_date, right_sph, right_cyl, right_axis, right_pd, left_sph, left_cyl, left_axis, left_pd, notes, created_at)
        VALUES (?, ?, '2025-01-15', -1.50, -0.50, 90, 31.5, -1.75, -0.50, 85, 31.0, 'Complained of slight blurriness when driving at night.', '2025-01-15 14:30:00')
    ''', (str(uuid.uuid4()), rahul_id))
    cursor.execute('''
        INSERT INTO prescriptions (id, customer_id, checkup_date, right_sph, right_cyl, right_axis, right_pd, left_sph, left_cyl, left_axis, left_pd, notes, created_at)
        VALUES (?, ?, '2026-01-20', -2.00, -0.75, 90, 32.0, -2.25, -0.75, 85, 31.0, 'Progressive myopic shift confirmed. Anti-glare coating prescribed.', '2026-01-20 16:45:00')
    ''', (str(uuid.uuid4()), rahul_id))

    # Prescriptions for Ananya Patel (Case: Stable)
    ananya_id = customer_ids["ananya@gmail.com"]
    cursor.execute('''
        INSERT INTO prescriptions (id, customer_id, checkup_date, right_sph, right_cyl, right_axis, right_pd, left_sph, left_cyl, left_axis, left_pd, notes, created_at)
        VALUES (?, ?, '2024-03-05', -0.75, -0.25, 180, 30.5, -0.75, -0.25, 175, 30.5, 'Routine first visit. Comfortable with existing power.', '2024-03-05 10:15:00')
    ''', (str(uuid.uuid4()), ananya_id))
    cursor.execute('''
        INSERT INTO prescriptions (id, customer_id, checkup_date, right_sph, right_cyl, right_axis, right_pd, left_sph, left_cyl, left_axis, left_pd, notes, created_at)
        VALUES (?, ?, '2025-03-10', -0.75, -0.25, 180, 30.5, -0.75, -0.25, 175, 30.5, 'Annual checkup. No changes in visual acuity observed.', '2025-03-10 11:30:00')
    ''', (str(uuid.uuid4()), ananya_id))
    cursor.execute('''
        INSERT INTO prescriptions (id, customer_id, checkup_date, right_sph, right_cyl, right_axis, right_pd, left_sph, left_cyl, left_axis, left_pd, notes, created_at)
        VALUES (?, ?, '2026-03-12', -0.75, -0.25, 180, 30.5, -0.75, -0.25, 175, 30.5, 'Prescription remains rock-solid stable. Frame updated.', '2026-03-12 15:00:00')
    ''', (str(uuid.uuid4()), ananya_id))

    # Prescriptions for Vikram Singh (Case: Single checkup)
    vikram_id = customer_ids["vikram@gmail.com"]
    cursor.execute('''
        INSERT INTO prescriptions (id, customer_id, checkup_date, right_sph, right_cyl, right_axis, right_pd, left_sph, left_cyl, left_axis, left_pd, notes, created_at)
        VALUES (?, ?, '2026-02-14', -1.00, 0.00, 0, 32.0, -1.00, 0.00, 0, 32.0, 'Initial college checkup. Recommended follow-up in 12 months.', '2026-02-14 09:30:00')
    ''', (str(uuid.uuid4()), vikram_id))

    # Prescriptions for Neha Gupta (Case: Decreasing minus power / Hyperopic shift)
    neha_id = customer_ids["neha@gmail.com"]
    cursor.execute('''
        INSERT INTO prescriptions (id, customer_id, checkup_date, right_sph, right_cyl, right_axis, right_pd, left_sph, left_cyl, left_axis, left_pd, notes, created_at)
        VALUES (?, ?, '2024-05-10', -2.50, -0.50, 95, 31.0, -2.75, -0.50, 80, 31.0, 'Severe headaches from overcorrected lenses.', '2024-05-10 12:00:00')
    ''', (str(uuid.uuid4()), neha_id))
    cursor.execute('''
        INSERT INTO prescriptions (id, customer_id, checkup_date, right_sph, right_cyl, right_axis, right_pd, left_sph, left_cyl, left_axis, left_pd, notes, created_at)
        VALUES (?, ?, '2025-06-15', -2.00, -0.25, 95, 31.0, -2.25, -0.25, 80, 31.0, 'Eye strain substantially reduced. Vision comfort restored.', '2025-06-15 14:15:00')
    ''', (str(uuid.uuid4()), neha_id))
    cursor.execute('''
        INSERT INTO prescriptions (id, customer_id, checkup_date, right_sph, right_cyl, right_axis, right_pd, left_sph, left_cyl, left_axis, left_pd, notes, created_at)
        VALUES (?, ?, '2026-07-20', -1.75, 0.00, 95, 31.0, -1.75, 0.00, 80, 31.0, 'Lens relaxed, continuing positive visual stability.', '2026-07-20 17:00:00')
    ''', (str(uuid.uuid4()), neha_id))

    print("Seeding Frames...")
    frames = [
        {
            "name": "Titan Classic Wayfarer",
            "brand": "Titan Eyeplus",
            "price": 2499.00,
            "image_url": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80",
            "quantity": 4,
            "description": "Timeless black wayfarer crafted with premium lightweight acetate for everyday durability.",
            "lens_width_mm": 50.0,
            "lens_height_mm": 38.0,
            "bridge_width_mm": 18.0,
            "frame_shape": "Wayfarer",
            "frame_material": "Acetate",
            "frame_status": "active"
        },
        {
            "name": "Ray-Ban Clubmaster Retro",
            "brand": "Ray-Ban",
            "price": 5999.00,
            "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
            "quantity": 2,
            "description": "Iconic semi-rimless browline frame in tortoiseshell and gold accents.",
            "lens_width_mm": 49.0,
            "lens_height_mm": 37.0,
            "bridge_width_mm": 20.0,
            "frame_shape": "Browline",
            "frame_material": "Acetate & Metal",
            "frame_status": "active"
        },
        {
            "name": "Fastrack Urban Aviator",
            "brand": "Fastrack",
            "price": 1899.00,
            "image_url": "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=600&q=80",
            "quantity": 5,
            "description": "Ultra-sleek gunmetal stainless steel aviator frame with adjustable silicon nose pads.",
            "lens_width_mm": 55.0,
            "lens_height_mm": 48.0,
            "bridge_width_mm": 14.0,
            "frame_shape": "Aviator",
            "frame_material": "Stainless Steel",
            "frame_status": "active"
        },
        {
            "name": "Vogue Chic Round",
            "brand": "Vogue Eyewear",
            "price": 3499.00,
            "image_url": "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=600&q=80",
            "quantity": 3,
            "description": "Modern circular silhouette in polished rose gold, perfect for petite faces.",
            "lens_width_mm": 48.0,
            "lens_height_mm": 44.0,
            "bridge_width_mm": 19.0,
            "frame_shape": "Round",
            "frame_material": "Metal",
            "frame_status": "active"
        },
        {
            "name": "Oakley Holbrook Sport",
            "brand": "Oakley",
            "price": 6499.00,
            "image_url": "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=600&q=80",
            "quantity": 1,
            "description": "Ergonomic O-Matter stress-resistant frame built for active sports and outdoor lifestyle.",
            "lens_width_mm": 54.0,
            "lens_height_mm": 43.0,
            "bridge_width_mm": 18.0,
            "frame_shape": "Square",
            "frame_material": "O-Matter",
            "frame_status": "active"
        },
        {
            "name": "John Jacobs Havana Square",
            "brand": "John Jacobs",
            "price": 3999.00,
            "image_url": "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=600&q=80",
            "quantity": 6,
            "description": "Rich Italian acetate frame with hand-polished bevelled edges and flexible spring hinges.",
            "lens_width_mm": 51.0,
            "lens_height_mm": 39.0,
            "bridge_width_mm": 19.0,
            "frame_shape": "Square",
            "frame_material": "Italian Acetate",
            "frame_status": "active"
        },
        {
            "name": "Carrera Speedway Pilot",
            "brand": "Carrera",
            "price": 4799.00,
            "image_url": "https://images.unsplash.com/photo-1509695507497-903c140c43b0?auto=format&fit=crop&w=600&q=80",
            "quantity": 0, # Out of stock demonstration
            "description": "Distinctive double-bridge pilot frame with Carrera signature 'C' monogram on the bridge.",
            "lens_width_mm": 56.0,
            "lens_height_mm": 49.0,
            "bridge_width_mm": 15.0,
            "frame_shape": "Pilot",
            "frame_material": "Metal",
            "frame_status": "active"
        },
        {
            "name": "Polaroid Eco Cat-Eye",
            "brand": "Polaroid",
            "price": 2799.00,
            "image_url": "https://images.unsplash.com/photo-1582142839970-2b93cbacbe4b?auto=format&fit=crop&w=600&q=80",
            "quantity": 3,
            "description": "Sustainable bio-based polyamide cat-eye frame in translucent slate grey.",
            "lens_width_mm": 52.0,
            "lens_height_mm": 41.0,
            "bridge_width_mm": 17.0,
            "frame_shape": "Cat-Eye",
            "frame_material": "Polyamide",
            "frame_status": "active"
        },
        {
            "name": "Heritage Unmeasured Rimless",
            "brand": "SpecsUp Heritage",
            "price": 2199.00,
            "image_url": "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=600&q=80",
            "quantity": 2,
            "description": "Classic minimal rimless frame awaiting dimensional assessment by shop optician.",
            "lens_width_mm": None,
            "lens_height_mm": None,
            "bridge_width_mm": None,
            "frame_shape": "Rimless",
            "frame_material": "Titanium",
            "frame_status": "active"
        }
    ]

    frame_ids = []
    for f in frames:
        fid = str(uuid.uuid4())
        frame_ids.append(fid)
        cursor.execute('''
            INSERT INTO frames (
                id, name, brand, price, image_url, quantity, description,
                lens_width_mm, lens_height_mm, bridge_width_mm,
                frame_shape, frame_material, frame_status,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            fid, f["name"], f["brand"], f["price"], f["image_url"], f["quantity"], f["description"],
            f.get("lens_width_mm"), f.get("lens_height_mm"), f.get("bridge_width_mm"),
            f.get("frame_shape"), f.get("frame_material"), f.get("frame_status", "active"),
            now_str, now_str
        ))

    print("Seeding Sample Reservations...")
    # Rahul has pre-booked Titan Classic
    cursor.execute('''
        INSERT INTO reservations (id, customer_id, frame_id, reservation_date)
        VALUES (?, ?, ?, '2026-09-20 11:30:00')
    ''', (str(uuid.uuid4()), rahul_id, frame_ids[0]))

    # Ananya has pre-booked Ray-Ban Clubmaster
    cursor.execute('''
        INSERT INTO reservations (id, customer_id, frame_id, reservation_date)
        VALUES (?, ?, ?, '2026-09-22 14:10:00')
    ''', (str(uuid.uuid4()), ananya_id, frame_ids[1]))

    conn.commit()
    conn.close()

    print("Database successfully seeded!")
    print("Admin account: admin@specsup.com / admin123")
    print("Sample customer: rahul@gmail.com / password123 (increasing myopia)")
    print("Sample customer: ananya@gmail.com / password123 (stable)")
    print("Sample customer: vikram@gmail.com / password123 (single checkup)")

if __name__ == "__main__":
    seed_database()


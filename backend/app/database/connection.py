import os
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# In serverless environments (e.g. Vercel Lambda), the app folder is read-only.
# We copy bundled specsup.db to /tmp so SQLite write operations work smoothly.
if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
    import shutil
    TMP_DB = Path("/tmp/specsup.db")
    BUNDLED_DB = BASE_DIR / "specsup.db"
    if not TMP_DB.exists() and BUNDLED_DB.exists():
        shutil.copy2(BUNDLED_DB, TMP_DB)
    DB_FILE = TMP_DB
else:
    DB_FILE = BASE_DIR / "specsup.db"

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip()

def get_connection():
    """Returns a SQLite connection with foreign keys enabled and row_factory set to dict."""
    conn = sqlite3.connect(str(DB_FILE))
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes tables if they do not exist."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Users
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
        phone TEXT,
        dob TEXT,
        address TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    ''')
    
    # 2. Frames
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS frames (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        brand TEXT NOT NULL,
        price REAL NOT NULL CHECK (price >= 0),
        image_url TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
        description TEXT,
        lens_width_mm REAL,
        lens_height_mm REAL,
        bridge_width_mm REAL,
        frame_shape TEXT,
        frame_material TEXT,
        frame_status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    ''')
    
    # Safe migration: ensure new measurement columns exist if table was already created
    cursor.execute("PRAGMA table_info(frames);")
    existing_frame_cols = {col[1] for col in cursor.fetchall()}
    frame_migrations = [
        ("lens_width_mm", "REAL"),
        ("lens_height_mm", "REAL"),
        ("bridge_width_mm", "REAL"),
        ("frame_shape", "TEXT"),
        ("frame_material", "TEXT"),
        ("frame_status", "TEXT DEFAULT 'active'"),
    ]
    for col_name, col_type in frame_migrations:
        if col_name not in existing_frame_cols:
            cursor.execute(f"ALTER TABLE frames ADD COLUMN {col_name} {col_type};")

    # 3. Reservations
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS reservations (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        frame_id TEXT NOT NULL,
        reservation_date TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (frame_id) REFERENCES frames(id) ON DELETE RESTRICT
    );
    ''')
    
    # 4. Prescriptions
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS prescriptions (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        checkup_date TEXT NOT NULL,
        right_sph REAL NOT NULL,
        right_cyl REAL NOT NULL,
        right_axis INTEGER NOT NULL CHECK (right_axis >= 0 AND right_axis <= 180),
        right_pd REAL NOT NULL,
        left_sph REAL NOT NULL,
        left_cyl REAL NOT NULL,
        left_axis INTEGER NOT NULL CHECK (left_axis >= 0 AND left_axis <= 180),
        left_pd REAL NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
    );
    ''')

    # 5. Sessions (for lightweight academic token management)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    ''')
    
    conn.commit()
    conn.close()

def fetch_one(query: str, params: tuple = ()) -> dict | None:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def fetch_all(query: str, params: tuple = ()) -> list[dict]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def execute(query: str, params: tuple = ()) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected

def atomic_prebook(customer_id: str, frame_id: str) -> tuple[bool, str, dict | None]:
    """Atomically decrements frame quantity if > 0 and records reservation."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Check customer exists
        cursor.execute("SELECT id FROM users WHERE id = ?", (customer_id,))
        if not cursor.fetchone():
            conn.close()
            return False, "Customer not found", None

        # Verify frame exists
        cursor.execute("SELECT id, name, price, quantity FROM frames WHERE id = ?", (frame_id,))
        frame = cursor.fetchone()
        if not frame:
            conn.close()
            return False, "Frame not found", None

        if frame["quantity"] <= 0:
            conn.close()
            return False, "Frame is out of stock", None

        # Atomically decrement quantity
        cursor.execute(
            "UPDATE frames SET quantity = quantity - 1, updated_at = ? WHERE id = ? AND quantity > 0",
            (datetime.utcnow().isoformat(), frame_id)
        )
        if cursor.rowcount == 0:
            conn.close()
            return False, "Frame just ran out of stock", None

        # Create reservation record
        res_id = str(uuid.uuid4())
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute(
            "INSERT INTO reservations (id, customer_id, frame_id, reservation_date) VALUES (?, ?, ?, ?)",
            (res_id, customer_id, frame_id, now_str)
        )
        conn.commit()

        # Fetch joined details
        cursor.execute('''
            SELECT r.id, r.customer_id, r.frame_id, r.reservation_date,
                   f.name AS frame_name, f.brand, f.price, f.image_url
            FROM reservations r
            JOIN frames f ON r.frame_id = f.id
            WHERE r.id = ?
        ''', (res_id,))
        reservation_record = dict(cursor.fetchone())
        conn.close()
        return True, "Frame pre-booked successfully", reservation_record

    except Exception as e:
        conn.rollback()
        conn.close()
        return False, str(e), None


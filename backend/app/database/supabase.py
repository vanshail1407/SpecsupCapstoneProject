"""
SpecsUp - Supabase PostgreSQL Database Integration
===================================================
Manages Supabase connection and client setup.
If SUPABASE_URL and SUPABASE_KEY are provided in .env, connects to Supabase REST / PostgreSQL.
Otherwise, falls back to the robust local database in connection.py for offline viva evaluation.
"""

import os
from dotenv import load_dotenv
from app.database import connection

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip()

supabase_client = None

def get_supabase_client():
    global supabase_client
    if supabase_client is not None:
        return supabase_client

    if SUPABASE_URL and SUPABASE_KEY:
        try:
            from supabase import create_client, Client
            supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
            print("[INFO] Connected to Supabase Cloud PostgreSQL successfully.")
            return supabase_client
        except Exception as e:
            print(f"[WARN] Could not initialize Supabase client: {e}. Using local fallback database.")
    return None

def get_db():
    """Returns database interface."""
    return connection

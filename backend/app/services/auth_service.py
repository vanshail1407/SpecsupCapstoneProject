import hashlib
import os
import uuid
from datetime import datetime
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import connection

security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    """Generates a salted SHA-256 password hash using standard library hashlib."""
    salt = "specsup_salt_2026"
    return hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_session(user_id: str) -> str:
    """Generates a new session token and stores it in the database."""
    token = str(uuid.uuid4())
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    connection.execute(
        "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
        (token, user_id, now_str)
    )
    return token

def get_user_by_token(token: str) -> dict | None:
    """Resolves a user dict by active session token."""
    row = connection.fetch_one('''
        SELECT u.id, u.name, u.email, u.role, u.phone, u.dob, u.address, u.created_at
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ?
    ''', (token,))
    return row

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """FastAPI dependency to extract and authenticate the current user."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please log in."
        )
    token = credentials.credentials.strip()
    user = get_user_by_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please log in again."
        )
    return user

def require_admin(current_user: dict = Security(get_current_user)) -> dict:
    """Strict authorization check ensuring role == 'admin'."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    return current_user


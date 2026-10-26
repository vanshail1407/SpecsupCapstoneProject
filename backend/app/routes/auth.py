import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.api_schemas import RegisterRequest, LoginRequest, AuthResponse, UserResponse
from app.services.auth_service import hash_password, verify_password, create_session, get_current_user
from app.database import connection

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest):
    # Check if user already exists
    existing = connection.fetch_one("SELECT id FROM users WHERE email = ?", (payload.email.lower(),))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    user_id = str(uuid.uuid4())
    pw_hash = hash_password(payload.password)
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    connection.execute(
        '''
        INSERT INTO users (id, name, email, password_hash, role, created_at)
        VALUES (?, ?, ?, ?, 'customer', ?)
        ''',
        (user_id, payload.name.strip(), payload.email.lower(), pw_hash, now_str)
    )

    user = connection.fetch_one(
        "SELECT id, name, email, role, phone, dob, address, created_at FROM users WHERE id = ?",
        (user_id,)
    )

    token = create_session(user_id)
    return AuthResponse(user=UserResponse(**user), token=token)

@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest):
    user = connection.fetch_one(
        "SELECT id, name, email, password_hash, role, phone, dob, address, created_at FROM users WHERE email = ?",
        (payload.email.lower(),)
    )
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_session(user["id"])
    user_clean = {k: v for k, v in user.items() if k != "password_hash"}
    return AuthResponse(user=UserResponse(**user_clean), token=token)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)


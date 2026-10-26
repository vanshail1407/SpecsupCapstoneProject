from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.api_schemas import UserResponse, ProfileUpdateRequest
from app.services.auth_service import get_current_user
from app.database import connection

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)

@router.put("/me", response_model=UserResponse)
def update_my_profile(payload: ProfileUpdateRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # Update provided fields
    updates = []
    params = []
    
    if payload.name is not None:
        updates.append("name = ?")
        params.append(payload.name.strip())
    if payload.phone is not None:
        updates.append("phone = ?")
        params.append(payload.phone.strip())
    if payload.dob is not None:
        updates.append("dob = ?")
        params.append(payload.dob.strip())
    if payload.address is not None:
        updates.append("address = ?")
        params.append(payload.address.strip())

    if updates:
        params.append(user_id)
        connection.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", tuple(params))

    updated_user = connection.fetch_one(
        "SELECT id, name, email, role, phone, dob, address, created_at FROM users WHERE id = ?",
        (user_id,)
    )
    return UserResponse(**updated_user)


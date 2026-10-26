from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.schemas.api_schemas import ReservationCreateRequest, ReservationResponse
from app.services.auth_service import get_current_user
from app.database import connection

router = APIRouter(prefix="/api/reservations", tags=["Reservations"])

@router.post("", response_model=ReservationResponse)
def prebook_frame(payload: ReservationCreateRequest, current_user: dict = Depends(get_current_user)):
    success, message, res_record = connection.atomic_prebook(
        customer_id=current_user["id"],
        frame_id=payload.frame_id
    )
    if not success:
        if "out of stock" in message.lower():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
        elif "not found" in message.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    return ReservationResponse(**res_record)

@router.get("/me", response_model=List[ReservationResponse])
def get_my_reservations(current_user: dict = Depends(get_current_user)):
    rows = connection.fetch_all('''
        SELECT r.id, r.customer_id, r.frame_id, r.reservation_date,
               f.name AS frame_name, f.brand, f.price, f.image_url
        FROM reservations r
        JOIN frames f ON r.frame_id = f.id
        WHERE r.customer_id = ?
        ORDER BY r.reservation_date DESC
    ''', (current_user["id"],))
    return [ReservationResponse(**row) for row in rows]


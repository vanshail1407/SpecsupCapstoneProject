import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.api_schemas import (
    FrameCreateRequest, FrameUpdateRequest, FrameResponse,
    UserResponse, PrescriptionCreateRequest, PrescriptionResponse, ReservationResponse
)
from app.services.auth_service import require_admin
from app.database import connection

router = APIRouter(prefix="/api/admin", tags=["Admin Operations"])

# ----------------- 1. Frames Management -----------------
@router.get("/frames", response_model=List[FrameResponse])
def admin_get_frames(admin_user: dict = Depends(require_admin)):
    rows = connection.fetch_all("SELECT * FROM frames ORDER BY created_at DESC")
    return [FrameResponse(**r) for r in rows]

@router.post("/frames", response_model=FrameResponse, status_code=status.HTTP_201_CREATED)
def admin_create_frame(payload: FrameCreateRequest, admin_user: dict = Depends(require_admin)):
    frame_id = str(uuid.uuid4())
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    connection.execute('''
        INSERT INTO frames (
            id, name, brand, price, image_url, quantity, description,
            lens_width_mm, lens_height_mm, bridge_width_mm, frame_shape, frame_material, frame_status,
            created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        frame_id, payload.name.strip(), payload.brand.strip(), payload.price,
        payload.image_url.strip(), payload.quantity, payload.description,
        payload.lens_width_mm, payload.lens_height_mm, payload.bridge_width_mm,
        payload.frame_shape.strip() if payload.frame_shape else None,
        payload.frame_material.strip() if payload.frame_material else None,
        payload.frame_status or "active",
        now_str, now_str
    ))

    frame = connection.fetch_one("SELECT * FROM frames WHERE id = ?", (frame_id,))
    return FrameResponse(**frame)

@router.put("/frames/{frame_id}", response_model=FrameResponse)
def admin_update_frame(frame_id: str, payload: FrameUpdateRequest, admin_user: dict = Depends(require_admin)):
    existing = connection.fetch_one("SELECT * FROM frames WHERE id = ?", (frame_id,))
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Frame not found.")

    updates = ["updated_at = ?"]
    params = [datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")]

    if payload.name is not None:
        updates.append("name = ?")
        params.append(payload.name.strip())
    if payload.brand is not None:
        updates.append("brand = ?")
        params.append(payload.brand.strip())
    if payload.price is not None:
        updates.append("price = ?")
        params.append(payload.price)
    if payload.image_url is not None:
        updates.append("image_url = ?")
        params.append(payload.image_url.strip())
    if payload.quantity is not None:
        updates.append("quantity = ?")
        params.append(payload.quantity)
    if payload.description is not None:
        updates.append("description = ?")
        params.append(payload.description.strip())
    if payload.lens_width_mm is not None:
        updates.append("lens_width_mm = ?")
        params.append(payload.lens_width_mm)
    if payload.lens_height_mm is not None:
        updates.append("lens_height_mm = ?")
        params.append(payload.lens_height_mm)
    if payload.bridge_width_mm is not None:
        updates.append("bridge_width_mm = ?")
        params.append(payload.bridge_width_mm)
    if payload.frame_shape is not None:
        updates.append("frame_shape = ?")
        params.append(payload.frame_shape.strip() if payload.frame_shape else None)
    if payload.frame_material is not None:
        updates.append("frame_material = ?")
        params.append(payload.frame_material.strip() if payload.frame_material else None)
    if payload.frame_status is not None:
        updates.append("frame_status = ?")
        params.append(payload.frame_status.strip() if payload.frame_status else "active")

    params.append(frame_id)
    connection.execute(f"UPDATE frames SET {', '.join(updates)} WHERE id = ?", tuple(params))

    updated = connection.fetch_one("SELECT * FROM frames WHERE id = ?", (frame_id,))
    return FrameResponse(**updated)


@router.delete("/frames/{frame_id}")
def admin_delete_frame(frame_id: str, admin_user: dict = Depends(require_admin)):
    existing = connection.fetch_one("SELECT * FROM frames WHERE id = ?", (frame_id,))
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Frame not found.")

    # Check if frame is reserved
    reservations = connection.fetch_all("SELECT id FROM reservations WHERE frame_id = ?", (frame_id,))
    if reservations:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete this frame because active pre-bookings exist for it."
        )

    connection.execute("DELETE FROM frames WHERE id = ?", (frame_id,))
    return {"status": "success", "message": "Frame deleted successfully."}

# ----------------- 2. Customers Management -----------------
@router.get("/customers", response_model=List[UserResponse])
def admin_get_customers(admin_user: dict = Depends(require_admin)):
    rows = connection.fetch_all(
        "SELECT id, name, email, role, phone, dob, address, created_at FROM users WHERE role = 'customer' ORDER BY created_at DESC"
    )
    return [UserResponse(**r) for r in rows]

@router.get("/customers/{customer_id}", response_model=UserResponse)
def admin_get_customer_detail(customer_id: str, admin_user: dict = Depends(require_admin)):
    customer = connection.fetch_one(
        "SELECT id, name, email, role, phone, dob, address, created_at FROM users WHERE id = ? AND role = 'customer'",
        (customer_id,)
    )
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")
    return UserResponse(**customer)

# ----------------- 3. Prescriptions Operations -----------------
@router.post("/customers/{customer_id}/prescriptions", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
def admin_add_prescription(customer_id: str, payload: PrescriptionCreateRequest, admin_user: dict = Depends(require_admin)):
    customer = connection.fetch_one("SELECT id FROM users WHERE id = ? AND role = 'customer'", (customer_id,))
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

    rx_id = str(uuid.uuid4())
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    connection.execute('''
        INSERT INTO prescriptions (
            id, customer_id, checkup_date, right_sph, right_cyl, right_axis, right_pd,
            left_sph, left_cyl, left_axis, left_pd, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        rx_id, customer_id, payload.checkup_date,
        payload.right_sph, payload.right_cyl, payload.right_axis, payload.right_pd,
        payload.left_sph, payload.left_cyl, payload.left_axis, payload.left_pd,
        payload.notes, now_str
    ))

    rx = connection.fetch_one("SELECT * FROM prescriptions WHERE id = ?", (rx_id,))
    return PrescriptionResponse(**rx)

@router.get("/customers/{customer_id}/prescriptions", response_model=List[PrescriptionResponse])
def admin_get_customer_prescriptions(customer_id: str, admin_user: dict = Depends(require_admin)):
    rows = connection.fetch_all(
        "SELECT * FROM prescriptions WHERE customer_id = ? ORDER BY checkup_date DESC",
        (customer_id,)
    )
    return [PrescriptionResponse(**r) for r in rows]

# ----------------- 4. Reservations Listing -----------------
@router.get("/reservations", response_model=List[ReservationResponse])
def admin_get_reservations(admin_user: dict = Depends(require_admin)):
    rows = connection.fetch_all('''
        SELECT r.id, r.customer_id, r.frame_id, r.reservation_date,
               f.name AS frame_name, f.brand, f.price, f.image_url,
               u.name AS customer_name, u.email AS customer_email
        FROM reservations r
        JOIN frames f ON r.frame_id = f.id
        JOIN users u ON r.customer_id = u.id
        ORDER BY r.reservation_date DESC
    ''')
    return [ReservationResponse(**r) for r in rows]


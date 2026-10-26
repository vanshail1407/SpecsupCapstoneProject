from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from typing import List
from app.schemas.api_schemas import PrescriptionResponse, AnalysisResponse, TrendMetric
from app.services.auth_service import get_current_user
from app.services.pdf_service import generate_prescription_pdf
from app.services import prescription_service

router = APIRouter(prefix="/api/prescriptions", tags=["Prescriptions"])

@router.get("/me", response_model=List[PrescriptionResponse])
def get_my_prescriptions(current_user: dict = Depends(get_current_user)):
    rx_list = prescription_service.get_prescriptions_for_customer(current_user["id"], ascending=False)
    return [PrescriptionResponse(**r) for r in rx_list]

@router.get("/me/latest", response_model=PrescriptionResponse)
def get_my_latest_prescription(current_user: dict = Depends(get_current_user)):
    rx = prescription_service.get_latest_prescription(current_user["id"])
    if not rx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No prescription records found for this user."
        )
    return PrescriptionResponse(**rx)

@router.get("/me/analysis", response_model=AnalysisResponse)
def get_prescription_analysis(current_user: dict = Depends(get_current_user)):
    result = prescription_service.get_customer_analysis(current_user["id"])
    
    trend_metric = TrendMetric(**result["trend"]) if result.get("trend") else None
    latest_resp = PrescriptionResponse(**result["latest_prescription"]) if result.get("latest_prescription") else None
    history_resp = [PrescriptionResponse(**r) for r in result.get("history", [])]

    return AnalysisResponse(
        status=result["status"],
        message=result.get("message"),
        recommended_checkup_date=result.get("recommended_checkup_date"),
        suggested_interval_months=result.get("suggested_interval_months"),
        trend_classification=result.get("trend_classification"),
        trend=trend_metric,
        explanation=result.get("explanation"),
        disclaimer=result["disclaimer"],
        latest_prescription=latest_resp,
        history=history_resp
    )

@router.get("/me/pdf")
def download_prescription_pdf(current_user: dict = Depends(get_current_user)):
    rx_list = prescription_service.get_prescriptions_for_customer(current_user["id"], ascending=False)
    if not rx_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No prescriptions found to generate PDF."
        )

    pdf_stream = generate_prescription_pdf(
        customer_name=current_user["name"],
        customer_email=current_user["email"],
        prescriptions=rx_list
    )

    clean_name = current_user["name"].replace(" ", "_")
    filename = f"SpecsUp_Prescriptions_{clean_name}.pdf"

    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

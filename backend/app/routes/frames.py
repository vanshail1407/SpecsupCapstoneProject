from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.schemas.api_schemas import (
    FrameResponse,
    RecommendedFramesResponse,
    FrameRecommendationItem,
    PrescriptionResponse,
)
from app.database import connection
from app.services.auth_service import get_current_user
from app.services import prescription_service
from app.algorithms.frame_recommendation import (
    recommend_frames,
    calculate_spherical_equivalent,
    classify_prescription,
)

router = APIRouter(prefix="/api/frames", tags=["Frames"])

RECOMMENDATION_DISCLAIMER = (
    "This is a rule-based preliminary heuristic for educational and optical screening purposes based on geometric frame "
    "measurements and spherical equivalent power. Final lens choice, high-index lens materials, aspheric surfacing, "
    "and physical facial fit should always be confirmed by an eye care professional."
)

@router.get("", response_model=List[FrameResponse])
def get_public_frames():
    """Public storefront listing of all frames."""
    frames = connection.fetch_all("SELECT * FROM frames ORDER BY created_at DESC")
    return [FrameResponse(**f) for f in frames]

@router.get("/recommended", response_model=RecommendedFramesResponse)
def get_recommended_frames(current_user: dict = Depends(get_current_user)):
    """
    Recommends active, in-stock frames tailored to the authenticated customer's latest prescription.
    Derives customer ID strictly from the authenticated token to prevent IDOR vulnerabilities.
    """
    customer_id = current_user["id"]
    latest_rx = prescription_service.get_latest_prescription(customer_id)
    
    if not latest_rx:
        return RecommendedFramesResponse(
            status="no_prescription",
            message="No prescription record found. Please consult your optometrist or request an in-clinic eye checkup to unlock tailored frame recommendations.",
            latest_prescription=None,
            patient_summary=None,
            recommendations=[],
            disclaimer=RECOMMENDATION_DISCLAIMER
        )

    # Fetch in-stock, active frames
    frames = connection.fetch_all(
        "SELECT * FROM frames WHERE quantity > 0 AND (frame_status IS NULL OR frame_status = 'active') ORDER BY created_at DESC"
    )
    frame_dicts = [dict(f) for f in frames]
    
    if not frame_dicts:
        return RecommendedFramesResponse(
            status="no_inventory",
            message="No in-stock frames currently available in catalog.",
            latest_prescription=PrescriptionResponse(**latest_rx),
            patient_summary=None,
            recommendations=[],
            disclaimer=RECOMMENDATION_DISCLAIMER
        )

    # Calculate summary metrics
    se_od = calculate_spherical_equivalent(latest_rx["right_sph"], latest_rx["right_cyl"])
    se_os = calculate_spherical_equivalent(latest_rx["left_sph"], latest_rx["left_cyl"])
    category, dom_se = classify_prescription(se_od, se_os, latest_rx["right_cyl"], latest_rx["left_cyl"])
    patient_pd = round(float(latest_rx["right_pd"]) + float(latest_rx["left_pd"]), 1)

    patient_summary = {
        "spherical_equivalent_od": se_od,
        "spherical_equivalent_os": se_os,
        "dominant_power": dom_se,
        "category": category,
        "anatomical_pd": patient_pd
    }

    # Evaluate recommendations
    ranked_results = recommend_frames(latest_rx, frame_dicts)
    
    recommendation_items = []
    for item in ranked_results:
        recommendation_items.append(
            FrameRecommendationItem(
                frame=FrameResponse(**item["frame"]),
                score=item["score"],
                compatibility=item["compatibility"],
                compatibility_label=item["compatibility_label"],
                reasons=item["reasons"],
                warnings=item["warnings"],
                optical_metrics=item["optical_metrics"]
            )
        )

    return RecommendedFramesResponse(
        status="success",
        message="Frames ranked according to optical suitability for your prescription.",
        latest_prescription=PrescriptionResponse(**latest_rx),
        patient_summary=patient_summary,
        recommendations=recommendation_items,
        disclaimer=RECOMMENDATION_DISCLAIMER
    )

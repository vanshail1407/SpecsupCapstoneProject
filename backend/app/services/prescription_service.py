"""
SpecsUp - Prescription Business Service
========================================
Encapsulates database operations and DSA algorithm coordination for prescriptions.
"""

from typing import List, Dict, Any, Optional
from app.database import connection
from app.algorithms.prescription_analysis import (
    calculate_prescription_trend,
    calculate_checkup_recommendation,
    DISCLAIMER_TEXT,
)

def get_prescriptions_for_customer(customer_id: str, ascending: bool = False) -> List[Dict[str, Any]]:
    """Retrieves all prescriptions for a customer. Default order is newest to oldest."""
    order = "ASC" if ascending else "DESC"
    rows = connection.fetch_all(
        f"SELECT * FROM prescriptions WHERE customer_id = ? ORDER BY checkup_date {order}",
        (customer_id,)
    )
    return [dict(r) for r in rows]

def get_latest_prescription(customer_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves the most recent prescription for a customer."""
    row = connection.fetch_one(
        "SELECT * FROM prescriptions WHERE customer_id = ? ORDER BY checkup_date DESC LIMIT 1",
        (customer_id,)
    )
    return dict(row) if row else None

def get_customer_analysis(customer_id: str) -> Dict[str, Any]:
    """Coordinates retrieving chronological history, calculating trend rates and checkup recommendation."""
    # Retrieve ascending (chronological) for the DSA algorithm
    history_asc = get_prescriptions_for_customer(customer_id, ascending=True)

    if not history_asc:
        return {
            "status": "insufficient_data",
            "message": "No prescription history available yet. Please visit our optical shop for your initial eye examination.",
            "disclaimer": DISCLAIMER_TEXT,
            "latest_prescription": None,
            "history": []
        }

    latest_rx = history_asc[-1]
    trend_result = calculate_prescription_trend(history_asc)
    rec_result = calculate_checkup_recommendation(history_asc, trend_result)

    # Reverse history for presentation (newest -> oldest)
    reversed_history = list(reversed(history_asc))

    if trend_result["status"] == "insufficient_data":
        return {
            "status": "insufficient_data",
            "message": trend_result["message"],
            "recommended_checkup_date": rec_result["recommended_month_year"],
            "suggested_interval_months": rec_result["suggested_interval_months"],
            "explanation": rec_result["reasoning"],
            "disclaimer": DISCLAIMER_TEXT,
            "latest_prescription": latest_rx,
            "history": reversed_history
        }

    return {
        "status": "success",
        "recommended_checkup_date": rec_result["recommended_month_year"],
        "suggested_interval_months": rec_result["suggested_interval_months"],
        "trend_classification": trend_result["trend_classification"],
        "trend": trend_result["trend"],
        "explanation": trend_result["explanation"],
        "disclaimer": DISCLAIMER_TEXT,
        "latest_prescription": latest_rx,
        "history": reversed_history
    }

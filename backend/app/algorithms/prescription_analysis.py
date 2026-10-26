"""
SpecsUp - Prescription Trend Analysis and Checkup Recommendation Engine
========================================================================
Academic Capstone Data Structures & Algorithms (DSA) Module.

Data Structures Used:
1. Lists / Dynamic Arrays: Stores chronological prescription sequences.
2. Dictionaries (Hash Maps): Structured record lookup and consecutive pair metrics.
3. Tuples: Immutable coordinate pairs for time-series point generation.

Algorithms:
1. Chronological Sorting (TimSort - O(N log N)):
   Sorts prescriptions strictly by checkup_date in ascending order for temporal differencing.
2. Consecutive Pair Differencing (Two-Pointer Sliding Window - O(N)):
   Traverses consecutive checkups (i, i+1) to calculate elapsed time in years and power changes.
3. Weighted Rate-of-Change Calculation (O(N)):
   Calculates annualized change rates: (Power_next - Power_prev) / (Delta_days / 365.25).
4. Rule-Based Trend Classification (O(1)):
   Categorizes ocular shift into 'Increasing' (myopic progression), 'Stable', or 'Decreasing'.
5. Dynamic Checkup Recommendation Algorithm (O(1)):
   Fuses historical appointment intervals with prescription volatility to project the next
   recommended examination date.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple

DISCLAIMER_TEXT = (
    "This is a trend-based estimate and should not be treated as a medical diagnosis. "
    "Always consult a licensed optometrist or ophthalmologist for clinical evaluation."
)

def parse_date(date_str: str) -> datetime:
    """Parses ISO or standard date strings (YYYY-MM-DD)."""
    for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%d-%m-%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(date_str[:10], fmt)
        except ValueError:
            pass
    return datetime.fromisoformat(date_str[:10])

def calculate_prescription_trend(prescriptions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyzes historical SPH and CYL changes across consecutive checkups.
    Requires at least 2 checkups.
    Returns trend rates and classification.
    """
    if not prescriptions or len(prescriptions) < 2:
        return {
            "status": "insufficient_data",
            "message": "More prescription history is required to calculate a meaningful trend.",
            "trend": None,
            "trend_classification": None,
            "consecutive_changes": [],
            "disclaimer": DISCLAIMER_TEXT
        }

    # Step 1: Sort chronologically (oldest to newest)
    sorted_rx = sorted(prescriptions, key=lambda x: parse_date(x["checkup_date"]))

    consecutive_changes = []
    total_sph_r_rate = 0.0
    total_sph_l_rate = 0.0
    total_cyl_r_rate = 0.0
    total_cyl_l_rate = 0.0
    valid_intervals = 0

    # Step 2: Consecutive comparison using actual elapsed time
    for i in range(len(sorted_rx) - 1):
        prev_rx = sorted_rx[i]
        curr_rx = sorted_rx[i + 1]

        d_prev = parse_date(prev_rx["checkup_date"])
        d_curr = parse_date(curr_rx["checkup_date"])
        
        days_diff = (d_curr - d_prev).days
        if days_diff <= 0:
            continue

        years_diff = days_diff / 365.25

        delta_r_sph = float(curr_rx["right_sph"]) - float(prev_rx["right_sph"])
        delta_l_sph = float(curr_rx["left_sph"]) - float(prev_rx["left_sph"])
        delta_r_cyl = float(curr_rx["right_cyl"]) - float(prev_rx["right_cyl"])
        delta_l_cyl = float(curr_rx["left_cyl"]) - float(prev_rx["left_cyl"])

        rate_r_sph = delta_r_sph / years_diff
        rate_l_sph = delta_l_sph / years_diff
        rate_r_cyl = delta_r_cyl / years_diff
        rate_l_cyl = delta_l_cyl / years_diff

        consecutive_changes.append({
            "from_date": prev_rx["checkup_date"],
            "to_date": curr_rx["checkup_date"],
            "days_elapsed": days_diff,
            "years_elapsed": round(years_diff, 2),
            "delta_right_sph": round(delta_r_sph, 2),
            "delta_left_sph": round(delta_l_sph, 2),
            "delta_right_cyl": round(delta_r_cyl, 2),
            "delta_left_cyl": round(delta_l_cyl, 2),
            "rate_right_sph_per_year": round(rate_r_sph, 3),
            "rate_left_sph_per_year": round(rate_l_sph, 3),
        })

        total_sph_r_rate += rate_r_sph
        total_sph_l_rate += rate_l_sph
        total_cyl_r_rate += rate_r_cyl
        total_cyl_l_rate += rate_l_cyl
        valid_intervals += 1

    if valid_intervals == 0:
        return {
            "status": "insufficient_data",
            "message": "Checkup dates must be on distinct days to analyze progression rates.",
            "trend": None,
            "trend_classification": None,
            "consecutive_changes": [],
            "disclaimer": DISCLAIMER_TEXT
        }

    # Step 3: Compute average yearly change rates
    avg_r_sph = total_sph_r_rate / valid_intervals
    avg_l_sph = total_sph_l_rate / valid_intervals
    avg_r_cyl = total_cyl_r_rate / valid_intervals
    avg_l_cyl = total_cyl_l_rate / valid_intervals

    # Step 4: Trend Classification
    # In ophthalmology, more negative SPH indicates increasing myopia.
    # We evaluate both magnitude and direction:
    primary_sph_change = (avg_r_sph + avg_l_sph) / 2.0
    primary_cyl_change = (avg_r_cyl + avg_l_cyl) / 2.0

    if abs(primary_sph_change) <= 0.10 and abs(primary_cyl_change) <= 0.10:
        classification = "Stable"
        explanation = (
            f"Your prescription is relatively stable with minimal yearly change "
            f"(Right SPH: {avg_r_sph:+.2f} D/yr, Left SPH: {avg_l_sph:+.2f} D/yr)."
        )
    elif primary_sph_change < -0.10 or primary_cyl_change < -0.10:
        classification = "Increasing"
        explanation = (
            f"Your prescription shows myopic progression with negative Diopter increase "
            f"(Right SPH: {avg_r_sph:+.2f} D/yr, Left SPH: {avg_l_sph:+.2f} D/yr)."
        )
    else:
        classification = "Decreasing"
        explanation = (
            f"Your prescription indicates a mild hyperopic shift or reduction in minus power "
            f"(Right SPH: {avg_r_sph:+.2f} D/yr, Left SPH: {avg_l_sph:+.2f} D/yr)."
        )

    return {
        "status": "success",
        "trend": {
            "right_sph": round(avg_r_sph, 3),
            "left_sph": round(avg_l_sph, 3),
            "right_cyl": round(avg_r_cyl, 3),
            "left_cyl": round(avg_l_cyl, 3),
        },
        "trend_classification": classification,
        "explanation": explanation,
        "consecutive_changes": consecutive_changes,
        "disclaimer": DISCLAIMER_TEXT
    }

def calculate_checkup_recommendation(prescriptions: List[Dict[str, Any]], trend_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Rule-Based Academic Recommendation Engine:
    Considers:
    1. Historical interval between consecutive checkups.
    2. Rate of prescription change (volatility).
    3. Most recent checkup date.
    
    Academic Rule:
    - If prescription is volatile (absolute change >= 0.50 D/year): Recommend checkup in 6 months.
    - If prescription is moderately changing (0.25 <= change < 0.50 D/year): Recommend checkup in 9 months.
    - If prescription is stable (< 0.25 D/year): Recommend checkup in 12 months (or historical avg up to 18 mos).
    """
    if not prescriptions:
        return {
            "recommended_checkup_date": None,
            "recommended_month_year": None,
            "suggested_interval_months": None,
            "reasoning": "No checkup history available."
        }

    # Find the latest checkup
    sorted_rx = sorted(prescriptions, key=lambda x: parse_date(x["checkup_date"]))
    latest_rx = sorted_rx[-1]
    latest_date = parse_date(latest_rx["checkup_date"])

    if trend_result.get("status") != "success" or not trend_result.get("trend"):
        # For single checkup or insufficient history, standard optometrist default is 12 months
        default_months = 12
        projected_date = latest_date + timedelta(days=int(default_months * 30.4375))
        return {
            "recommended_checkup_date": projected_date.strftime("%Y-%m-%d"),
            "recommended_month_year": projected_date.strftime("%B %Y"),
            "suggested_interval_months": default_months,
            "reasoning": "Standard annual checkup recommended based on single baseline examination."
        }

    # Calculate average historical interval
    total_days = 0
    intervals_count = len(sorted_rx) - 1
    for i in range(intervals_count):
        d1 = parse_date(sorted_rx[i]["checkup_date"])
        d2 = parse_date(sorted_rx[i + 1]["checkup_date"])
        total_days += (d2 - d1).days

    avg_historical_days = total_days / max(intervals_count, 1)
    avg_historical_months = round(avg_historical_days / 30.4375)

    trend = trend_result["trend"]
    max_rate = max(abs(trend["right_sph"]), abs(trend["left_sph"]), abs(trend["right_cyl"]), abs(trend["left_cyl"]))

    if max_rate >= 0.50:
        suggested_months = 6
        reasoning = (
            f"Elevated rate of change detected ({max_rate:.2f} D/year). "
            "A 6-month follow-up is suggested to monitor rapid vision changes."
        )
    elif max_rate >= 0.25:
        suggested_months = 9
        reasoning = (
            f"Moderate prescription adjustment ({max_rate:.2f} D/year). "
            "A 9-month follow-up is recommended to verify optical comfort."
        )
    else:
        # Stable: adjust to customer's historical visit cadence between 10 and 18 months
        suggested_months = max(10, min(14, avg_historical_months if avg_historical_months > 0 else 12))
        reasoning = (
            f"Stable prescription history (yearly change < 0.25 D/year). "
            f"A routine review in {suggested_months} months aligns with standard preventative care."
        )

    projected_date = latest_date + timedelta(days=int(suggested_months * 30.4375))

    return {
        "recommended_checkup_date": projected_date.strftime("%Y-%m-%d"),
        "recommended_month_year": projected_date.strftime("%B %Y"),
        "suggested_interval_months": suggested_months,
        "reasoning": reasoning
    }


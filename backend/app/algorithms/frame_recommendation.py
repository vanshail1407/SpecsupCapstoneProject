"""
Prescription-Based Smart Frame Recommendation Algorithm for SpecSup.

This module evaluates frame suitability based on optical and geometric principles:
1. Spherical Equivalent Power: SE = SPH + (CYL / 2)
2. Decentration: Frame PD (lens_width + bridge_width) vs. Anatomical PD (right_pd + left_pd)
3. Frame Dimensions: lens width, lens height (B-measurement), bridge width
4. Frame Material & Construction: Acetate/Plastic vs. Metal/Rimless concealment of edge thickness

Note: This is a strictly deterministic rule-based heuristic with no external paid APIs or ML.
"""

from typing import Dict, Any, List, Optional, Tuple


def calculate_spherical_equivalent(sph: float, cyl: float) -> float:
    """Calculates spherical equivalent: SE = SPH + (CYL / 2) rounded to 2 decimals."""
    return round(sph + (cyl / 2.0), 2)


def classify_prescription(se_od: float, se_os: float, cyl_od: float, cyl_os: float) -> Tuple[str, float]:
    """
    Identifies the dominant refractive power and categorizes the prescription.
    Returns (category, dominant_se).
    """
    # Pick the eye with the higher absolute refractive impact
    dom_se = se_od if abs(se_od) >= abs(se_os) else se_os
    
    if dom_se <= -4.00:
        category = "strong_minus"
    elif dom_se <= -2.00:
        category = "moderate_minus"
    elif dom_se >= 4.00:
        category = "strong_plus"
    elif dom_se >= 2.00:
        category = "moderate_plus"
    else:
        category = "mild"
        
    return category, dom_se


def evaluate_frame_compatibility(
    prescription: Dict[str, Any],
    frame: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Evaluates a single frame against the customer's prescription.
    
    Returns a dictionary matching FrameRecommendationItem structure:
    {
        "frame": frame_dict,
        "score": float or None,
        "compatibility": str,
        "compatibility_label": str,
        "reasons": list of str,
        "warnings": list of str,
        "optical_metrics": dict or None
    }
    """
    width = frame.get("lens_width_mm")
    height = frame.get("lens_height_mm")
    bridge = frame.get("bridge_width_mm")
    shape = (frame.get("frame_shape") or "").lower().strip()
    material = (frame.get("frame_material") or "").lower().strip()
    
    # Check for missing essential measurements
    if width is None or height is None or bridge is None or width <= 0 or height <= 0 or bridge <= 0:
        return {
            "frame": frame,
            "score": None,
            "compatibility": "not_assessed",
            "compatibility_label": "Not Assessed",
            "reasons": ["Frame optical dimensions (lens width, height, or bridge) are not recorded in inventory."],
            "warnings": ["Unable to evaluate optical fit due to missing frame measurements."],
            "optical_metrics": None
        }

    # Prescription optical metrics
    r_sph = float(prescription.get("right_sph", 0.0))
    r_cyl = float(prescription.get("right_cyl", 0.0))
    l_sph = float(prescription.get("left_sph", 0.0))
    l_cyl = float(prescription.get("left_cyl", 0.0))
    r_pd = float(prescription.get("right_pd", 31.0))
    l_pd = float(prescription.get("left_pd", 31.0))
    
    se_od = calculate_spherical_equivalent(r_sph, r_cyl)
    se_os = calculate_spherical_equivalent(l_sph, l_cyl)
    category, dom_se = classify_prescription(se_od, se_os, r_cyl, l_cyl)
    
    patient_pd = round(r_pd + l_pd, 1)
    frame_pd = round(float(width) + float(bridge), 1)
    total_decentration = round(abs(frame_pd - patient_pd), 1)
    per_eye_decentration = round(total_decentration / 2.0, 1)
    
    score = 100.0
    reasons = []
    warnings = []
    
    width_penalty = 0.0
    height_penalty = 0.0
    decentration_penalty = 0.0
    material_bonus = 0.0
    shape_bonus = 0.0

    # 1. Lens Width Evaluation (Crucial for minus edge thickness and plus weight)
    if category == "strong_minus":
        if width <= 50:
            material_bonus += 5.0
            reasons.append(f"Compact lens width ({width}mm) minimizes heavy temporal edge thickness for high myopia ({dom_se:+.2f}D).")
        elif width <= 53:
            reasons.append(f"Balanced lens width ({width}mm) keeps high-index edge thickness manageable.")
        elif width <= 55:
            width_penalty -= 12.0
            warnings.append(f"Lens width ({width}mm) is slightly wide for high minus ({dom_se:+.2f}D); edge thickness will be noticeable.")
        else:
            width_penalty -= 25.0
            warnings.append(f"Broad lens width ({width}mm) will cause pronounced temporal edge thickness and minification rings.")
            
    elif category == "moderate_minus":
        if width <= 52:
            material_bonus += 5.0
            reasons.append(f"Favorable lens width ({width}mm) keeps minus lens edge thickness discreet.")
        elif width <= 55:
            reasons.append(f"Standard lens width ({width}mm) is well suited for moderate correction ({dom_se:+.2f}D).")
        else:
            width_penalty -= 15.0
            warnings.append(f"Wide lens width ({width}mm) increases edge bulk under moderate myopia ({dom_se:+.2f}D).")

    elif category == "strong_plus":
        if width <= 50:
            material_bonus += 5.0
            reasons.append(f"Compact lens width ({width}mm) significantly reduces center lens thickness and weight for strong plus ({dom_se:+.2f}D).")
        elif width <= 53:
            reasons.append(f"Moderate lens width ({width}mm) maintains reasonable center thickness.")
        else:
            width_penalty -= 22.0
            warnings.append(f"Wide frame width ({width}mm) substantially increases center lens thickness and ocular magnification for {dom_se:+.2f}D.")

    elif category == "moderate_plus":
        if width <= 52:
            material_bonus += 5.0
            reasons.append(f"Moderate lens width ({width}mm) helps minimize center thickness and weight.")
        elif width <= 55:
            reasons.append(f"Acceptable lens width ({width}mm) for moderate hyperopic power.")
        else:
            width_penalty -= 14.0
            warnings.append(f"Lens width ({width}mm) will result in thicker optical centers.")

    else:  # mild
        if width <= 56:
            material_bonus += 5.0
            reasons.append(f"Mild prescription ({dom_se:+.2f}D) allows wide versatility; width ({width}mm) produces minimal thickness variance.")
        else:
            width_penalty -= 5.0
            warnings.append(f"Oversized width ({width}mm) may introduce subtle peripheral distortion.")

    # 2. Lens Height Evaluation (B-measurement)
    if category in ("strong_minus", "moderate_minus"):
        if height <= 38:
            material_bonus += 5.0
            reasons.append(f"Moderate vertical height ({height}mm) prevents excessive vertical edge thickness.")
        elif height > 43:
            height_penalty -= 12.0
            warnings.append(f"Deep vertical height ({height}mm) will create thicker top and bottom lens edges.")
    elif category in ("strong_plus", "moderate_plus"):
        if height > 44:
            height_penalty -= 10.0
            warnings.append(f"Deep lens height ({height}mm) adds unnecessary center thickness and weight.")

    # 3. Decentration Evaluation (Frame PD vs Patient PD)
    if total_decentration <= 3.0:
        material_bonus += 10.0
        reasons.append(f"Ideal optical centering: Frame PD ({frame_pd}mm) closely matches your anatomical PD ({patient_pd}mm), reducing lens edge distortion.")
    elif total_decentration <= 6.0:
        reasons.append(f"Good pupil alignment within standard optical tolerance (approx {per_eye_decentration}mm decentration per eye).")
    elif total_decentration <= 9.0:
        decentration_penalty -= 12.0
        warnings.append(f"Moderate optical decentration ({per_eye_decentration}mm per eye from Frame PD {frame_pd}mm vs PD {patient_pd}mm); requires larger lens blanks.")
    elif total_decentration <= 12.0:
        decentration_penalty -= 22.0
        warnings.append(f"High decentration ({per_eye_decentration}mm per eye; Frame PD {frame_pd}mm vs Patient PD {patient_pd}mm). Likely causes noticeable lens thickness asymmetry.")
    else:
        decentration_penalty -= 36.0
        warnings.append(f"Excessive decentration ({per_eye_decentration}mm per eye; Frame PD {frame_pd}mm vs Patient PD {patient_pd}mm). Significantly exceeds optical tolerance, causing severe thickness disparity and prismatic deviation.")

    # 4. Material and Frame Rim Suitability
    if category in ("strong_minus", "moderate_minus"):
        if any(m in material for m in ["acetate", "plastic", "tr90", "propionate", "polycarbonate"]):
            # If decentration is severe, rim concealment is partially compromised
            eff_mat_bonus = 4.0 if total_decentration > 12.0 else 8.0
            material_bonus += eff_mat_bonus
            reasons.append("Acetate/plastic frame rim effectively conceals minus lens edge thickness.")
        elif any(m in material for m in ["rimless", "semi-rimless", "frameless"]):
            material_bonus -= 18.0
            warnings.append("Rimless/semi-rimless frame exposes minus lens edge thickness and increases chipping vulnerability.")
    elif category in ("strong_plus", "moderate_plus"):
        if any(m in material for m in ["acetate", "plastic", "tr90"]):
            material_bonus += 5.0
            reasons.append("Full rim construction securely supports and balances plus center lens weight.")

    # High Astigmatism Consideration
    max_cyl = max(abs(r_cyl), abs(l_cyl))
    if max_cyl >= 2.00:
        if shape in ["round", "oval"]:
            warnings.append(f"Significant astigmatism ({max_cyl:.2f}D): round frames require precision lens edging to avoid accidental axis rotation.")
        else:
            shape_bonus += 5.0
            reasons.append(f"Structured frame shape ({shape or 'geometric'}) helps maintain cylinder axis stability for {max_cyl:.2f}D astigmatism.")

    # Final Score Calculation
    score += width_penalty + height_penalty + decentration_penalty + material_bonus + shape_bonus
    score = max(0.0, min(100.0, round(score, 1)))

    # Determine Compatibility Label & Category
    if score >= 85.0:
        compatibility = "highly_recommended"
        compatibility_label = "Highly Recommended"
    elif score >= 70.0:
        compatibility = "recommended"
        compatibility_label = "Recommended"
    elif score >= 55.0:
        compatibility = "suitable"
        compatibility_label = "Suitable with Considerations"
    else:
        compatibility = "caution"
        compatibility_label = "Not Recommended / Caution"

    metrics = {
        "spherical_equivalent_od": se_od,
        "spherical_equivalent_os": se_os,
        "dominant_power": dom_se,
        "prescription_category": category,
        "patient_pd": patient_pd,
        "frame_pd": frame_pd,
        "decentration_mm": total_decentration,
        "width_penalty": width_penalty,
        "height_penalty": height_penalty,
        "decentration_penalty": decentration_penalty,
        "material_bonus": material_bonus,
        "shape_bonus": shape_bonus,
    }

    return {
        "frame": frame,
        "score": score,
        "compatibility": compatibility,
        "compatibility_label": compatibility_label,
        "reasons": reasons,
        "warnings": warnings,
        "optical_metrics": metrics
    }


def recommend_frames(
    prescription: Dict[str, Any],
    frames: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Evaluates and ranks a list of frames against a customer's prescription.
    
    Ranking order:
    1. Assessed frames sorted descending by score (highest score first).
    2. 'not_assessed' frames placed at the bottom.
    """
    assessed = []
    unassessed = []
    
    for f in frames:
        result = evaluate_frame_compatibility(prescription, f)
        if result["compatibility"] == "not_assessed":
            unassessed.append(result)
        else:
            assessed.append(result)
            
    # Sort assessed frames by score descending
    assessed.sort(key=lambda x: x["score"], reverse=True)
    
    return assessed + unassessed

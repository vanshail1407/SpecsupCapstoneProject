/**
 * Prescription-Based Smart Frame Recommendation Algorithm for SpecSup.
 * Deterministic rule-based optical heuristic (JavaScript port).
 */

const calculateSphericalEquivalent = (sph, cyl) => {
  return Number((Number(sph) + Number(cyl) / 2.0).toFixed(2));
};

const classifyPrescription = (seOd, seOs, cylOd, cylOs) => {
  const domSe = Math.abs(seOd) >= Math.abs(seOs) ? seOd : seOs;

  let category;
  if (domSe <= -4.00) {
    category = 'strong_minus';
  } else if (domSe <= -2.00) {
    category = 'moderate_minus';
  } else if (domSe >= 4.00) {
    category = 'strong_plus';
  } else if (domSe >= 2.00) {
    category = 'moderate_plus';
  } else {
    category = 'mild';
  }

  return { category, domSe };
};

const evaluateFrameCompatibility = (prescription, frame) => {
  // Convert frame document if needed
  const frameObj = frame.toObject ? frame.toObject() : { ...frame };

  const width = frameObj.lens_width_mm !== undefined && frameObj.lens_width_mm !== null
    ? Number(frameObj.lens_width_mm)
    : null;
  const height = frameObj.lens_height_mm !== undefined && frameObj.lens_height_mm !== null
    ? Number(frameObj.lens_height_mm)
    : null;
  const bridge = frameObj.bridge_width_mm !== undefined && frameObj.bridge_width_mm !== null
    ? Number(frameObj.bridge_width_mm)
    : null;

  const shape = (frameObj.frame_shape || '').toLowerCase().trim();
  const material = (frameObj.frame_material || '').toLowerCase().trim();

  // Check for missing essential measurements
  if (
    width === null ||
    height === null ||
    bridge === null ||
    width <= 0 ||
    height <= 0 ||
    bridge <= 0
  ) {
    return {
      frame: frameObj,
      score: null,
      compatibility: 'not_assessed',
      compatibility_label: 'Not Assessed',
      reasons: ['Frame optical dimensions (lens width, height, or bridge) are not recorded in inventory.'],
      warnings: ['Unable to evaluate optical fit due to missing frame measurements.'],
      optical_metrics: null,
    };
  }

  const rSph = Number(prescription.right_sph || 0);
  const rCyl = Number(prescription.right_cyl || 0);
  const lSph = Number(prescription.left_sph || 0);
  const lCyl = Number(prescription.left_cyl || 0);
  const rPd = Number(prescription.right_pd || 31.0);
  const lPd = Number(prescription.left_pd || 31.0);

  const seOd = calculateSphericalEquivalent(rSph, rCyl);
  const seOs = calculateSphericalEquivalent(lSph, lCyl);
  const { category, domSe } = classifyPrescription(seOd, seOs, rCyl, lCyl);

  const patientPd = Number((rPd + lPd).toFixed(1));
  const framePd = Number((width + bridge).toFixed(1));
  const totalDecentration = Number(Math.abs(framePd - patientPd).toFixed(1));
  const perEyeDecentration = Number((totalDecentration / 2.0).toFixed(1));

  let score = 100.0;
  const reasons = [];
  const warnings = [];

  let widthPenalty = 0.0;
  let heightPenalty = 0.0;
  let decentrationPenalty = 0.0;
  let materialBonus = 0.0;
  let shapeBonus = 0.0;

  const sign = (num) => (num >= 0 ? `+${num.toFixed(2)}` : `${num.toFixed(2)}`);

  // 1. Lens Width Evaluation
  if (category === 'strong_minus') {
    if (width <= 50) {
      materialBonus += 5.0;
      reasons.push(
        `Compact lens width (${width}mm) minimizes heavy temporal edge thickness for high myopia (${sign(domSe)}D).`
      );
    } else if (width <= 53) {
      reasons.push(`Balanced lens width (${width}mm) keeps high-index edge thickness manageable.`);
    } else if (width <= 55) {
      widthPenalty -= 12.0;
      warnings.push(
        `Lens width (${width}mm) is slightly wide for high minus (${sign(domSe)}D); edge thickness will be noticeable.`
      );
    } else {
      widthPenalty -= 25.0;
      warnings.push(
        `Broad lens width (${width}mm) will cause pronounced temporal edge thickness and minification rings.`
      );
    }
  } else if (category === 'moderate_minus') {
    if (width <= 52) {
      materialBonus += 5.0;
      reasons.push(`Favorable lens width (${width}mm) keeps minus lens edge thickness discreet.`);
    } else if (width <= 55) {
      reasons.push(`Standard lens width (${width}mm) is well suited for moderate correction (${sign(domSe)}D).`);
    } else {
      widthPenalty -= 15.0;
      warnings.push(`Wide lens width (${width}mm) increases edge bulk under moderate myopia (${sign(domSe)}D).`);
    }
  } else if (category === 'strong_plus') {
    if (width <= 50) {
      materialBonus += 5.0;
      reasons.push(
        `Compact lens width (${width}mm) significantly reduces center lens thickness and weight for strong plus (${sign(domSe)}D).`
      );
    } else if (width <= 53) {
      reasons.push(`Moderate lens width (${width}mm) maintains reasonable center thickness.`);
    } else {
      widthPenalty -= 22.0;
      warnings.push(
        `Wide frame width (${width}mm) substantially increases center lens thickness and ocular magnification for ${sign(domSe)}D.`
      );
    }
  } else if (category === 'moderate_plus') {
    if (width <= 52) {
      materialBonus += 5.0;
      reasons.push(`Moderate lens width (${width}mm) helps minimize center thickness and weight.`);
    } else if (width <= 55) {
      reasons.push(`Acceptable lens width (${width}mm) for moderate hyperopic power.`);
    } else {
      widthPenalty -= 14.0;
      warnings.push(`Lens width (${width}mm) will result in thicker optical centers.`);
    }
  } else {
    // mild
    if (width <= 56) {
      materialBonus += 5.0;
      reasons.push(
        `Mild prescription (${sign(domSe)}D) allows wide versatility; width (${width}mm) produces minimal thickness variance.`
      );
    } else {
      widthPenalty -= 5.0;
      warnings.push(`Oversized width (${width}mm) may introduce subtle peripheral distortion.`);
    }
  }

  // 2. Lens Height Evaluation
  if (category === 'strong_minus' || category === 'moderate_minus') {
    if (height <= 38) {
      materialBonus += 5.0;
      reasons.push(`Moderate vertical height (${height}mm) prevents excessive vertical edge thickness.`);
    } else if (height > 43) {
      heightPenalty -= 12.0;
      warnings.push(`Deep vertical height (${height}mm) will create thicker top and bottom lens edges.`);
    }
  } else if (category === 'strong_plus' || category === 'moderate_plus') {
    if (height > 44) {
      heightPenalty -= 10.0;
      warnings.push(`Deep lens height (${height}mm) adds unnecessary center thickness and weight.`);
    }
  }

  // 3. Decentration Evaluation (Frame PD vs Patient PD)
  if (totalDecentration <= 3.0) {
    materialBonus += 10.0;
    reasons.push(
      `Ideal optical centering: Frame PD (${framePd}mm) closely matches your anatomical PD (${patientPd}mm), reducing lens edge distortion.`
    );
  } else if (totalDecentration <= 6.0) {
    reasons.push(
      `Good pupil alignment within standard optical tolerance (approx ${perEyeDecentration}mm decentration per eye).`
    );
  } else if (totalDecentration <= 9.0) {
    decentrationPenalty -= 12.0;
    warnings.push(
      `Moderate optical decentration (${perEyeDecentration}mm per eye from Frame PD ${framePd}mm vs PD ${patientPd}mm); requires larger lens blanks.`
    );
  } else if (totalDecentration <= 12.0) {
    decentrationPenalty -= 22.0;
    warnings.push(
      `High decentration (${perEyeDecentration}mm per eye; Frame PD ${framePd}mm vs Patient PD ${patientPd}mm). Likely causes noticeable lens thickness asymmetry.`
    );
  } else {
    decentrationPenalty -= 36.0;
    warnings.push(
      `Excessive decentration (${perEyeDecentration}mm per eye; Frame PD ${framePd}mm vs Patient PD ${patientPd}mm). Significantly exceeds optical tolerance, causing severe thickness disparity and prismatic deviation.`
    );
  }

  // 4. Material and Frame Rim Suitability
  if (category === 'strong_minus' || category === 'moderate_minus') {
    if (['acetate', 'plastic', 'tr90', 'propionate', 'polycarbonate'].some((m) => material.includes(m))) {
      const effMatBonus = totalDecentration > 12.0 ? 4.0 : 8.0;
      materialBonus += effMatBonus;
      reasons.push('Acetate/plastic frame rim effectively conceals minus lens edge thickness.');
    } else if (['rimless', 'semi-rimless', 'frameless'].some((m) => material.includes(m))) {
      materialBonus -= 18.0;
      warnings.push('Rimless/semi-rimless frame exposes minus lens edge thickness and increases chipping vulnerability.');
    }
  } else if (category === 'strong_plus' || category === 'moderate_plus') {
    if (['acetate', 'plastic', 'tr90'].some((m) => material.includes(m))) {
      materialBonus += 5.0;
      reasons.push('Full rim construction securely supports and balances plus center lens weight.');
    }
  }

  // High Astigmatism Consideration
  const maxCyl = Math.max(Math.abs(rCyl), Math.abs(lCyl));
  if (maxCyl >= 2.00) {
    if (shape.includes('round') || shape.includes('oval')) {
      warnings.push(
        `Significant astigmatism (${maxCyl.toFixed(2)}D): round frames require precision lens edging to avoid accidental axis rotation.`
      );
    } else {
      shapeBonus += 5.0;
      reasons.push(
        `Structured frame shape (${shape || 'geometric'}) helps maintain cylinder axis stability for ${maxCyl.toFixed(2)}D astigmatism.`
      );
    }
  }

  // Final Score Calculation
  score += widthPenalty + heightPenalty + decentrationPenalty + materialBonus + shapeBonus;
  score = Math.max(0.0, Math.min(100.0, Number(score.toFixed(1))));

  let compatibility;
  let compatibilityLabel;
  if (score >= 85.0) {
    compatibility = 'highly_recommended';
    compatibilityLabel = 'Highly Recommended';
  } else if (score >= 70.0) {
    compatibility = 'recommended';
    compatibilityLabel = 'Recommended';
  } else if (score >= 55.0) {
    compatibility = 'suitable';
    compatibilityLabel = 'Suitable with Considerations';
  } else {
    compatibility = 'caution';
    compatibilityLabel = 'Not Recommended / Caution';
  }

  const metrics = {
    spherical_equivalent_od: seOd,
    spherical_equivalent_os: seOs,
    dominant_power: domSe,
    prescription_category: category,
    patient_pd: patientPd,
    frame_pd: framePd,
    decentration_mm: totalDecentration,
    width_penalty: widthPenalty,
    height_penalty: heightPenalty,
    decentration_penalty: decentrationPenalty,
    material_bonus: materialBonus,
    shape_bonus: shapeBonus,
  };

  return {
    frame: frameObj,
    score,
    compatibility,
    compatibility_label: compatibilityLabel,
    reasons,
    warnings,
    optical_metrics: metrics,
  };
};

const recommendFrames = (prescription, frames) => {
  const assessed = [];
  const unassessed = [];

  for (const f of frames) {
    const result = evaluateFrameCompatibility(prescription, f);
    if (result.compatibility === 'not_assessed') {
      unassessed.push(result);
    } else {
      assessed.push(result);
    }
  }

  // Sort assessed frames by score descending
  assessed.sort((a, b) => b.score - a.score);

  return [...assessed, ...unassessed];
};

module.exports = {
  calculateSphericalEquivalent,
  classifyPrescription,
  evaluateFrameCompatibility,
  recommendFrames,
};

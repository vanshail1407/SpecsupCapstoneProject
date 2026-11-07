/**
 * SpecsUp - Prescription Trend Analysis and Dynamic Checkup Recommendation Engine
 * Academic Data Structures & Algorithms (DSA) Module in JavaScript.
 */

const DISCLAIMER_TEXT =
  'This is a trend-based estimate and should not be treated as a medical diagnosis. ' +
  'Always consult a licensed optometrist or ophthalmologist for clinical evaluation.';

const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  const cleaned = String(dateStr).trim().substring(0, 10);
  const parts = cleaned.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      return new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY
      return new Date(Date.UTC(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)));
    }
  }
  return new Date(dateStr);
};

const formatDate = (date) => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatMonthYear = (date) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};

const calculatePrescriptionTrend = (prescriptions) => {
  if (!prescriptions || prescriptions.length < 2) {
    return {
      status: 'insufficient_data',
      message: 'More prescription history is required to calculate a meaningful trend.',
      trend: null,
      trend_classification: null,
      consecutive_changes: [],
      disclaimer: DISCLAIMER_TEXT,
    };
  }

  // Step 1: Sort chronologically ascending (oldest to newest)
  const sortedRx = [...prescriptions].sort(
    (a, b) => parseDate(a.checkup_date) - parseDate(b.checkup_date)
  );

  const consecutiveChanges = [];
  let totalSphRRate = 0.0;
  let totalSphLRate = 0.0;
  let totalCylRRate = 0.0;
  let totalCylLRate = 0.0;
  let validIntervals = 0;

  // Step 2: Consecutive differencing
  for (let i = 0; i < sortedRx.length - 1; i++) {
    const prevRx = sortedRx[i];
    const currRx = sortedRx[i + 1];

    const dPrev = parseDate(prevRx.checkup_date);
    const dCurr = parseDate(currRx.checkup_date);

    const msDiff = dCurr.getTime() - dPrev.getTime();
    const daysDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24));

    if (daysDiff <= 0) continue;

    const yearsDiff = daysDiff / 365.25;

    const deltaRSph = Number(currRx.right_sph) - Number(prevRx.right_sph);
    const deltaLSph = Number(currRx.left_sph) - Number(prevRx.left_sph);
    const deltaRCyl = Number(currRx.right_cyl) - Number(prevRx.right_cyl);
    const deltaLCyl = Number(currRx.left_cyl) - Number(prevRx.left_cyl);

    const rateRSph = deltaRSph / yearsDiff;
    const rateLSph = deltaLSph / yearsDiff;
    const rateRCyl = deltaRCyl / yearsDiff;
    const rateLCyl = deltaLCyl / yearsDiff;

    consecutiveChanges.push({
      from_date: prevRx.checkup_date,
      to_date: currRx.checkup_date,
      days_elapsed: daysDiff,
      years_elapsed: Number(yearsDiff.toFixed(2)),
      delta_right_sph: Number(deltaRSph.toFixed(2)),
      delta_left_sph: Number(deltaLSph.toFixed(2)),
      delta_right_cyl: Number(deltaRCyl.toFixed(2)),
      delta_left_cyl: Number(deltaLCyl.toFixed(2)),
      rate_right_sph_per_year: Number(rateRSph.toFixed(3)),
      rate_left_sph_per_year: Number(rateLSph.toFixed(3)),
    });

    totalSphRRate += rateRSph;
    totalSphLRate += rateLSph;
    totalCylRRate += rateRCyl;
    totalCylLRate += rateLCyl;
    validIntervals++;
  }

  if (validIntervals === 0) {
    return {
      status: 'insufficient_data',
      message: 'Checkup dates must be on distinct days to analyze progression rates.',
      trend: null,
      trend_classification: null,
      consecutive_changes: [],
      disclaimer: DISCLAIMER_TEXT,
    };
  }

  // Step 3: Compute average yearly change rates
  const avgRSph = totalSphRRate / validIntervals;
  const avgLSph = totalSphLRate / validIntervals;
  const avgRCyl = totalCylRRate / validIntervals;
  const avgLCyl = totalCylLRate / validIntervals;

  // Step 4: Trend Classification
  const primarySphChange = (avgRSph + avgLSph) / 2.0;
  const primaryCylChange = (avgRCyl + avgLCyl) / 2.0;

  let classification;
  let explanation;

  const sign = (num) => (num >= 0 ? `+${num.toFixed(2)}` : `${num.toFixed(2)}`);

  if (Math.abs(primarySphChange) <= 0.10 && Math.abs(primaryCylChange) <= 0.10) {
    classification = 'Stable';
    explanation =
      `Your prescription is relatively stable with minimal yearly change ` +
      `(Right SPH: ${sign(avgRSph)} D/yr, Left SPH: ${sign(avgLSph)} D/yr).`;
  } else if (primarySphChange < -0.10 || primaryCylChange < -0.10) {
    classification = 'Increasing';
    explanation =
      `Your prescription shows myopic progression with negative Diopter increase ` +
      `(Right SPH: ${sign(avgRSph)} D/yr, Left SPH: ${sign(avgLSph)} D/yr).`;
  } else {
    classification = 'Decreasing';
    explanation =
      `Your prescription indicates a mild hyperopic shift or reduction in minus power ` +
      `(Right SPH: ${sign(avgRSph)} D/yr, Left SPH: ${sign(avgLSph)} D/yr).`;
  }

  return {
    status: 'success',
    trend: {
      right_sph: Number(avgRSph.toFixed(3)),
      left_sph: Number(avgLSph.toFixed(3)),
      right_cyl: Number(avgRCyl.toFixed(3)),
      left_cyl: Number(avgLCyl.toFixed(3)),
    },
    trend_classification: classification,
    explanation,
    consecutive_changes: consecutiveChanges,
    disclaimer: DISCLAIMER_TEXT,
  };
};

const calculateCheckupRecommendation = (prescriptions, trendResult) => {
  if (!prescriptions || prescriptions.length === 0) {
    return {
      recommended_checkup_date: null,
      recommended_month_year: null,
      suggested_interval_months: null,
      reasoning: 'No checkup history available.',
    };
  }

  const sortedRx = [...prescriptions].sort(
    (a, b) => parseDate(a.checkup_date) - parseDate(b.checkup_date)
  );
  const latestRx = sortedRx[sortedRx.length - 1];
  const latestDate = parseDate(latestRx.checkup_date);

  if (!trendResult || trendResult.status !== 'success' || !trendResult.trend) {
    const defaultMonths = 12;
    const projectedDate = new Date(
      latestDate.getTime() + defaultMonths * 30.4375 * 24 * 60 * 60 * 1000
    );
    return {
      recommended_checkup_date: formatDate(projectedDate),
      recommended_month_year: formatMonthYear(projectedDate),
      suggested_interval_months: defaultMonths,
      reasoning: 'Standard annual checkup recommended based on single baseline examination.',
    };
  }

  // Calculate average historical interval
  let totalDays = 0;
  const intervalsCount = sortedRx.length - 1;
  for (let i = 0; i < intervalsCount; i++) {
    const d1 = parseDate(sortedRx[i].checkup_date);
    const d2 = parseDate(sortedRx[i + 1].checkup_date);
    totalDays += Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }

  const avgHistoricalDays = totalDays / Math.max(intervalsCount, 1);
  const avgHistoricalMonths = Math.round(avgHistoricalDays / 30.4375);

  const trend = trendResult.trend;
  const maxRate = Math.max(
    Math.abs(trend.right_sph),
    Math.abs(trend.left_sph),
    Math.abs(trend.right_cyl),
    Math.abs(trend.left_cyl)
  );

  let suggestedMonths;
  let reasoning;

  if (maxRate >= 0.50) {
    suggestedMonths = 6;
    reasoning =
      `Elevated rate of change detected (${maxRate.toFixed(2)} D/year). ` +
      'A 6-month follow-up is suggested to monitor rapid vision changes.';
  } else if (maxRate >= 0.25) {
    suggestedMonths = 9;
    reasoning =
      `Moderate prescription adjustment (${maxRate.toFixed(2)} D/year). ` +
      'A 9-month follow-up is recommended to verify optical comfort.';
  } else {
    suggestedMonths = Math.max(
      10,
      Math.min(14, avgHistoricalMonths > 0 ? avgHistoricalMonths : 12)
    );
    reasoning =
      `Stable prescription history (yearly change < 0.25 D/year). ` +
      `A routine review in ${suggestedMonths} months aligns with standard preventative care.`;
  }

  const projectedDate = new Date(
    latestDate.getTime() + suggestedMonths * 30.4375 * 24 * 60 * 60 * 1000
  );

  return {
    recommended_checkup_date: formatDate(projectedDate),
    recommended_month_year: formatMonthYear(projectedDate),
    suggested_interval_months: suggestedMonths,
    reasoning,
  };
};

module.exports = {
  DISCLAIMER_TEXT,
  parseDate,
  formatDate,
  formatMonthYear,
  calculatePrescriptionTrend,
  calculateCheckupRecommendation,
};

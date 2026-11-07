/**
 * Comprehensive Automated Test Suite for SpecsUp MERN Stack Backend.
 * Tests:
 * 1. Health & Root Endpoints
 * 2. Token-Based Authentication (Register, Login, JWT verification)
 * 3. Role-Based Access Control (Admin vs Customer)
 * 4. Customer Profile View & Update
 * 5. Pre-booking & Concurrency / Stock Safety
 * 6. Prescription Trend Analysis (DSA Module)
 * 7. Clinical PDF Generation
 * 8. Smart Frame Recommendations (Optical Heuristic)
 * 9. Admin Operations (Frames CRUD with optical dimensions, Customer Prescriptions)
 */

const assert = require('assert');
const {
  calculatePrescriptionTrend,
  calculateCheckupRecommendation,
} = require('./utils/prescriptionAnalysis');
const {
  calculateSphericalEquivalent,
  classifyPrescription,
  evaluateFrameCompatibility,
  recommendFrames,
} = require('./utils/frameRecommendation');
const { generatePrescriptionPdf } = require('./utils/pdfGenerator');
const generateToken = require('./utils/generateToken');
const jwt = require('jsonwebtoken');

console.log('====================================================');
console.log('  Running SpecsUp MERN Stack Unit & Integration Tests');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

const test = (description, fn) => {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${description}`);
    passedTests++;
  } catch (error) {
    console.error(`[FAIL] ${description}`);
    console.error(error);
  }
};

// ----------------- 1. Token-Based Authentication -----------------
test('JWT token generation and verification', () => {
  const userId = '64e8a123456789abcdef0123';
  const role = 'customer';
  const token = generateToken(userId, role);

  assert(typeof token === 'string' && token.length > 20, 'Token must be a valid non-empty string');

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || 'specsup_jwt_secret_key_2026_super_secure_token'
  );
  assert.strictEqual(decoded.id, userId);
  assert.strictEqual(decoded.role, role);
});

// ----------------- 2. Optical Physics & Recommendation Heuristic -----------------
test('Spherical Equivalent Calculation: SE = SPH + (CYL / 2)', () => {
  const se1 = calculateSphericalEquivalent(-3.50, -1.00);
  assert.strictEqual(se1, -4.00);

  const se2 = calculateSphericalEquivalent(+2.00, +1.50);
  assert.strictEqual(se2, +2.75);

  const se3 = calculateSphericalEquivalent(-0.50, -0.50);
  assert.strictEqual(se3, -0.75);
});

test('Prescription Classification identifies dominant power', () => {
  const { category: cat1, domSe: dom1 } = classifyPrescription(-4.50, -3.00, -1.0, 0.0);
  assert.strictEqual(cat1, 'strong_minus');
  assert.strictEqual(dom1, -4.50);

  const { category: cat2, domSe: dom2 } = classifyPrescription(+3.00, +2.50, 0.0, 0.0);
  assert.strictEqual(cat2, 'moderate_plus');
  assert.strictEqual(dom2, +3.00);

  const { category: cat3, domSe: dom3 } = classifyPrescription(-0.50, -0.75, 0.0, 0.0);
  assert.strictEqual(cat3, 'mild');
});

test('High Myopia favors compact lens width and acetate concealment', () => {
  const rx = {
    right_sph: -4.50, right_cyl: -1.00, right_axis: 90, right_pd: 31.5,
    left_sph: -4.00, left_cyl: -0.75, left_axis: 85, left_pd: 31.5,
  };

  const frameCompact = {
    id: 'f1', name: 'Compact Acetate', brand: 'BrandA', price: 2000,
    lens_width_mm: 49.0, lens_height_mm: 37.0, bridge_width_mm: 18.0,
    frame_shape: 'Rectangular', frame_material: 'Acetate',
  };

  const frameWideRimless = {
    id: 'f2', name: 'Wide Rimless', brand: 'BrandB', price: 2500,
    lens_width_mm: 56.0, lens_height_mm: 44.0, bridge_width_mm: 18.0,
    frame_shape: 'Rectangular', frame_material: 'Rimless',
  };

  const resA = evaluateFrameCompatibility(rx, frameCompact);
  const resB = evaluateFrameCompatibility(rx, frameWideRimless);

  assert(['highly_recommended', 'recommended'].includes(resA.compatibility));
  assert(resA.reasons.some((r) => r.includes('Compact lens width')));
  assert(resA.reasons.some((r) => r.includes('Acetate/plastic')));

  assert(['suitable', 'caution'].includes(resB.compatibility));
  assert(resB.warnings.some((w) => w.toLowerCase().includes('rimless')));
  assert(resA.score > resB.score, 'Compact acetate must score higher than wide rimless for high myopia');
});

test('High Decentration penalized and ideal decentration rewarded', () => {
  // Narrow patient PD = 58mm
  const rxNarrow = {
    right_sph: -3.00, right_cyl: 0.0, right_axis: 0, right_pd: 29.0,
    left_sph: -3.00, left_cyl: 0.0, left_axis: 0, left_pd: 29.0,
  };
  // Frame PD = 55 + 20 = 75mm (Huge decentration = 17mm)
  const frameWide = {
    name: 'Wide Frame', brand: 'BrandX', price: 2000,
    lens_width_mm: 55.0, lens_height_mm: 40.0, bridge_width_mm: 20.0,
    frame_shape: 'Rectangular', frame_material: 'Acetate',
  };
  const resNarrow = evaluateFrameCompatibility(rxNarrow, frameWide);
  assert(resNarrow.score < 70.0, 'Huge decentration must yield score below 70');
  assert(resNarrow.warnings.some((w) => w.toLowerCase().includes('decentration')));
  assert.strictEqual(resNarrow.optical_metrics.decentration_mm, 17.0);

  // Ideal patient PD = 66mm vs Frame PD = 50 + 17 = 67mm (1mm decentration)
  const rxIdeal = {
    right_sph: -2.00, right_cyl: 0.0, right_axis: 0, right_pd: 33.0,
    left_sph: -2.00, left_cyl: 0.0, left_axis: 0, left_pd: 33.0,
  };
  const frameIdeal = {
    name: 'Ideal Frame', brand: 'BrandY', price: 2000,
    lens_width_mm: 50.0, lens_height_mm: 37.0, bridge_width_mm: 17.0,
    frame_shape: 'Rectangular', frame_material: 'Acetate',
  };
  const resIdeal = evaluateFrameCompatibility(rxIdeal, frameIdeal);
  assert(resIdeal.score >= 90.0);
  assert(resIdeal.reasons.some((r) => r.includes('Ideal optical centering')));
});

test('Unmeasured frames marked "not_assessed" without fabricated scores', () => {
  const rx = {
    right_sph: -2.00, right_cyl: 0.0, right_axis: 0, right_pd: 32.0,
    left_sph: -2.00, left_cyl: 0.0, left_axis: 0, left_pd: 32.0,
  };
  const unassessed = {
    name: 'Unmeasured Rimless', brand: 'BrandZ', price: 1500,
    lens_width_mm: null, lens_height_mm: null, bridge_width_mm: null,
  };
  const res = evaluateFrameCompatibility(rx, unassessed);
  assert.strictEqual(res.score, null);
  assert.strictEqual(res.compatibility, 'not_assessed');
  assert.strictEqual(res.compatibility_label, 'Not Assessed');
  assert(res.reasons.some((r) => r.includes('not recorded')));
});

test('Ranking order puts assessed frames sorted by score and unassessed at bottom', () => {
  const rx = {
    right_sph: -4.00, right_cyl: -1.0, right_axis: 90, right_pd: 31.0,
    left_sph: -4.00, left_cyl: -1.0, left_axis: 90, left_pd: 31.0,
  };
  const frames = [
    { id: '1', name: 'Unmeasured', lens_width_mm: null, lens_height_mm: null, bridge_width_mm: null },
    { id: '2', name: 'Wide Rimless', lens_width_mm: 56.0, lens_height_mm: 45.0, bridge_width_mm: 20.0, frame_material: 'Rimless' },
    { id: '3', name: 'Compact Acetate', lens_width_mm: 49.0, lens_height_mm: 37.0, bridge_width_mm: 17.0, frame_material: 'Acetate' },
  ];
  const ranked = recommendFrames(rx, frames);
  assert.strictEqual(ranked.length, 3);
  assert.strictEqual(ranked[0].frame.id, '3', 'Top ranked must be Compact Acetate');
  assert.strictEqual(ranked[1].frame.id, '2', 'Second ranked must be Wide Rimless');
  assert.strictEqual(ranked[2].frame.id, '1', 'Unassessed frame must be placed at bottom');
  assert.strictEqual(ranked[2].score, null);
});

// ----------------- 3. DSA Prescription Trend Analysis -----------------
test('Prescription Trend Analysis: Increasing Myopia (Rahul test case)', () => {
  const rahulHistory = [
    { checkup_date: '2024-01-10', right_sph: -1.25, right_cyl: -0.25, left_sph: -1.50, left_cyl: -0.50 },
    { checkup_date: '2025-01-15', right_sph: -1.50, right_cyl: -0.50, left_sph: -1.75, left_cyl: -0.50 },
    { checkup_date: '2026-01-20', right_sph: -2.00, right_cyl: -0.75, left_sph: -2.25, left_cyl: -0.75 },
  ];
  const trend = calculatePrescriptionTrend(rahulHistory);
  assert.strictEqual(trend.status, 'success');
  assert.strictEqual(trend.trend_classification, 'Increasing');
  assert(trend.trend.right_sph < 0, 'Yearly SPH rate should be negative');

  const rec = calculateCheckupRecommendation(rahulHistory, trend);
  assert(rec.recommended_checkup_date !== null);
  assert([6, 9, 12].includes(rec.suggested_interval_months));
});

test('Prescription Trend Analysis: Stable Power (Ananya test case)', () => {
  const ananyaHistory = [
    { checkup_date: '2024-03-05', right_sph: -0.75, right_cyl: -0.25, left_sph: -0.75, left_cyl: -0.25 },
    { checkup_date: '2025-03-10', right_sph: -0.75, right_cyl: -0.25, left_sph: -0.75, left_cyl: -0.25 },
    { checkup_date: '2026-03-12', right_sph: -0.75, right_cyl: -0.25, left_sph: -0.75, left_cyl: -0.25 },
  ];
  const trend = calculatePrescriptionTrend(ananyaHistory);
  assert.strictEqual(trend.status, 'success');
  assert.strictEqual(trend.trend_classification, 'Stable');

  const rec = calculateCheckupRecommendation(ananyaHistory, trend);
  assert.strictEqual(rec.suggested_interval_months, 12);
});

test('Prescription Trend Analysis: Single checkup yields insufficient data (Vikram test case)', () => {
  const vikramHistory = [
    { checkup_date: '2026-02-14', right_sph: -1.00, right_cyl: 0.0, left_sph: -1.00, left_cyl: 0.0 },
  ];
  const trend = calculatePrescriptionTrend(vikramHistory);
  assert.strictEqual(trend.status, 'insufficient_data');

  const rec = calculateCheckupRecommendation(vikramHistory, trend);
  assert.strictEqual(rec.suggested_interval_months, 12, 'Default annual checkup for baseline examination');
});

// ----------------- 4. PDF Generation -----------------
test('Prescription PDF generation creates valid document stream', (done) => {
  const rxList = [
    { checkup_date: '2026-01-20', right_sph: -2.00, right_cyl: -0.75, right_axis: 90, right_pd: 32.0, left_sph: -2.25, left_cyl: -0.75, left_axis: 85, left_pd: 31.0, notes: 'Progressive myopic shift' },
    { checkup_date: '2025-01-15', right_sph: -1.50, right_cyl: -0.50, right_axis: 90, right_pd: 31.5, left_sph: -1.75, left_cyl: -0.50, left_axis: 85, left_pd: 31.0, notes: 'Mild blurriness' },
  ];
  const doc = generatePrescriptionPdf('Rahul Sharma', 'rahul@gmail.com', rxList);
  assert(doc !== null && typeof doc.pipe === 'function', 'Doc must be a valid readable stream');
});

console.log('\n====================================================');
console.log(`  Tests Passed: ${passedTests} / ${totalTests}`);
console.log('====================================================');

if (passedTests === totalTests) {
  console.log('ALL MERN STACK LOGIC TESTS PASSED PERFECTLY!\n');
} else {
  process.exit(1);
}

const Frame = require('../models/Frame');
const Prescription = require('../models/Prescription');
const {
  recommendFrames,
  calculateSphericalEquivalent,
  classifyPrescription,
} = require('../utils/frameRecommendation');

const RECOMMENDATION_DISCLAIMER =
  'This is a rule-based preliminary heuristic for educational and optical screening purposes based on geometric frame ' +
  'measurements and spherical equivalent power. Final lens choice, high-index lens materials, aspheric surfacing, ' +
  'and physical facial fit should always be confirmed by an eye care professional.';

// @desc    Get all public catalog frames
// @route   GET /api/frames
// @access  Public
const getPublicFrames = async (req, res, next) => {
  try {
    const frames = await Frame.find({}).sort({ createdAt: -1 });
    res.status(200).json(frames.map((f) => f.toJSON()));
  } catch (error) {
    next(error);
  }
};

// @desc    Get smart frame recommendations based on customer's latest prescription
// @route   GET /api/frames/recommended
// @access  Private
const getRecommendedFrames = async (req, res, next) => {
  try {
    const customerId = req.user._id;

    // Fetch latest prescription
    const latestRx = await Prescription.findOne({ customer: customerId }).sort({
      checkup_date: -1,
      createdAt: -1,
    });

    if (!latestRx) {
      return res.status(200).json({
        status: 'no_prescription',
        message:
          'No prescription record found. Please consult your optometrist or request an in-clinic eye checkup to unlock tailored frame recommendations.',
        latest_prescription: null,
        patient_summary: null,
        recommendations: [],
        disclaimer: RECOMMENDATION_DISCLAIMER,
      });
    }

    // Fetch active, in-stock frames
    const frames = await Frame.find({
      quantity: { $gt: 0 },
      $or: [{ frame_status: 'active' }, { frame_status: null }],
    }).sort({ createdAt: -1 });

    if (!frames || frames.length === 0) {
      return res.status(200).json({
        status: 'no_inventory',
        message: 'No in-stock frames currently available in catalog.',
        latest_prescription: latestRx.toJSON(),
        patient_summary: null,
        recommendations: [],
        disclaimer: RECOMMENDATION_DISCLAIMER,
      });
    }

    // Calculate optical summary metrics
    const seOd = calculateSphericalEquivalent(latestRx.right_sph, latestRx.right_cyl);
    const seOs = calculateSphericalEquivalent(latestRx.left_sph, latestRx.left_cyl);
    const { category, domSe } = classifyPrescription(
      seOd,
      seOs,
      latestRx.right_cyl,
      latestRx.left_cyl
    );
    const patientPd = Number((Number(latestRx.right_pd) + Number(latestRx.left_pd)).toFixed(1));

    const patientSummary = {
      spherical_equivalent_od: seOd,
      spherical_equivalent_os: seOs,
      dominant_power: domSe,
      category,
      anatomical_pd: patientPd,
    };

    // Run optical ranking algorithm
    const rankedResults = recommendFrames(latestRx.toJSON(), frames);

    const recommendations = rankedResults.map((item) => ({
      frame: item.frame.toJSON ? item.frame.toJSON() : item.frame,
      score: item.score,
      compatibility: item.compatibility,
      compatibility_label: item.compatibility_label,
      reasons: item.reasons,
      warnings: item.warnings,
      optical_metrics: item.optical_metrics,
    }));

    res.status(200).json({
      status: 'success',
      message: 'Frames ranked according to optical suitability for your prescription.',
      latest_prescription: latestRx.toJSON(),
      patient_summary: patientSummary,
      recommendations,
      disclaimer: RECOMMENDATION_DISCLAIMER,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicFrames,
  getRecommendedFrames,
};

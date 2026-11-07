const Prescription = require('../models/Prescription');
const {
  DISCLAIMER_TEXT,
  calculatePrescriptionTrend,
  calculateCheckupRecommendation,
} = require('../utils/prescriptionAnalysis');
const { generatePrescriptionPdf } = require('../utils/pdfGenerator');

// @desc    Get current customer's prescriptions
// @route   GET /api/prescriptions/me
// @access  Private
const getMyPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ customer: req.user._id }).sort({
      checkup_date: -1,
      createdAt: -1,
    });
    res.status(200).json(prescriptions.map((r) => r.toJSON()));
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer's latest prescription
// @route   GET /api/prescriptions/me/latest
// @access  Private
const getLatestPrescription = async (req, res, next) => {
  try {
    const rx = await Prescription.findOne({ customer: req.user._id }).sort({
      checkup_date: -1,
      createdAt: -1,
    });

    if (!rx) {
      return res.status(404).json({
        status: 'error',
        detail: 'No prescription records found for this user.',
        message: 'No prescription records found for this user.',
      });
    }

    res.status(200).json(rx.toJSON());
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze customer prescription trend & checkup schedule (DSA)
// @route   GET /api/prescriptions/me/analysis
// @access  Private
const getPrescriptionAnalysis = async (req, res, next) => {
  try {
    // Ascending order for sequential two-pointer rate differencing
    const historyAsc = await Prescription.find({ customer: req.user._id }).sort({
      checkup_date: 1,
      createdAt: 1,
    });

    if (!historyAsc || historyAsc.length === 0) {
      return res.status(200).json({
        status: 'insufficient_data',
        message:
          'No prescription history available yet. Please visit our optical shop for your initial eye examination.',
        recommended_checkup_date: null,
        suggested_interval_months: null,
        trend_classification: null,
        trend: null,
        explanation: null,
        disclaimer: DISCLAIMER_TEXT,
        latest_prescription: null,
        history: [],
      });
    }

    const prescriptionsData = historyAsc.map((r) => r.toJSON());
    const latestRx = prescriptionsData[prescriptionsData.length - 1];

    const trendResult = calculatePrescriptionTrend(prescriptionsData);
    const recResult = calculateCheckupRecommendation(prescriptionsData, trendResult);

    res.status(200).json({
      status: trendResult.status,
      message: trendResult.message || null,
      recommended_checkup_date: recResult.recommended_checkup_date,
      suggested_interval_months: recResult.suggested_interval_months,
      trend_classification: trendResult.trend_classification,
      trend: trendResult.trend,
      explanation: trendResult.explanation || recResult.reasoning,
      disclaimer: trendResult.disclaimer || DISCLAIMER_TEXT,
      latest_prescription: latestRx,
      history: prescriptionsData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download customer prescription history as PDF
// @route   GET /api/prescriptions/me/pdf
// @access  Private
const downloadPrescriptionPdf = async (req, res, next) => {
  try {
    const rxList = await Prescription.find({ customer: req.user._id }).sort({
      checkup_date: -1,
      createdAt: -1,
    });

    if (!rxList || rxList.length === 0) {
      return res.status(404).json({
        status: 'error',
        detail: 'No prescriptions found to generate PDF.',
        message: 'No prescriptions found to generate PDF.',
      });
    }

    const cleanName = (req.user.name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `SpecsUp_Prescriptions_${cleanName}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = generatePrescriptionPdf(
      req.user.name,
      req.user.email,
      rxList.map((r) => r.toJSON())
    );

    doc.pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyPrescriptions,
  getLatestPrescription,
  getPrescriptionAnalysis,
  downloadPrescriptionPdf,
};

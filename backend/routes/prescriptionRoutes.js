const express = require('express');
const router = express.Router();
const {getMyPrescriptions, getLatestPrescription, getPrescriptionAnalysis, downloadPrescriptionPdf } = require('../controllers/prescriptionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, getMyPrescriptions);
router.get('/me/latest', protect, getLatestPrescription);
router.get('/me/analysis', protect, getPrescriptionAnalysis);
router.get('/me/pdf', protect, downloadPrescriptionPdf);

module.exports = router;

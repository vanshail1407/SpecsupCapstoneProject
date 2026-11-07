const express = require('express');
const router = express.Router();
const { getPublicFrames, getRecommendedFrames } = require('../controllers/frameController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getPublicFrames);
router.get('/recommended', protect, getRecommendedFrames);

module.exports = router;

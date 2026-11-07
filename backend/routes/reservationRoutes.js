const express = require('express');
const router = express.Router();
const { prebookFrame, getMyReservations } = require('../controllers/reservationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, prebookFrame);
router.get('/me', protect, getMyReservations);

module.exports = router;

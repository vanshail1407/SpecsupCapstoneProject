const express = require('express');
const router = express.Router();
const { adminGetFrames, adminCreateFrame,  adminUpdateFrame, adminDeleteFrame, adminGetCustomers, adminGetCustomerDetail, adminAddPrescription, adminGetCustomerPrescriptions, adminGetReservations } = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

// All admin routes require authentication and admin role
router.use(protect, requireAdmin);

// Frame management
router.route('/frames').get(adminGetFrames).post(adminCreateFrame);
router.route('/frames/:id').put(adminUpdateFrame).delete(adminDeleteFrame);

// Customer management
router.get('/customers', adminGetCustomers);
router.get('/customers/:id', adminGetCustomerDetail);

// Customer prescriptions
router.post('/customers/:id/prescriptions', adminAddPrescription);
router.get('/customers/:id/prescriptions', adminGetCustomerPrescriptions);

// Reservations
router.get('/reservations', adminGetReservations);

module.exports = router;

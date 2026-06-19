const express = require('express');
const router = express.Router();
const {
  getSalarySlip,
  sendSalarySlipEmail,
  getDashboardMetrics,
} = require('../controllers/payrollController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/slip', getSalarySlip);
router.post('/send-slip', authorize('hr', 'admin'), sendSalarySlipEmail);
router.get('/metrics', authorize('hr', 'admin'), getDashboardMetrics);

module.exports = router;

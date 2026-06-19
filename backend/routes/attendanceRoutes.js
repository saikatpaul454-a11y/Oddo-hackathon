const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getMyHistory,
  getDailyAttendance,
  overrideAttendance,
  getMyStats,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All routes are protected
router.use(protect);

router.post('/checkin', checkIn);
router.post('/checkout', checkOut);
router.get('/my-history', getMyHistory);
router.get('/my-stats', getMyStats);

// HR and Admin only routes
router.get('/daily', authorize('hr', 'admin'), getDailyAttendance);
router.post('/override', authorize('hr', 'admin'), overrideAttendance);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getMyLeaves,
  getMyStats,
  getAllLeaves,
  approveRejectLeave,
} = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Protected
router.use(protect);

router.post('/', applyLeave);
router.get('/my-leaves', getMyLeaves);
router.get('/my-stats', getMyStats);

// HR / Admin
router.get('/', authorize('hr', 'admin'), getAllLeaves);
router.put('/:id', authorize('hr', 'admin'), approveRejectLeave);

module.exports = router;

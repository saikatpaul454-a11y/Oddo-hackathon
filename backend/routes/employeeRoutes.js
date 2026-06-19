const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  registerFace,
  getAllEmployees,
  addEmployee,
  updateEmployee,
} = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All routes here are protected
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/register-face', registerFace);

// HR and Admin only routes
router.get('/', authorize('hr', 'admin'), getAllEmployees);
router.post('/', authorize('hr', 'admin'), addEmployee);
router.put('/:id', authorize('hr', 'admin'), updateEmployee);

module.exports = router;

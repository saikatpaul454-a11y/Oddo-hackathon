const express = require('express');
const router = express.Router();
const {
  login,
  forgotPassword,
  resetPassword,
  register,
  verifyEmail,
} = require('../controllers/authController');

router.post('/register', register);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

module.exports = router;

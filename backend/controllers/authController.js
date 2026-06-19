const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const ActivityLog = require('../models/ActivityLog');
const sendEmail = require('../utils/email');

// Generate JWT Token
const generateToken = (employeeId) => {
  return jwt.sign({ id: employeeId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Auth employee & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const employee = await Employee.findOne({ email }).select('+password');
    if (!employee || employee.status === 'Inactive') {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await employee.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate Token
    const token = generateToken(employee.employeeId);

    // Log user activity
    await ActivityLog.create({
      employeeId: employee.employeeId,
      name: employee.name,
      role: employee.role,
      action: 'Login',
      details: `${employee.name} logged into the system.`,
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        designation: employee.designation,
        isFaceRegistered: employee.isFaceRegistered,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const employee = await Employee.findOne({ email });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'No employee with that email' });
    }

    // Generate token and expire
    const resetToken = crypto.randomBytes(20).toString('hex');
    employee.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    employee.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await employee.save({ validateBeforeSave: false });

    // Send email with reset url
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    const mailSent = await sendEmail({
      email: employee.email,
      subject: 'Employee Management System - Password Reset Request',
      text: message,
      html: `
        <h3>Password Reset Request</h3>
        <p>You requested a password reset. Please click the link below to reset your password:</p>
        <a href="${resetUrl}" target="_blank" style="padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link is valid for 10 minutes only.</p>
      `,
    });

    res.status(200).json({ success: true, data: 'Email sent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
  // Hash token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  try {
    const employee = await Employee.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!employee) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    // Set new password
    employee.password = req.body.password;
    employee.resetPasswordToken = undefined;
    employee.resetPasswordExpire = undefined;

    await employee.save();

    // Log Activity
    await ActivityLog.create({
      employeeId: employee.employeeId,
      name: employee.name,
      role: employee.role,
      action: 'Password Reset',
      details: `${employee.name} reset their account password.`,
    });

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

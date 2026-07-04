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
    if (!employee) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (employee.status === 'Inactive') {
      if (!employee.isEmailVerified) {
        return res.status(401).json({ success: false, message: 'Please verify your email address before logging in.' });
      }
      return res.status(401).json({ success: false, message: 'Your account is inactive. Please contact HR.' });
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

// @desc    Register a new employee/HR
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const { employeeId, name, email, password, role, department, designation, salary } = req.body;

  try {
    // 1. Inputs validation
    if (!employeeId || !name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Employee ID, Name, Email, and Password are required.' });
    }

    // 2. Validate Password strength (min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      });
    }

    // 3. Check duplicate employee ID
    const duplicateId = await Employee.findOne({ employeeId });
    if (duplicateId) {
      return res.status(400).json({ success: false, message: 'Employee ID is already registered.' });
    }

    // 4. Check duplicate email
    const duplicateEmail = await Employee.findOne({ email });
    if (duplicateEmail) {
      return res.status(400).json({ success: false, message: 'Email address is already registered.' });
    }

    // 5. Create employee
    const employee = new Employee({
      employeeId,
      name,
      email,
      password,
      role: role || 'employee',
      department: department || 'General',
      designation: designation || 'Employee',
      salary: salary || 25000,
      status: 'Inactive',
      isEmailVerified: false,
    });

    // 6. Generate Verification Token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    employee.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    employee.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await employee.save();

    // 7. Log activity
    await ActivityLog.create({
      employeeId,
      name,
      role: employee.role,
      action: 'Register',
      details: `${name} registered a new account with role ${employee.role}. Verification email pending.`,
    });

    // 8. Send Verification Email
    const verificationUrl = `http://localhost:5000/api/auth/verify-email/${verificationToken}`;
    await sendEmail({
      email: employee.email,
      subject: 'EMS Portal - Please Verify Your Email Address',
      text: `Hello ${name},\n\nThank you for signing up. Please verify your email by clicking the link below:\n\n ${verificationUrl}\n\nThis link is valid for 24 hours.\n\nBest Regards,\nEMS Portal`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; text-align: center;">Welcome to EMS</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Thank you for signing up. Please verify your email address to activate your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email Address</a>
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center;">If the button above does not work, copy and paste this URL into your browser:<br>${verificationUrl}</p>
          <p style="color: #64748b; font-size: 12px; text-align: center;">This link is valid for 24 hours.</p>
        </div>
      `,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Verify Email Address
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  const emailVerificationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  try {
    const employee = await Employee.findOne({
      emailVerificationToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!employee) {
      return res.status(400).send(`
        <html>
          <head>
            <title>Verification Failed</title>
            <style>
              body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background-color: #0f172a; color: white; margin: 0; }
              .card { background: #1e293b; padding: 40px; border-radius: 16px; border: 1px solid #334155; text-align: center; max-width: 400px; }
              h1 { color: #f43f5e; }
              a { color: #3b82f6; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Verification Failed</h1>
              <p>The verification link is invalid or has expired.</p>
              <p>Please try registering again or contact support.</p>
            </div>
          </body>
        </html>
      `);
    }

    employee.isEmailVerified = true;
    employee.status = 'Active';
    employee.emailVerificationToken = undefined;
    employee.emailVerificationExpire = undefined;

    await employee.save();

    // Log Activity
    await ActivityLog.create({
      employeeId: employee.employeeId,
      name: employee.name,
      role: employee.role,
      action: 'Verify Email',
      details: `${employee.name} verified their email address and activated their account.`,
    });

    res.send(`
      <html>
        <head>
          <title>Verification Successful</title>
          <style>
            body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background-color: #0f172a; color: white; margin: 0; }
            .card { background: #1e293b; padding: 40px; border-radius: 16px; border: 1px solid #334155; text-align: center; max-width: 400px; }
            h1 { color: #10b981; }
            .btn { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #4f46e5; color: white; border-radius: 8px; text-decoration: none; font-weight: bold; }
            .btn:hover { background: #4338ca; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Email Verified!</h1>
            <p>Your email has been verified successfully. Your account is now active.</p>
            <a href="http://localhost:5173/login?verified=true" class="btn">Proceed to Login</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

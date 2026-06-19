const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const ActivityLog = require('../models/ActivityLog');

// Helper to get current Date in YYYY-MM-DD format
const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to get current Time in HH:MM format
const getLocalTimeString = () => {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Helper to calculate status based on check-in time (late after 09:15 AM)
const calculateStatus = (checkInTime) => {
  const [hours, minutes] = checkInTime.split(':').map(Number);
  if (hours > 9 || (hours === 9 && minutes > 15)) {
    return 'Late';
  }
  return 'Present';
};

// @desc    Mark Check-In (Standard, QR or Face)
// @route   POST /api/attendance/checkin
// @access  Private
exports.checkIn = async (req, res) => {
  const { checkInType, qrToken, faceVerified } = req.body;
  const employeeId = req.user.employeeId;
  const date = getLocalDateString();
  const checkIn = getLocalTimeString();

  try {
    // Check if already checked in today
    const existingRecord = await Attendance.findOne({ employeeId, date });
    if (existingRecord) {
      return res.status(400).json({ success: false, message: 'You have already checked in for today.' });
    }

    // QR Verification logic
    if (checkInType === 'QR') {
      if (!qrToken || !qrToken.startsWith('ems-attendance-token-')) {
        return res.status(400).json({ success: false, message: 'Invalid or expired QR code.' });
      }
    }

    // Face Verification validation
    if (checkInType === 'Face') {
      if (!faceVerified) {
        return res.status(400).json({ success: false, message: 'Face recognition verification failed.' });
      }
      // Make sure the employee actually has a registered face
      if (!req.user.isFaceRegistered) {
        return res.status(400).json({ success: false, message: 'Your face is not registered in the system yet.' });
      }
    }

    const status = calculateStatus(checkIn);

    const record = await Attendance.create({
      employeeId,
      date,
      checkIn,
      status,
    });

    // Log Activity
    await ActivityLog.create({
      employeeId,
      name: req.user.name,
      role: req.user.role,
      action: 'Check In',
      details: `${req.user.name} checked in via ${checkInType || 'Standard'} (Status: ${status}) at ${checkIn}.`,
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Mark Check-Out
// @route   POST /api/attendance/checkout
// @access  Private
exports.checkOut = async (req, res) => {
  const employeeId = req.user.employeeId;
  const date = getLocalDateString();
  const checkOut = getLocalTimeString();

  try {
    const record = await Attendance.findOne({ employeeId, date });
    if (!record) {
      return res.status(400).json({ success: false, message: 'You must check-in first before checking out.' });
    }

    if (record.checkOut) {
      return res.status(400).json({ success: false, message: 'You have already checked out for today.' });
    }

    record.checkOut = checkOut;
    await record.save();

    // Log Activity
    await ActivityLog.create({
      employeeId,
      name: req.user.name,
      role: req.user.role,
      action: 'Check Out',
      details: `${req.user.name} checked out at ${checkOut}.`,
    });

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get current employee attendance history
// @route   GET /api/attendance/my-history
// @access  Private
exports.getMyHistory = async (req, res) => {
  try {
    const history = await Attendance.find({ employeeId: req.user.employeeId }).sort({ date: -1 });
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get daily attendance (HR & Admin only)
// @route   GET /api/attendance/daily
// @access  Private (HR/Admin)
exports.getDailyAttendance = async (req, res) => {
  const { date } = req.query;
  const queryDate = date || getLocalDateString();

  try {
    const attendanceRecords = await Attendance.find({ date: queryDate });
    res.status(200).json({ success: true, data: attendanceRecords });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create/Override Attendance (HR & Admin only)
// @route   POST /api/attendance/override
// @access  Private (HR/Admin)
exports.overrideAttendance = async (req, res) => {
  const { employeeId, date, checkIn, checkOut, status } = req.body;

  try {
    // Check if employee exists
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    let record = await Attendance.findOne({ employeeId, date });

    if (record) {
      record.checkIn = checkIn || record.checkIn;
      record.checkOut = checkOut !== undefined ? checkOut : record.checkOut;
      record.status = status || record.status;
      await record.save();
    } else {
      record = await Attendance.create({
        employeeId,
        date,
        checkIn: checkIn || '09:00',
        checkOut: checkOut || '18:00',
        status: status || 'Present',
      });
    }

    // Log Activity
    await ActivityLog.create({
      employeeId: req.user.employeeId,
      name: req.user.name,
      role: req.user.role,
      action: 'Override Attendance',
      details: `HR/Admin modified attendance for ${employeeId} on ${date}.`,
    });

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get attendance status & stats for current user
// @route   GET /api/attendance/my-stats
// @access  Private
exports.getMyStats = async (req, res) => {
  const employeeId = req.user.employeeId;

  try {
    const records = await Attendance.find({ employeeId });
    const totalWorkingDays = records.length;
    const presentCount = records.filter(r => r.status === 'Present' || r.status === 'Late').length;
    const lateCount = records.filter(r => r.status === 'Late').length;
    
    // Assume 22 standard working days per month or track by percentage
    const attendancePercentage = totalWorkingDays > 0 
      ? Math.round((presentCount / totalWorkingDays) * 100) 
      : 100;

    res.status(200).json({
      success: true,
      stats: {
        totalWorkingDays,
        presentDays: presentCount,
        lateDays: lateCount,
        attendancePercentage,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

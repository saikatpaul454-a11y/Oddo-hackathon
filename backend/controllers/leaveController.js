const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const ActivityLog = require('../models/ActivityLog');
const sendEmail = require('../utils/email');

// Helper to calculate days between two dates
const getDaysBetween = (fromStr, toStr) => {
  const from = new Date(fromStr);
  const to = new Date(toStr);
  const diffTime = Math.abs(to - from);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
  return isNaN(diffDays) ? 0 : diffDays;
};

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private
exports.applyLeave = async (req, res) => {
  const { leaveType, fromDate, toDate, reason } = req.body;
  const employeeId = req.user.employeeId;

  try {
    if (!leaveType || !fromDate || !toDate || !reason) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const leave = await Leave.create({
      employeeId,
      leaveType,
      fromDate,
      toDate,
      reason,
      status: 'Pending',
    });

    // Log Activity
    await ActivityLog.create({
      employeeId,
      name: req.user.name,
      role: req.user.role,
      action: 'Apply Leave',
      details: `${req.user.name} applied for ${leaveType} from ${fromDate} to ${toDate}.`,
    });

    res.status(201).json({ success: true, data: leave });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get current employee leave applications
// @route   GET /api/leaves/my-leaves
// @access  Private
exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employeeId: req.user.employeeId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get leave statistics/balances for current employee
// @route   GET /api/leaves/my-stats
// @access  Private
exports.getMyStats = async (req, res) => {
  const employeeId = req.user.employeeId;

  // Let's define standard annual allocations
  const ALLOCATIONS = {
    'Sick Leave': 10,
    'Casual Leave': 8,
    'Annual Leave': 15,
  };

  try {
    const approvedLeaves = await Leave.find({ employeeId, status: 'Approved' });
    
    // Count days taken per type
    const taken = {
      'Sick Leave': 0,
      'Casual Leave': 0,
      'Annual Leave': 0,
    };

    approvedLeaves.forEach((leave) => {
      const days = getDaysBetween(leave.fromDate, leave.toDate);
      if (taken[leave.leaveType] !== undefined) {
        taken[leave.leaveType] += days;
      } else {
        taken[leave.leaveType] = days;
      }
    });

    const stats = Object.keys(ALLOCATIONS).map((type) => {
      const allowed = ALLOCATIONS[type];
      const used = taken[type] || 0;
      return {
        type,
        allowed,
        used,
        balance: Math.max(0, allowed - used),
      };
    });

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all leave applications (HR & Admin only)
// @route   GET /api/leaves
// @access  Private (HR/Admin)
exports.getAllLeaves = async (req, res) => {
  try {
    // Populate or retrieve with employee name
    const leaves = await Leave.find({}).sort({ createdAt: -1 });
    
    // Enrich with employee names manually (or we could use schema reference, but this keeps the schemas completely isolated as requested)
    const enrichedLeaves = await Promise.all(
      leaves.map(async (leave) => {
        const emp = await Employee.findOne({ employeeId: leave.employeeId }).select('name department designation');
        return {
          ...leave.toObject(),
          employeeName: emp ? emp.name : 'Unknown',
          department: emp ? emp.department : 'N/A',
          designation: emp ? emp.designation : 'N/A',
        };
      })
    );

    res.status(200).json({ success: true, data: enrichedLeaves });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Approve/Reject Leave (HR & Admin only)
// @route   PUT /api/leaves/:id
// @access  Private (HR/Admin)
exports.approveRejectLeave = async (req, res) => {
  const { status } = req.body; // Approved or Rejected

  try {
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update.' });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    leave.status = status;
    await leave.save();

    // Log action
    await ActivityLog.create({
      employeeId: req.user.employeeId,
      name: req.user.name,
      role: req.user.role,
      action: `${status} Leave`,
      details: `${status} leave application for ${leave.employeeId} (${leave.leaveType}).`,
    });

    // Send email to applicant
    const employee = await Employee.findOne({ employeeId: leave.employeeId });
    if (employee) {
      await sendEmail({
        email: employee.email,
        subject: `Leave Application Status: ${status}`,
        text: `Hello ${employee.name},\n\nYour leave application for ${leave.leaveType} from ${leave.fromDate} to ${leave.toDate} has been ${status}.\n\nBest Regards,\nManagement`,
        html: `
          <h3>Leave Application Status Update</h3>
          <p>Hello <strong>${employee.name}</strong>,</p>
          <p>Your leave request has been processed.</p>
          <ul>
            <li><strong>Leave Type:</strong> ${leave.leaveType}</li>
            <li><strong>Duration:</strong> ${leave.fromDate} to ${leave.toDate}</li>
            <li><strong>Status:</strong> <span style="color: ${status === 'Approved' ? 'green' : 'red'}; font-weight: bold;">${status}</span></li>
          </ul>
          <p>Thank you,</p>
          <p>Management Team</p>
        `,
      });
    }

    res.status(200).json({ success: true, data: leave });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

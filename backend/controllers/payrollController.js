const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const ActivityLog = require('../models/ActivityLog');
const { generateSalarySlipPDF } = require('../utils/pdfGenerator');
const sendEmail = require('../utils/email');

// Helper to count absent days for an employee in a given month/year
const countAbsentDays = async (employeeId, monthName, year) => {
  // Map month name to number (e.g. "January" -> "01")
  const months = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
  };
  const monthNum = months[monthName.toLowerCase()] || '01';
  const prefix = `${year}-${monthNum}`;

  // Find all attendance records of the employee for this month
  const records = await Attendance.find({
    employeeId,
    date: { $regex: new RegExp(`^${prefix}`) }
  });

  const absentDays = records.filter(r => r.status === 'Absent').length;
  return absentDays;
};

// Helper to calculate full salary breakdown
const calculateSalaryBreakdown = async (employee, month, year) => {
  const baseSalary = employee.salary || 30000;
  const basicSalary = Math.round(baseSalary * 0.5); // 50% basic
  const hra = Math.round(basicSalary * 0.4); // 40% of basic
  const medicalAllowance = 1250; // flat allowance
  
  const providentFund = Math.round(basicSalary * 0.12); // 12% of basic
  const professionalTax = 200; // standard flat tax

  // Leave deductions based on absence
  const absentDays = await countAbsentDays(employee.employeeId, month, year);
  const dailyRate = Math.round(baseSalary / 22); // Assume average 22 working days
  const leaveDeductions = absentDays * dailyRate;

  const grossEarnings = basicSalary + hra + medicalAllowance;
  const totalDeductions = providentFund + professionalTax + leaveDeductions;
  const netSalary = Math.max(0, grossEarnings - totalDeductions);

  return {
    basicSalary,
    hra,
    medicalAllowance,
    providentFund,
    professionalTax,
    leaveDeductions,
    grossEarnings,
    totalDeductions,
    netSalary,
    absentDays
  };
};

// @desc    Get or download salary slip PDF
// @route   GET /api/payroll/slip
// @access  Private
exports.getSalarySlip = async (req, res) => {
  const { month, year } = req.query;
  let employeeId = req.query.employeeId;

  // Security check: Employees can only view their own slip
  if (req.user.role === 'employee') {
    employeeId = req.user.employeeId;
  }

  try {
    if (!employeeId || !month || !year) {
      return res.status(400).json({ success: false, message: 'Please provide employeeId, month, and year.' });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    const salaryDetails = await calculateSalaryBreakdown(employee, month, year);
    const pdfBuffer = await generateSalarySlipPDF(employee, salaryDetails, month, year);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=payslip-${employeeId}-${month}-${year}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Generate and email salary slip (HR & Admin only)
// @route   POST /api/payroll/send-slip
// @access  Private (HR/Admin)
exports.sendSalarySlipEmail = async (req, res) => {
  const { employeeId, month, year } = req.body;

  try {
    if (!employeeId || !month || !year) {
      return res.status(400).json({ success: false, message: 'Please provide employeeId, month, and year.' });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    const salaryDetails = await calculateSalaryBreakdown(employee, month, year);
    const pdfBuffer = await generateSalarySlipPDF(employee, salaryDetails, month, year);

    // Send email with PDF attachment
    await sendEmail({
      email: employee.email,
      subject: `Salary Slip for ${month} ${year}`,
      text: `Hello ${employee.name},\n\nPlease find attached your salary slip for the month of ${month} ${year}.\n\nNet Salary Credited: INR ${salaryDetails.netSalary.toFixed(2)}\n\nBest Regards,\nFinance Team`,
      html: `
        <h3>Salary Slip Generated</h3>
        <p>Hello <strong>${employee.name}</strong>,</p>
        <p>Your salary slip for <strong>${month} ${year}</strong> has been generated and the net pay has been credited to your bank account.</p>
        <p><strong>Net Payable Salary:</strong> INR ${salaryDetails.netSalary.toFixed(2)}</p>
        <p>Please find the detailed PDF breakdown attached to this email.</p>
        <p>Best Regards,<br/>Finance Team</p>
      `,
    });

    // Log action
    await ActivityLog.create({
      employeeId: req.user.employeeId,
      name: req.user.name,
      role: req.user.role,
      action: 'Send Salary Slip',
      details: `Generated and emailed salary slip for ${employee.name} (${employeeId}) for ${month} ${year}.`,
    });

    res.status(200).json({ success: true, message: 'Salary slip generated and sent successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get dashboard metrics (Admin/HR/Employee)
// @route   GET /api/payroll/metrics
// @access  Private
exports.getDashboardMetrics = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments({ status: 'Active' });
    const employees = await Employee.find({ status: 'Active' });
    
    // Department count
    const departments = [...new Set(employees.map(emp => emp.department))];
    const totalDepartments = departments.length;

    // Leave requests pending
    const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });

    // Activity Log count
    const activityLogs = await ActivityLog.find().sort({ createdAt: -1 }).limit(10);

    // Dynamic Chart Data: Department statistics
    const deptStats = {};
    employees.forEach(emp => {
      deptStats[emp.department] = (deptStats[emp.department] || 0) + 1;
    });

    // Monthly attendance metrics (For Admin Monthly Attendance Graph)
    // We will aggregate attendance status counts for the last 30 days
    const recentAttendance = await Attendance.find({
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
    });

    const attendanceSummary = {
      Present: recentAttendance.filter(r => r.status === 'Present').length,
      Late: recentAttendance.filter(r => r.status === 'Late').length,
      Absent: recentAttendance.filter(r => r.status === 'Absent').length,
      'Half-Day': recentAttendance.filter(r => r.status === 'Half-Day').length,
    };

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        totalDepartments,
        pendingLeaves,
        deptStats,
        attendanceSummary,
        recentLogs: activityLogs,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

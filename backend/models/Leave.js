const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
    },
    leaveType: {
      type: String,
      enum: ['Sick Leave', 'Casual Leave', 'Annual Leave', 'Maternity Leave', 'Paternity Leave'],
      required: true,
    },
    fromDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    toDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Leave', LeaveSchema);

const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
    },
    date: {
      type: String, // format YYYY-MM-DD for easy querying per day
      required: true,
    },
    checkIn: {
      type: String, // format HH:MM
      required: true,
    },
    checkOut: {
      type: String, // format HH:MM
      default: null,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Half-Day'],
      default: 'Present',
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate attendance records for an employee on the same date
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);

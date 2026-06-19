require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');
const ActivityLog = require('./models/ActivityLog');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    // Clear existing data (optional, but good for resetting state)
    await Employee.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});
    await ActivityLog.deleteMany({});
    console.log('Cleared existing collections.');

    // 1. Create Employees
    const adminUser = await Employee.create({
      employeeId: 'EMP000',
      name: 'System Admin',
      email: 'admin@ems.com',
      password: 'password123',
      department: 'Management',
      designation: 'Administrator',
      salary: 95000,
      role: 'admin',
      isFaceRegistered: false,
    });

    const hrUser = await Employee.create({
      employeeId: 'EMP001',
      name: 'Emma Watson',
      email: 'hr@ems.com',
      password: 'password123',
      department: 'Human Resources',
      designation: 'HR Manager',
      salary: 60000,
      role: 'hr',
      isFaceRegistered: false,
    });

    const employeeUser = await Employee.create({
      employeeId: 'EMP002',
      name: 'Rahul Das',
      email: 'employee@ems.com',
      password: 'password123',
      department: 'IT',
      designation: 'Software Developer',
      salary: 35000,
      role: 'employee',
      joiningDate: new Date('2026-01-10'),
      isFaceRegistered: true, // Face registered for testing Face-in
    });

    console.log('Created Seed Users.');

    // 2. Create Sample Attendance for Rahul Das (EMP002) for May & June 2026
    const sampleAttendance = [
      { employeeId: 'EMP002', date: '2026-05-25', checkIn: '09:00', checkOut: '18:00', status: 'Present' },
      { employeeId: 'EMP002', date: '2026-05-26', checkIn: '09:05', checkOut: '18:00', status: 'Present' },
      { employeeId: 'EMP002', date: '2026-05-27', checkIn: '09:30', checkOut: '18:00', status: 'Late' },
      { employeeId: 'EMP002', date: '2026-05-28', checkIn: '09:00', checkOut: '18:00', status: 'Present' },
      { employeeId: 'EMP002', date: '2026-05-29', checkIn: '--:--', checkOut: '--:--', status: 'Absent' },
      { employeeId: 'EMP002', date: '2026-06-01', checkIn: '09:00', checkOut: '18:00', status: 'Present' },
      { employeeId: 'EMP002', date: '2026-06-02', checkIn: '09:12', checkOut: '17:30', status: 'Present' },
      { employeeId: 'EMP002', date: '2026-06-03', checkIn: '09:45', checkOut: '18:00', status: 'Late' },
      { employeeId: 'EMP002', date: '2026-06-04', checkIn: '08:55', checkOut: '18:00', status: 'Present' },
      { employeeId: 'EMP002', date: '2026-06-05', checkIn: '09:00', checkOut: null, status: 'Present' }, // Checked in but not checked out yet
    ];

    await Attendance.insertMany(sampleAttendance);
    console.log('Created Sample Attendance Records.');

    // 3. Create Sample Leave Requests
    const sampleLeaves = [
      {
        employeeId: 'EMP002',
        leaveType: 'Sick Leave',
        fromDate: '2026-06-10',
        toDate: '2026-06-12',
        reason: 'Down with flu and fever.',
        status: 'Pending',
      },
      {
        employeeId: 'EMP002',
        leaveType: 'Casual Leave',
        fromDate: '2026-05-12',
        toDate: '2026-05-13',
        reason: 'Personal family matter.',
        status: 'Approved',
      },
      {
        employeeId: 'EMP001',
        leaveType: 'Annual Leave',
        fromDate: '2026-07-01',
        toDate: '2026-07-05',
        reason: 'Summer vacation.',
        status: 'Pending',
      },
    ];

    await Leave.insertMany(sampleLeaves);
    console.log('Created Sample Leaves.');

    // 4. Create initial logs
    await ActivityLog.create({
      employeeId: 'EMP000',
      name: 'System Admin',
      role: 'admin',
      action: 'Seed Database',
      details: 'System database seeded with mock users, attendance, and leave records.',
    });

    console.log('Database Seeding Completed Successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedData();

const Employee = require('../models/Employee');
const ActivityLog = require('../models/ActivityLog');
const sendEmail = require('../utils/email');

// Helper to generate a unique employee ID
const generateUniqueEmployeeId = async () => {
  let employeeId = '';
  let exists = true;
  let counter = await Employee.countDocuments();

  while (exists) {
    counter++;
    employeeId = `EMP${String(counter).padStart(3, '0')}`;
    const check = await Employee.findOne({ employeeId });
    if (!check) {
      exists = false;
    }
  }
  return employeeId;
};

// @desc    Get current employee profile
// @route   GET /api/employees/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({ employeeId: req.user.employeeId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update personal information
// @route   PUT /api/employees/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  const { name, email } = req.body;

  try {
    const employee = await Employee.findOne({ employeeId: req.user.employeeId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (name) employee.name = name;
    if (email) employee.email = email;

    await employee.save();

    // Log action
    await ActivityLog.create({
      employeeId: employee.employeeId,
      name: employee.name,
      role: employee.role,
      action: 'Update Profile',
      details: `${employee.name} updated their personal profile details.`,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
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

// @desc    Register employee face
// @route   POST /api/employees/register-face
// @access  Private
exports.registerFace = async (req, res) => {
  try {
    const employee = await Employee.findOne({ employeeId: req.user.employeeId });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    employee.isFaceRegistered = true;
    if (req.body.descriptor) {
      employee.faceDescriptor = req.body.descriptor;
    }
    await employee.save();

    await ActivityLog.create({
      employeeId: employee.employeeId,
      name: employee.name,
      role: employee.role,
      action: 'Register Face',
      details: `${employee.name} registered their face verification template.`,
    });

    res.status(200).json({ success: true, message: 'Face template registered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all employees (HR & Admin only)
// @route   GET /api/employees
// @access  Private (HR/Admin)
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({});
    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Add a new employee (HR & Admin only)
// @route   POST /api/employees
// @access  Private (HR/Admin)
exports.addEmployee = async (req, res) => {
  const { name, email, department, designation, salary, role, password } = req.body;

  try {
    const existingUser = await Employee.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Employee with this email already exists' });
    }

    // Generate dynamic unique employee ID
    const employeeId = await generateUniqueEmployeeId();

    // Use provided password or auto-generate one
    const defaultPassword = password || 'password123';

    const employee = await Employee.create({
      employeeId,
      name,
      email,
      password: defaultPassword,
      department,
      designation,
      salary,
      role: role || 'employee',
      joiningDate: new Date(),
    });

    // Log action
    await ActivityLog.create({
      employeeId: req.user.employeeId,
      name: req.user.name,
      role: req.user.role,
      action: 'Add Employee',
      details: `Added new employee ${name} (${employeeId}).`,
    });

    // Send onboarding email notification
    await sendEmail({
      email: employee.email,
      subject: 'Welcome to the Team! Your Employee Account Credentials',
      text: `Hello ${name},\n\nYour employee account has been created successfully.\n\nEmployee ID: ${employeeId}\nEmail: ${email}\nTemporary Password: ${defaultPassword}\n\nPlease log in and update your password.\n\nBest Regards,\nHR Team`,
      html: `
        <h3>Welcome ${name}!</h3>
        <p>Your employee account has been created.</p>
        <ul>
          <li><strong>Employee ID:</strong> ${employeeId}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Temporary Password:</strong> ${defaultPassword}</li>
        </ul>
        <p>Please log in and update your details immediately.</p>
      `,
    });

    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update employee details (HR & Admin only)
// @route   PUT /api/employees/:id
// @access  Private (HR/Admin)
exports.updateEmployee = async (req, res) => {
  const { name, email, department, designation, salary, role, status } = req.body;

  try {
    const employee = await Employee.findOne({ employeeId: req.params.id });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Block changes to roles or critical details if not admin (HR can only manage employees, Admin manages both Employees and HR)
    if (req.user.role === 'hr' && (role === 'admin' || employee.role === 'admin')) {
      return res.status(403).json({ success: false, message: 'HR is not authorized to edit Admin accounts' });
    }

    if (name) employee.name = name;
    if (email) employee.email = email;
    if (department) employee.department = department;
    if (designation) employee.designation = designation;
    if (salary) employee.salary = salary;
    if (role) employee.role = role;
    if (status) employee.status = status;

    await employee.save();

    // Log action
    await ActivityLog.create({
      employeeId: req.user.employeeId,
      name: req.user.name,
      role: req.user.role,
      action: 'Update Employee Details',
      details: `Updated details for employee ${employee.name} (${employee.employeeId}).`,
    });

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

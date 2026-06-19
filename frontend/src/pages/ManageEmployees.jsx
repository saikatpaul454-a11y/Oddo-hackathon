import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Users, UserPlus, FileEdit, Save, X, RefreshCw } from 'lucide-react';

const ManageEmployees = () => {
  const { user } = useAuth();
  
  // States
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('IT');
  const [designation, setDesignation] = useState('Developer');
  const [salary, setSalary] = useState(30000);
  const [role, setRole] = useState('employee');
  const [status, setStatus] = useState('Active');
  const [password, setPassword] = useState(''); // Only for creation

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/employees');
      if (res.data.success) {
        setEmployees(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openAddModal = () => {
    setIsEditMode(false);
    setName('');
    setEmail('');
    setDepartment('IT');
    setDesignation('Developer');
    setSalary(30000);
    setRole('employee');
    setStatus('Active');
    setPassword('');
    setMessage('');
    setShowModal(true);
  };

  const openEditModal = (emp) => {
    setIsEditMode(true);
    setSelectedEmpId(emp.employeeId);
    setName(emp.name);
    setEmail(emp.email);
    setDepartment(emp.department);
    setDesignation(emp.designation);
    setSalary(emp.salary);
    setRole(emp.role);
    setStatus(emp.status);
    setMessage('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      if (isEditMode) {
        const res = await api.put(`/api/employees/${selectedEmpId}`, {
          name,
          email,
          department,
          designation,
          salary,
          role,
          status,
        });

        if (res.data.success) {
          setMessageType('success');
          setMessage('Employee updated successfully!');
          fetchEmployees();
          setTimeout(() => setShowModal(false), 1500);
        }
      } else {
        const res = await api.post('/api/employees', {
          name,
          email,
          department,
          designation,
          salary,
          role,
          password: password || undefined,
        });

        if (res.data.success) {
          setMessageType('success');
          setMessage('New employee registered and onboarding email sent!');
          fetchEmployees();
          setTimeout(() => setShowModal(false), 1500);
        }
      }
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Transaction failed. Please review values.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Employee Directory
          </h1>
          <p className="text-sm text-slate-500">
            Create, update, and manage all employee portal accounts.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 transition"
          >
            <UserPlus className="h-4 w-4" />
            Add Employee
          </button>
          <button
            onClick={fetchEmployees}
            className="rounded-xl border border-slate-200 bg-white p-2.5 hover:bg-slate-50 transition"
          >
            <RefreshCw className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Directory Table Grid */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6">
          System Users
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Base Salary</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-xs text-slate-400 py-8">
                    No employees registered in directory.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-4.5 font-medium text-slate-800">
                      {emp.name}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {emp.employeeId} | {emp.email}
                      </span>
                    </td>
                    <td className="px-4 py-4.5 text-xs text-slate-500">{emp.department}</td>
                    <td className="px-4 py-4.5 text-xs font-semibold text-slate-700">{emp.designation}</td>
                    <td className="px-4 py-4.5 text-xs">INR {emp.salary?.toLocaleString()}</td>
                    <td className="px-4 py-4.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold border capitalize ${
                        emp.role === 'admin'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : emp.role === 'hr'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-4 py-4.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                        emp.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-4.5 text-right">
                      {/* HR cannot edit Admin details */}
                      {user?.role === 'hr' && emp.role === 'admin' ? (
                        <span className="text-[10px] text-slate-400 font-medium italic">Restricted</span>
                      ) : (
                        <button
                          onClick={() => openEditModal(emp)}
                          className="rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 p-1.5 transition"
                          title="Edit Details"
                        >
                          <FileEdit className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">
                {isEditMode ? 'Modify Employee Profile' : 'Register New Employee'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {message && (
              <div className={`mb-4 rounded-xl border p-4 text-xs font-semibold ${
                messageType === 'success'
                  ? 'border-emerald-500/10 bg-emerald-500/5 text-emerald-600'
                  : 'border-red-500/10 bg-red-500/5 text-red-600'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 outline-none transition focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 outline-none transition focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 outline-none transition focus:border-indigo-500"
                  >
                    <option value="IT">IT</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Management">Management</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Designation</label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 outline-none transition focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Base Salary (INR)</label>
                  <input
                    type="number"
                    required
                    value={salary}
                    onChange={(e) => setSalary(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 outline-none transition focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Access Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 outline-none transition focus:border-indigo-500"
                  >
                    <option value="employee">Employee</option>
                    <option value="hr">HR Manager</option>
                    {user?.role === 'admin' && <option value="admin">Administrator</option>}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {isEditMode ? (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 outline-none transition focus:border-indigo-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-semibold text-slate-500">Temporary Password</label>
                    <input
                      type="password"
                      placeholder="Leave blank for 'password123'"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 outline-none transition focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/15 transition"
                >
                  <Save className="h-3.5 w-3.5" />
                  {isEditMode ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEmployees;

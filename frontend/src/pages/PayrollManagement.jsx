import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { CreditCard, Download, Send, RefreshCw, MailCheck } from 'lucide-react';

const PayrollManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selected pay cycle month & year
  const [payMonth, setPayMonth] = useState('June');
  const [payYear, setPayYear] = useState('2026');

  // Async load indicators
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [actionType, setActionType] = useState(''); // 'download' or 'email'
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/employees');
      if (res.data.success) {
        // Only active employee accounts
        setEmployees(res.data.data.filter(emp => emp.status === 'Active'));
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

  // Download slip
  const handleDownloadSlip = async (empId) => {
    setActionLoadingId(empId);
    setActionType('download');
    setFeedbackMessage('');
    try {
      const response = await api.get('/api/payroll/slip', {
        params: { employeeId: empId, month: payMonth, year: payYear },
        responseType: 'blob',
      });
      
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `Payslip_${empId}_${payMonth}_${payYear}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(fileURL);
    } catch (err) {
      console.error(err);
      alert('Error: Unable to compile salary slip PDF.');
    } finally {
      setActionLoadingId('');
      setActionType('');
    }
  };

  // Email slip
  const handleEmailSlip = async (empId) => {
    setActionLoadingId(empId);
    setActionType('email');
    setFeedbackMessage('');
    try {
      const res = await api.post('/api/payroll/send-slip', {
        employeeId: empId,
        month: payMonth,
        year: payYear,
      });

      if (res.data.success) {
        setFeedbackMessage(`Salary slip emailed to employee ${empId} successfully!`);
        setTimeout(() => setFeedbackMessage(''), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Email trigger failed.');
    } finally {
      setActionLoadingId('');
      setActionType('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Payroll Ledger
          </h1>
          <p className="text-sm text-slate-500">
            Generate, compile, and email monthly salary records to employees.
          </p>
        </div>
        <button
          onClick={fetchEmployees}
          className="rounded-xl border border-slate-200 bg-white p-2.5 hover:bg-slate-50 transition"
        >
          <RefreshCw className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      {/* Select Pay Cycle box */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Pay Cycle</span>
          <p className="text-sm font-semibold text-slate-700">Select Month & Year to process slips</p>
        </div>

        <div className="flex gap-3">
          <select
            value={payMonth}
            onChange={(e) => setPayMonth(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white py-2 px-4 text-xs font-semibold text-slate-700 outline-none transition focus:border-indigo-500"
          >
            {months.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={payYear}
            onChange={(e) => setPayYear(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white py-2 px-4 text-xs font-semibold text-slate-700 outline-none transition focus:border-indigo-500"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {feedbackMessage && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-xs font-semibold text-emerald-700">
          {feedbackMessage}
        </div>
      )}

      {/* Employees salary directory */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6">
          Salary Disbursal Grid
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Access Level</th>
                <th className="px-4 py-3">Base Salary</th>
                <th className="px-4 py-3 text-right">Payroll Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-xs text-slate-400 py-8">
                    No active employees found in directories.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-4 font-semibold text-slate-800">
                      {emp.name}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {emp.employeeId} | {emp.email}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">{emp.department}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-600 capitalize">
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-700">
                      INR {emp.salary?.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleDownloadSlip(emp.employeeId)}
                          disabled={actionLoadingId === emp.employeeId}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {actionLoadingId === emp.employeeId && actionType === 'download' ? '...' : 'PDF'}
                        </button>
                        <button
                          onClick={() => handleEmailSlip(emp.employeeId)}
                          disabled={actionLoadingId === emp.employeeId}
                          className="flex items-center gap-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
                        >
                          <Send className="h-3.5 w-3.5" />
                          {actionLoadingId === emp.employeeId && actionType === 'email' ? '...' : 'Email Slip'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayrollManagement;

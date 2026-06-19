import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FileClock, Plus, CalendarRange, Send, Check, X, RefreshCw } from 'lucide-react';

const LeaveManagement = () => {
  const { user } = useAuth();
  const isHRorAdmin = ['hr', 'admin'].includes(user?.role);

  // States
  const [leaves, setLeaves] = useState([]);
  const [leaveStats, setLeaveStats] = useState([]);
  const [type, setType] = useState('Sick Leave');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (isHRorAdmin) {
        // HR/Admin gets all leaves
        const res = await api.get('/api/leaves');
        if (res.data.success) {
          setLeaves(res.data.data);
        }
      } else {
        // Employee gets their own leaves and balances
        const leavesRes = await api.get('/api/leaves/my-leaves');
        if (leavesRes.data.success) {
          setLeaves(leavesRes.data.data);
        }
        const statsRes = await api.get('/api/leaves/my-stats');
        if (statsRes.data.success) {
          setLeaveStats(statsRes.data.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await api.post('/api/leaves', {
        leaveType: type,
        fromDate,
        toDate,
        reason,
      });

      if (res.data.success) {
        setMessageType('success');
        setMessage('Leave request submitted successfully!');
        setFromDate('');
        setToDate('');
        setReason('');
        fetchData();
      }
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Failed to submit leave request.');
    }
  };

  const handleDecision = async (id, status) => {
    try {
      const res = await api.put(`/api/leaves/${id}`, { status });
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Error updating leave status:', err);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Leave Administration
          </h1>
          <p className="text-sm text-slate-500">
            {isHRorAdmin
              ? 'Process employee leave applications, view reasons, and update statuses.'
              : 'Submit new leave applications and track your available balances.'}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50 transition"
        >
          <RefreshCw className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      {isHRorAdmin ? (
        // HR/Admin Portal view (Complete Leave Directory Listing)
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">
            Leave Application Backlog
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Leave Type</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-xs text-slate-400 py-8">
                      No leave applications found.
                    </td>
                  </tr>
                ) : (
                  leaves.map((leave) => (
                    <tr key={leave._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-4.5 font-medium text-slate-805">
                        {leave.employeeName}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {leave.employeeId} - {leave.department}
                        </span>
                      </td>
                      <td className="px-4 py-4.5 text-xs font-semibold">{leave.leaveType}</td>
                      <td className="px-4 py-4.5 text-xs text-slate-400">
                        {leave.fromDate} to {leave.toDate}
                      </td>
                      <td className="px-4 py-4.5 text-xs max-w-xs truncate" title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td className="px-4 py-4.5">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getStatusStyle(leave.status)}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-4 py-4.5 text-right">
                        {leave.status === 'Pending' ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleDecision(leave._id, 'Approved')}
                              className="rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 p-1.5 transition"
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDecision(leave._id, 'Rejected')}
                              className="rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 p-1.5 transition"
                              title="Reject"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium italic">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Employee Portal view (Stats + Apply Form + History)
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Apply Form & Balances */}
          <div className="space-y-6 lg:col-span-1">
            {/* Leave Balance Stats */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800">
                Leave Balances
              </h3>
              <div className="space-y-3">
                {leaveStats.map((stat) => (
                  <div key={stat.type} className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{stat.type}</p>
                      <p className="text-[10px] text-slate-400">Used: {stat.used} / {stat.allowed} Days</p>
                    </div>
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                      {stat.balance} left
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Application Form */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                <Plus className="h-5 w-5 text-indigo-500" />
                Apply for Leave
              </h3>

              {message && (
                <div className={`mb-4 rounded-xl border p-4 text-xs font-medium ${
                  messageType === 'success'
                    ? 'border-emerald-500/10 bg-emerald-500/5 text-emerald-600'
                    : 'border-red-500/10 bg-red-500/5 text-red-600'
                }`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Leave Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Annual Leave">Annual Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">From Date</label>
                    <input
                      type="date"
                      required
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">To Date</label>
                    <input
                      type="date"
                      required
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Reason</label>
                  <textarea
                    required
                    rows="3"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe the reason for leave request..."
                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 transition"
                >
                  <Send className="h-4 w-4" />
                  Submit Request
                </button>
              </form>
            </div>
          </div>

          {/* History list */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-6">
              Application History
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Leave Type</th>
                    <th className="px-4 py-3">Dates</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center text-xs text-slate-400 py-8">
                        No previous leave applications found.
                      </td>
                    </tr>
                  ) : (
                    leaves.map((leave) => (
                      <tr key={leave._id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-4 font-semibold text-slate-800">{leave.leaveType}</td>
                        <td className="px-4 py-4 text-xs text-slate-400">
                          {leave.fromDate} to {leave.toDate}
                        </td>
                        <td className="px-4 py-4 text-xs max-w-xs truncate" title={leave.reason}>
                          {leave.reason}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getStatusStyle(leave.status)}`}>
                            {leave.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import {
  Users,
  FileClock,
  Briefcase,
  CalendarDays,
  QrCode,
  Check,
  X,
  RefreshCw
} from 'lucide-react';

const HRDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    totalDepartments: 0,
    pendingLeaves: 0,
    attendanceSummary: { Present: 0, Late: 0, Absent: 0, 'Half-Day': 0 },
    recentLogs: []
  });
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState([]);
  const [dailyAttendance, setDailyAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // QR code states
  const [showQR, setShowQR] = useState(false);
  const [qrToken, setQrToken] = useState('');

  const fetchHRData = async () => {
    try {
      setLoading(true);
      // Fetch general dashboard metrics
      const metricsRes = await api.get('/api/payroll/metrics');
      if (metricsRes.data.success) {
        setMetrics(metricsRes.data.data);
      }

      // Fetch pending leaves
      const leavesRes = await api.get('/api/leaves');
      if (leavesRes.data.success) {
        const pending = leavesRes.data.data.filter((l) => l.status === 'Pending');
        setPendingLeaveRequests(pending);
      }

      // Fetch daily attendance records
      const todayStr = new Date().toISOString().split('T')[0];
      const dailyRes = await api.get(`/api/attendance/daily?date=${todayStr}`);
      if (dailyRes.data.success) {
        setDailyAttendance(dailyRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching HR Dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, []);

  // Generate dynamic QR Code token for the day
  const generateTodayQR = () => {
    // Standard format ems-attendance-token-YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];
    const token = `ems-attendance-token-${todayStr}`;
    setQrToken(token);
    setShowQR(true);
  };

  // Process quick leave approval/rejection
  const handleLeaveDecision = async (id, decision) => {
    try {
      const res = await api.put(`/api/leaves/${id}`, { status: decision });
      if (res.data.success) {
        // Refresh requests and metrics
        fetchHRData();
      }
    } catch (err) {
      console.error('Error updating leave status:', err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-100 text-emerald-800';
      case 'Late':
        return 'bg-amber-100 text-amber-800';
      case 'Absent':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Title block */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          HR Dashboard
        </h1>
        <p className="text-sm text-slate-500">
          Oversee company employees, leave submissions, and verify attendance records.
        </p>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Active Employees"
          value={metrics.totalEmployees}
          icon={Users}
          colorClass="bg-indigo-50 text-indigo-600 border border-indigo-100"
        />
        <StatCard
          title="Pending Leave Applications"
          value={metrics.pendingLeaves}
          icon={FileClock}
          colorClass="bg-amber-50 text-amber-600 border border-amber-100"
        />
        <StatCard
          title="Total Active Departments"
          value={metrics.totalDepartments}
          icon={Briefcase}
          colorClass="bg-blue-50 text-blue-600 border border-blue-100"
        />
        <StatCard
          title="Today's Check-Ins (Present)"
          value={metrics.attendanceSummary.Present + metrics.attendanceSummary.Late}
          icon={CalendarDays}
          colorClass="bg-emerald-50 text-emerald-600 border border-emerald-100"
        />
      </div>

      {/* Main dashboard view layouts */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Pending Leaves requests */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Pending Leaves
              </h3>
              <p className="text-xs text-slate-500">
                Approve or reject employee leave requests
              </p>
            </div>
            <button
              onClick={fetchHRData}
              className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 transition"
            >
              <RefreshCw className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingLeaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-xs text-slate-400 py-8">
                      No pending leave applications.
                    </td>
                  </tr>
                ) : (
                  pendingLeaveRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-4.5 font-medium text-slate-800">
                        {request.employeeName}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {request.employeeId} - {request.department}
                        </span>
                      </td>
                      <td className="px-4 py-4.5 text-xs font-semibold">{request.leaveType}</td>
                      <td className="px-4 py-4.5 text-xs text-slate-400">
                        {request.fromDate} to {request.toDate}
                      </td>
                      <td className="px-4 py-4.5 text-xs truncate max-w-[150px]">{request.reason}</td>
                      <td className="px-4 py-4.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleLeaveDecision(request._id, 'Approved')}
                            className="rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 p-1.5 transition"
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleLeaveDecision(request._id, 'Rejected')}
                            className="rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 p-1.5 transition"
                            title="Reject"
                          >
                            <X className="h-4 w-4" />
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

        {/* QR Code Attendance Generator Panel */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-800 text-left mb-1">
              QR System
            </h3>
            <p className="text-xs text-slate-500 text-left mb-6">
              Generate dynamic QR code to display in the workspace
            </p>

            {showQR ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-inner">
                  {/* Dynamic QR API creation */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${qrToken}`}
                    alt="Attendance QR Code"
                    className="h-40 w-40"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                    Live Session Token
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Updated Daily: {qrToken}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-3 border border-dashed border-slate-200 rounded-xl mb-4">
                <QrCode className="h-12 w-12 stroke-1" />
                <p className="text-xs">No active attendance QR displayed</p>
              </div>
            )}
          </div>

          <button
            onClick={generateTodayQR}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 py-3.5 text-sm font-semibold text-white transition mt-4"
          >
            <QrCode className="h-4 w-4" />
            Generate Today's QR
          </button>
        </div>
      </div>

      {/* Daily Attendance Overview Grid */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-2">
          Today's Attendance Grid
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Daily active logs for checked in employees
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Employee ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Check-In</th>
                <th className="px-4 py-3">Check-Out</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailyAttendance.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-xs text-slate-400 py-6">
                    No check-ins marked yet today.
                  </td>
                </tr>
              ) : (
                dailyAttendance.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-4 font-medium text-slate-850">{record.employeeId}</td>
                    <td className="px-4 py-4 text-xs text-slate-400">{record.date}</td>
                    <td className="px-4 py-4 text-xs font-semibold text-slate-700">{record.checkIn}</td>
                    <td className="px-4 py-4 text-xs text-slate-500">{record.checkOut || '--:--'}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadge(record.status)}`}>
                        {record.status}
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
  );
};

export default HRDashboard;

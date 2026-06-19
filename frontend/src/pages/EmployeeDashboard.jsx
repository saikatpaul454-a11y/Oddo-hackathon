import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatCard from '../components/StatCard';
import FaceScanner from '../components/FaceScanner';
import QRScanner from '../components/QRScanner';
import {
  CalendarDays,
  FileText,
  Percent,
  CircleDollarSign,
  Play,
  LogOut as ClockOutIcon,
  Download,
  Camera,
  QrCode,
  CheckCircle,
  FileCheck
} from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  
  // States for stats
  const [stats, setStats] = useState({
    totalWorkingDays: 0,
    presentDays: 0,
    lateDays: 0,
    attendancePercentage: 100,
  });
  const [leaveBalance, setLeaveBalance] = useState(0);
  const [recentLeaves, setRecentLeaves] = useState([]);
  
  // Attendance clock-in state
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [checkInMode, setCheckInMode] = useState('Standard'); // Standard, QR, Face
  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Salary slip state
  const [slipMonth, setSlipMonth] = useState('June');
  const [slipYear, setSlipYear] = useState('2026');
  const [slipLoading, setSlipLoading] = useState(false);
  const [slipError, setSlipError] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchDashboardData = async () => {
    try {
      // Fetch attendance stats
      const statsRes = await api.get('/api/attendance/my-stats');
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      // Fetch leaves stats for remaining balance
      const leavesStatsRes = await api.get('/api/leaves/my-stats');
      if (leavesStatsRes.data.success) {
        const totalBal = leavesStatsRes.data.data.reduce((acc, curr) => acc + curr.balance, 0);
        setLeaveBalance(totalBal);
      }

      // Fetch recent leaves
      const leavesRes = await api.get('/api/leaves/my-leaves');
      if (leavesRes.data.success) {
        setRecentLeaves(leavesRes.data.data.slice(0, 5));
      }

      // Check today's check-in status
      const historyRes = await api.get('/api/attendance/my-history');
      if (historyRes.data.success) {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayRecord = historyRes.data.data.find((r) => r.date === todayStr);
        setTodayAttendance(todayRecord || null);
      }
    } catch (err) {
      console.error('Error fetching employee dashboard stats:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Standard Check-In handler
  const handleCheckIn = async (checkInType = 'Standard', extraData = {}) => {
    setAttendanceMessage('');
    try {
      const payload = {
        checkInType,
        ...extraData
      };
      
      const res = await api.post('/api/attendance/checkin', payload);
      if (res.data.success) {
        setTodayAttendance(res.data.data);
        setMessageType('success');
        setAttendanceMessage(`Check-in successful! Status marked: ${res.data.data.status}`);
        fetchDashboardData(); // Refresh metrics
      }
    } catch (err) {
      setMessageType('error');
      setAttendanceMessage(err.response?.data?.message || 'Check-in failed. Please try again.');
    }
  };

  // Check-Out handler
  const handleCheckOut = async () => {
    setAttendanceMessage('');
    try {
      const res = await api.post('/api/attendance/checkout');
      if (res.data.success) {
        setTodayAttendance(res.data.data);
        setMessageType('success');
        setAttendanceMessage('Checked out successfully!');
        fetchDashboardData(); // Refresh metrics
      }
    } catch (err) {
      setMessageType('error');
      setAttendanceMessage(err.response?.data?.message || 'Check-out failed. Please try again.');
    }
  };

  // Face Scan handler callback
  const handleFaceScanComplete = (verified) => {
    setShowFaceScanner(false);
    if (verified) {
      handleCheckIn('Face', { faceVerified: true });
    }
  };

  // QR Scan handler callback
  const handleQRScanComplete = (qrToken) => {
    setShowQRScanner(false);
    if (qrToken) {
      handleCheckIn('QR', { qrToken });
    }
  };

  // Trigger check-in flow based on mode
  const triggerCheckInFlow = () => {
    if (checkInMode === 'Face') {
      if (!user.isFaceRegistered) {
        setMessageType('error');
        setAttendanceMessage('Your face is not registered in the system. Go to Profile to register your face.');
        return;
      }
      setShowFaceScanner(true);
    } else if (checkInMode === 'QR') {
      setShowQRScanner(true);
    } else {
      handleCheckIn('Standard');
    }
  };

  // Download Salary Slip
  const downloadPayslip = async () => {
    setSlipLoading(true);
    setSlipError('');
    try {
      const response = await api.get('/api/payroll/slip', {
        params: { month: slipMonth, year: slipYear },
        responseType: 'blob',
      });
      
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `Payslip_${user.employeeId}_${slipMonth}_${slipYear}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(fileURL);
    } catch (err) {
      console.error(err);
      setSlipError('No record found or server failed to compile PDF.');
    } finally {
      setSlipLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="rounded-3xl bg-indigo-900 bg-gradient-to-r from-slate-900 to-indigo-950 p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Hello, {user?.name}!
            </h1>
            <p className="text-indigo-200 text-sm max-w-xl">
              Welcome back to your employee dashboard. You are logged into the <strong className="text-white">{user?.department}</strong> department as a <strong className="text-white">{user?.designation}</strong>.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-5 py-3 border border-white/5 backdrop-blur">
            <p className="text-xs text-indigo-300 uppercase tracking-widest">Joining Date</p>
            <p className="text-sm font-semibold">{new Date(user?.joiningDate || Date.now()).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Working Days"
          value={stats.totalWorkingDays}
          icon={CalendarDays}
          colorClass="bg-blue-50 text-blue-600 border border-blue-100"
        />
        <StatCard
          title="Leave Balance (Days)"
          value={leaveBalance}
          icon={FileCheck}
          colorClass="bg-amber-50 text-amber-600 border border-amber-100"
        />
        <StatCard
          title="Attendance Percentage"
          value={`${stats.attendancePercentage}%`}
          icon={Percent}
          colorClass="bg-emerald-50 text-emerald-600 border border-emerald-100"
        />
        <StatCard
          title="Basic Base Rate (INR)"
          value={`${user?.salary ? user.salary.toLocaleString() : '35,000'}`}
          icon={CircleDollarSign}
          colorClass="bg-purple-50 text-purple-600 border border-purple-100"
        />
      </div>

      {/* Main dashboard body grids */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Attendance Console */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Attendance Console
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Mark your check-in and check-out for today
            </p>

            {/* Check-In / Check-Out Actions */}
            {!todayAttendance ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Check-in Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { mode: 'Standard', icon: Play },
                      { mode: 'QR', icon: QrCode },
                      { mode: 'Face', icon: Camera },
                    ].map((m) => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.mode}
                          onClick={() => setCheckInMode(m.mode)}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition ${
                            checkInMode === m.mode
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {m.mode}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={triggerCheckInFlow}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/10 transition"
                >
                  <Play className="h-4 w-4" />
                  Clock In
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Active Shift</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Checked In at {todayAttendance.checkIn}</p>
                </div>

                {!todayAttendance.checkOut ? (
                  <button
                    onClick={handleCheckOut}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 py-3.5 text-sm font-semibold text-white transition"
                  >
                    <ClockOutIcon className="h-4 w-4" />
                    Clock Out
                  </button>
                ) : (
                  <div className="rounded-xl bg-slate-100 border border-slate-200 p-4 text-center">
                    <p className="text-xs font-semibold text-slate-600">Shift Completed Today</p>
                    <p className="text-xs text-slate-500 mt-0.5">Checked Out at {todayAttendance.checkOut}</p>
                  </div>
                )}
              </div>
            )}

            {attendanceMessage && (
              <div className={`mt-4 rounded-xl border p-4 text-xs ${
                messageType === 'success'
                  ? 'border-emerald-500/10 bg-emerald-500/5 text-emerald-600'
                  : 'border-red-500/10 bg-red-500/5 text-red-600'
              }`}>
                {attendanceMessage}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 mt-6 pt-4 text-center text-[10px] text-slate-400">
            System time: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Salary Slip Downloader */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Salary Slips
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Download your monthly salary slips as PDF
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Select Month</label>
                <select
                  value={slipMonth}
                  onChange={(e) => setSlipMonth(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  {months.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Select Year</label>
                <select
                  value={slipYear}
                  onChange={(e) => setSlipYear(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>

              {slipError && (
                <div className="rounded-lg bg-rose-50 border border-rose-100 p-3 text-xs text-rose-600">
                  {slipError}
                </div>
              )}

              <button
                onClick={downloadPayslip}
                disabled={slipLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 py-3 text-sm font-semibold text-white transition disabled:opacity-50"
              >
                {slipLoading ? 'Generating PDF...' : (
                  <>
                    <Download className="h-4 w-4" />
                    Download PDF Slip
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="border-t border-slate-100 mt-6 pt-4 text-center text-[10px] text-slate-400">
            Secure bank crediting records
          </div>
        </div>

        {/* Recent Leaves Grid */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Leave Requests
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Status of your recent leave applications
          </p>

          <div className="space-y-4">
            {recentLeaves.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No leave applications found.</p>
            ) : (
              recentLeaves.map((leave) => (
                <div
                  key={leave._id}
                  className="flex items-center justify-between border-b border-slate-50 pb-3"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{leave.leaveType}</p>
                    <p className="text-[10px] text-slate-400">
                      {leave.fromDate} to {leave.toDate}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                    leave.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : leave.status === 'Rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {leave.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Render modals for scanner overlays */}
      {showFaceScanner && (
        <FaceScanner
          onScanComplete={handleFaceScanComplete}
          onClose={() => setShowFaceScanner(false)}
        />
      )}

      {showQRScanner && (
        <QRScanner
          onScanComplete={handleQRScanComplete}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
};

export default EmployeeDashboard;

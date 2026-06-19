import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CalendarDays, Plus, UserPlus, Save, X, RefreshCw } from 'lucide-react';

const AttendanceTracker = () => {
  const { user } = useAuth();
  const isHRorAdmin = ['hr', 'admin'].includes(user?.role);

  // States
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Form states for manual override
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [targetCheckIn, setTargetCheckIn] = useState('09:00');
  const [targetCheckOut, setTargetCheckOut] = useState('18:00');
  const [targetStatus, setTargetStatus] = useState('Present');
  const [modalMessage, setModalMessage] = useState('');
  const [modalMessageType, setModalMessageType] = useState('success');

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      if (isHRorAdmin) {
        // Fetch all active check-ins (could query daily, or we fetch a consolidated log list. Let's retrieve today's grid or recent history)
        const todayStr = new Date().toISOString().split('T')[0];
        const res = await api.get(`/api/attendance/daily?date=${todayStr}`);
        if (res.data.success) {
          setHistory(res.data.data);
        }
      } else {
        const res = await api.get('/api/attendance/my-history');
        if (res.data.success) {
          setHistory(res.data.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [user]);

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    setModalMessage('');

    try {
      const res = await api.post('/api/attendance/override', {
        employeeId: targetEmployeeId,
        date: targetDate,
        checkIn: targetCheckIn,
        checkOut: targetCheckOut,
        status: targetStatus,
      });

      if (res.data.success) {
        setModalMessageType('success');
        setModalMessage('Attendance log override updated successfully!');
        setTargetEmployeeId('');
        setTargetDate('');
        fetchAttendance();
        setTimeout(() => {
          setShowOverrideModal(false);
          setModalMessage('');
        }, 1500);
      }
    } catch (err) {
      setModalMessageType('error');
      setModalMessage(err.response?.data?.message || 'Override transaction failed.');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Late':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Absent':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Attendance Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            {isHRorAdmin
              ? "Oversee and manually adjust employee shift check-in logs."
              : 'Review your logged clock-in/out records.'}
          </p>
        </div>
        <div className="flex gap-2">
          {isHRorAdmin && (
            <button
              onClick={() => setShowOverrideModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 transition"
            >
              <UserPlus className="h-4 w-4" />
              Manual Override
            </button>
          )}
          <button
            onClick={fetchAttendance}
            className="rounded-xl border border-slate-200 bg-white p-2.5 hover:bg-slate-50 transition"
          >
            <RefreshCw className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Main logs display list */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6">
          {isHRorAdmin ? "Today's Log Entries" : 'My Check-In History'}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Employee ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Clock In</th>
                <th className="px-4 py-3">Clock Out</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-xs text-slate-400 py-8">
                    No logs found.
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-4 font-semibold text-slate-805">{record.employeeId}</td>
                    <td className="px-4 py-4 text-xs text-slate-400 font-medium">{record.date}</td>
                    <td className="px-4 py-4 text-xs text-slate-700 font-semibold">{record.checkIn}</td>
                    <td className="px-4 py-4 text-xs text-slate-500">{record.checkOut || '--:--'}</td>
                    <td className="px-4 py-4 text-right">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getStatusStyle(record.status)}`}>
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

      {/* Manual Override Form Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">
                Create / Override Record
              </h3>
              <button
                onClick={() => {
                  setShowOverrideModal(false);
                  setModalMessage('');
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalMessage && (
              <div className={`mb-4 rounded-xl border p-4 text-xs font-semibold ${
                modalMessageType === 'success'
                  ? 'border-emerald-500/10 bg-emerald-500/5 text-emerald-600'
                  : 'border-red-500/10 bg-red-500/5 text-red-600'
              }`}>
                {modalMessage}
              </div>
            )}

            <form onSubmit={handleOverrideSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Employee ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP002"
                  value={targetEmployeeId}
                  onChange={(e) => setTargetEmployeeId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Select Date</label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Check-In Time</label>
                  <input
                    type="text"
                    required
                    placeholder="HH:MM (e.g. 09:00)"
                    value={targetCheckIn}
                    onChange={(e) => setTargetCheckIn(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 outline-none transition focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Check-Out Time</label>
                  <input
                    type="text"
                    placeholder="HH:MM (optional)"
                    value={targetCheckOut}
                    onChange={(e) => setTargetCheckOut(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-700 outline-none transition focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Attendance Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                  <option value="Half-Day">Half-Day</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowOverrideModal(false);
                    setModalMessage('');
                  }}
                  className="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/15 transition"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;

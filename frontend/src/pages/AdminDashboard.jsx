import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Users,
  ShieldCheck,
  Building,
  Activity,
  RefreshCw
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    totalDepartments: 0,
    pendingLeaves: 0,
    deptStats: {},
    attendanceSummary: { Present: 0, Late: 0, Absent: 0, 'Half-Day': 0 },
    recentLogs: []
  });
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/payroll/metrics');
      if (res.data.success) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      console.error('Error loading Admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Set up chart data for Department distribution
  const deptLabels = Object.keys(metrics.deptStats);
  const deptValues = Object.values(metrics.deptStats);

  const doughnutData = {
    labels: deptLabels,
    datasets: [
      {
        data: deptValues,
        backgroundColor: [
          '#6366f1', // Indigo
          '#10b981', // Emerald
          '#f59e0b', // Amber
          '#ec4899', // Pink
          '#3b82f6', // Blue
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  // Set up chart data for Attendance summary
  const attendanceLabels = Object.keys(metrics.attendanceSummary);
  const attendanceValues = Object.values(metrics.attendanceSummary);

  const barData = {
    labels: attendanceLabels,
    datasets: [
      {
        label: 'Attendance (Recent 30 Days)',
        data: attendanceValues,
        backgroundColor: [
          '#10b981', // Present
          '#f59e0b', // Late
          '#ef4444', // Absent
          '#3b82f6', // Half-day
        ],
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="space-y-8">
      {/* Title section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Admin Management Console
          </h1>
          <p className="text-sm text-slate-500">
            System performance, analytics, user activity audit logs, and account control.
          </p>
        </div>
        <button
          onClick={fetchAdminData}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Stats
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Registered Accounts"
          value={metrics.totalEmployees}
          icon={Users}
          colorClass="bg-indigo-50 text-indigo-600 border border-indigo-100"
        />
        <StatCard
          title="Pending System Tasks"
          value={metrics.pendingLeaves}
          icon={ShieldCheck}
          colorClass="bg-amber-50 text-amber-600 border border-amber-100"
        />
        <StatCard
          title="Monitored Departments"
          value={metrics.totalDepartments}
          icon={Building}
          colorClass="bg-blue-50 text-blue-600 border border-blue-100"
        />
        <StatCard
          title="System Logs Recorded"
          value={metrics.recentLogs.length}
          icon={Activity}
          colorClass="bg-rose-50 text-rose-600 border border-rose-100"
        />
      </div>

      {/* Analytics charts */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Attendance Summary Chart */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-1">
            Monthly Attendance Analytics
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Log frequency of clock-ins based on status in past 30 days
          </p>
          <div className="h-64 flex items-center justify-center">
            {attendanceValues.every(val => val === 0) ? (
              <p className="text-xs text-slate-400">No attendance data collected.</p>
            ) : (
              <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
            )}
          </div>
        </div>

        {/* Department Count Chart */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-1">
            Department-wise Employee Headcount
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Distribution of active accounts per team department
          </p>
          <div className="h-64 flex items-center justify-center">
            {deptValues.length === 0 ? (
              <p className="text-xs text-slate-400">No employees added to departments yet.</p>
            ) : (
              <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
            )}
          </div>
        </div>
      </div>

      {/* User Activity Monitoring (Audit log) */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-1">
          System Activity Monitoring
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Real-time security auditing log of administrator and user actions
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Action Perform</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.recentLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-xs text-slate-400 py-6">
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                metrics.recentLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-4 font-semibold text-slate-800">
                      {log.name}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {log.employeeId}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                        log.role === 'admin'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : log.role === 'hr'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {log.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-slate-700">{log.action}</td>
                    <td className="px-4 py-4 text-xs max-w-sm truncate">{log.details}</td>
                    <td className="px-4 py-4 text-right text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
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

export default AdminDashboard;

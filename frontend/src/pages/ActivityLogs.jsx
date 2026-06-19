import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Activity, RefreshCw } from 'lucide-react';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/payroll/metrics');
      if (res.data.success) {
        setLogs(res.data.data.recentLogs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            System Audit Trails
          </h1>
          <p className="text-sm text-slate-500">
            Audit logs tracking all administrator and employee activities.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="rounded-xl border border-slate-200 bg-white p-2.5 hover:bg-slate-50 transition"
        >
          <RefreshCw className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-1.5">
          <Activity className="h-5 w-5 text-indigo-600" />
          Real-Time Activity Monitor
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Access Level</th>
                <th className="px-4 py-3">Action Perform</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-xs text-slate-400 py-8">
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-4.5 font-semibold text-slate-800">
                      {log.name}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {log.employeeId}
                      </span>
                    </td>
                    <td className="px-4 py-4.5 text-xs capitalize">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                        log.role === 'admin'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : log.role === 'hr'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {log.role}
                      </span>
                    </td>
                    <td className="px-4 py-4.5 text-xs font-semibold text-slate-700">{log.action}</td>
                    <td className="px-4 py-4.5 text-xs max-w-md truncate">{log.details}</td>
                    <td className="px-4 py-4.5 text-right text-xs text-slate-400">
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

export default ActivityLogs;

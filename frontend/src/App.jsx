import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Public pages
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Dashboard routes
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import LeaveManagement from './pages/LeaveManagement';
import AttendanceTracker from './pages/AttendanceTracker';
import ManageEmployees from './pages/ManageEmployees';
import PayrollManagement from './pages/PayrollManagement';
import ActivityLogs from './pages/ActivityLogs';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected General Portal Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              
              {/* Employee specific aliases */}
              <Route path="/attendance" element={<AttendanceTracker />} />
              <Route path="/leaves" element={<LeaveManagement />} />
            </Route>
          </Route>

          {/* Protected HR & Admin management routes */}
          <Route element={<ProtectedRoute allowedRoles={['hr', 'admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/manage-employees" element={<ManageEmployees />} />
              <Route path="/attendance-records" element={<AttendanceTracker />} />
              <Route path="/leave-requests" element={<LeaveManagement />} />
              <Route path="/payroll" element={<PayrollManagement />} />
            </Route>
          </Route>

          {/* Protected Admin audits */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/activity-logs" element={<ActivityLogs />} />
            </Route>
          </Route>

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

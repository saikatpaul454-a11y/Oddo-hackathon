import React from 'react';
import { useAuth } from '../context/AuthContext';
import EmployeeDashboard from './EmployeeDashboard';
import HRDashboard from './HRDashboard';
import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'hr':
      return <HRDashboard />;
    default:
      return <EmployeeDashboard />;
  }
};

export default Dashboard;

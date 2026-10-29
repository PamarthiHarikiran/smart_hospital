import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, role, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingSpinner text="Verifying permissions..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    // Redirect to user's assigned dashboard
    const roleDashboards = {
      PATIENT: '/patient/dashboard',
      DOCTOR: '/doctor/dashboard',
      LAB: '/lab/dashboard',
      PHARMACY: '/pharmacy/dashboard',
      ADMIN: '/admin/dashboard',
    };
    const targetDashboard = roleDashboards[role] || '/login';
    return <Navigate to={targetDashboard} replace />;
  }

  return children;
};

export default RoleRoute;

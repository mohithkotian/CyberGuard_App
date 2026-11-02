import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../hooks/useAuthStore';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, token } = useAuthStore();

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;


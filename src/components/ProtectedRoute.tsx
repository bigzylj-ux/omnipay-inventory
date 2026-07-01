import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingState } from './LoadingState';

interface ProtectedRouteProps {
  allowedRoles?: Array<'admin' | 'user'>;
  requireVendorAccess?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles = ['admin', 'user'], requireVendorAccess = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <LoadingState label="Preparing your session" subLabel="Checking your access and workspace status." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.approved) {
    return <Navigate to="/pending" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requireVendorAccess && user.role === 'user' && !user.vendorAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

import React from 'react';
import { Navigate } from 'react-router-dom';
import { getAuth } from '../../api/client';

interface ProtectedRouteProps {
  role: 'ADMIN' | 'TEACHER';
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ role, children }) => {
  const auth = getAuth(role);

  if (!auth) {
    const loginRedirect = role === 'ADMIN' ? '/admin/login' : '/teacher/login';
    return <Navigate to={loginRedirect} replace />;
  }

  return <>{children}</>;
};

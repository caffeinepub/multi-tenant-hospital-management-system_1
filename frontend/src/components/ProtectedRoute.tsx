import React from 'react';
import { Navigate } from '@tanstack/react-router';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '@/hooks/useQueries';
import { AppRole } from '../backend';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useGetCallerUserProfile();

  if (isInitializing || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return <Navigate to="/" />;
  }

  if (requiredRole && profile?.appRole !== requiredRole) {
    // Redirect to appropriate dashboard
    if (profile?.appRole === AppRole.superAdmin) return <Navigate to="/super-admin" />;
    if (profile?.appRole === AppRole.hospitalAdmin) return <Navigate to="/hospital-admin" />;
    if (profile?.appRole === AppRole.doctor) return <Navigate to="/doctor" />;
    if (profile?.appRole === AppRole.patient) return <Navigate to="/patient" />;
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { useUserStore } from '@/lib/store';

interface ProtectedRouteProps {
  adminOnly?: boolean;
}

export function ProtectedRoute({ adminOnly = false }: ProtectedRouteProps) {
  const { session, isLoading: isSessionLoading } = useSessionContext();
  const { user, isCreator, isLoading } = useUserStore();
  const location = useLocation();

  // Show loading state while checking auth
  if (isSessionLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin access for admin routes
  if (adminOnly && !user?.isadmin) {
    return <Navigate to="/" replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
}
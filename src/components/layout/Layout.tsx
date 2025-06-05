import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { useUserStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { User } from '@/types';

export function Layout() {
  const { session, isLoading: isSessionLoading } = useSessionContext();
  const { setUser, setIsCreator, isLoading, setIsLoading } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to top on route change
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  React.useEffect(() => {
    async function loadUserProfile() {
      if (!session?.user) {
        setUser(null);
        setIsCreator(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        // If we have user data, set it. Otherwise, clear the user state
        if (data) {
          setUser(data as User);
          setIsCreator(true);
        } else {
          // This is expected during onboarding when the user record doesn't exist yet
          setUser(null);
          setIsCreator(false);
          
          // Only redirect to onboarding if not already there
          if (location.pathname !== '/onboarding') {
            navigate('/onboarding');
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        setUser(null);
        setIsCreator(false);
      } finally {
        setIsLoading(false);
      }
    }

    if (!isSessionLoading) {
      loadUserProfile();
    }
  }, [session, isSessionLoading, setUser, setIsCreator, setIsLoading, navigate, location.pathname]);

  if (isSessionLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
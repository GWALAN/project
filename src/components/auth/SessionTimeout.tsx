import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout

export function SessionTimeout() {
  const { supabaseClient } = useSessionContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    let warningTimeout: NodeJS.Timeout;
    let logoutTimeout: NodeJS.Timeout;

    const resetTimers = () => {
      clearTimeout(warningTimeout);
      clearTimeout(logoutTimeout);

      warningTimeout = setTimeout(() => {
        setShowWarning(true);
        toast({
          title: 'Session expiring soon',
          description: 'Your session will expire in 5 minutes. Please save your work.',
          variant: 'warning',
        });
      }, SESSION_TIMEOUT - WARNING_TIME);

      logoutTimeout = setTimeout(async () => {
        await supabaseClient.auth.signOut();
        navigate('/login');
        toast({
          title: 'Session expired',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive',
        });
      }, SESSION_TIMEOUT);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimers));
    resetTimers();

    return () => {
      events.forEach(event => document.removeEventListener(event, resetTimers));
      clearTimeout(warningTimeout);
      clearTimeout(logoutTimeout);
    };
  }, [supabaseClient, navigate, toast]);

  if (!showWarning) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-900">Session Expiring Soon</h3>
            <p className="text-sm text-gray-600 mt-1">
              Your session will expire in 5 minutes. Would you like to stay logged in?
            </p>
            <div className="mt-3 flex space-x-3">
              <Button
                size="sm"
                onClick={async () => {
                  await supabaseClient.auth.refreshSession();
                  setShowWarning(false);
                  toast({
                    title: 'Session extended',
                    description: 'Your session has been extended.',
                  });
                }}
              >
                Stay Logged In
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await supabaseClient.auth.signOut();
                  navigate('/login');
                }}
              >
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
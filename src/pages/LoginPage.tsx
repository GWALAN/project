import React, { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Box, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export function LoginPage() {
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      setIsSent(true);
      toast({
        title: 'Magic link sent',
        description: 'Check your email for the login link.',
      });
    } catch (error: any) {
      toast({
        title: 'Error sending magic link',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 shadow rounded-lg">
        <div className="text-center mb-6">
          <Box className="h-10 w-10 text-primary mx-auto" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            {isSent ? 'Check your email' : 'Sign in to your account'}
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            {isSent
              ? 'We\'ve sent you a magic link to sign in'
              : 'Enter your email to receive a magic link'}
          </p>
        </div>

        {isSent ? (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Click the link in your email to sign in to your account.
            </p>
            <p className="text-sm text-gray-600">
              Didn't receive an email?{' '}
              <button
                onClick={() => setIsSent(false)}
                className="text-primary hover:text-primary/80 font-medium"
              >
                Try again
              </button>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendLink} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending link...
                </>
              ) : (
                'Send magic link'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
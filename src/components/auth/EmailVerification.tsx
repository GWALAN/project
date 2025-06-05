import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

export function EmailVerification({ email, onVerified, onBack }: EmailVerificationProps) {
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');

  const handleVerification = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
      });

      if (error) throw error;

      toast({
        title: 'Email verified',
        description: 'Your email has been successfully verified.',
      });

      onVerified();
    } catch (error: any) {
      toast({
        title: 'Verification failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;

      toast({
        title: 'Verification email sent',
        description: 'Please check your email for the verification code.',
      });
    } catch (error: any) {
      toast({
        title: 'Error sending verification email',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="text-center mb-8">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Verify your email</h2>
        <p className="mt-2 text-sm text-gray-600">
          We've sent a verification code to<br />
          <span className="font-medium">{email}</span>
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Input
            type="text"
            placeholder="Enter verification code"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full text-center text-lg tracking-wider"
          />
        </div>

        <Button 
          onClick={handleVerification} 
          disabled={!token || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Email'
          )}
        </Button>

        <div className="text-center pt-4">
          <button
            onClick={resendVerification}
            className="text-sm text-primary hover:text-primary/80"
          >
            Didn't receive the code? Resend
          </button>
        </div>
      </div>
    </div>
  );
}
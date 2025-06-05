import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Shield, Loader2, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface TwoFactorSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  useEffect(() => {
    async function setupTwoFactor() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const response = await fetch('/functions/v1/generate-totp-secret', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId: user.id })
        });

        const { secret, otpauth_url } = await response.json();
        setSecret(secret);

        const qr = await QRCode.toDataURL(otpauth_url);
        setQrCode(qr);
      } catch (error) {
        console.error('Error setting up 2FA:', error);
        toast({
          title: 'Setup Error',
          description: 'Failed to set up two-factor authentication.',
          variant: 'destructive',
        });
      }
    }

    setupTwoFactor();
  }, [supabase, toast]);

  const handleVerification = async () => {
    if (!secret || !verificationCode) return;

    setIsLoading(true);
    try {
      const response = await fetch('/functions/v1/verify-totp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          secret,
          token: verificationCode
        })
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      toast({
        title: '2FA Enabled',
        description: 'Two-factor authentication has been successfully enabled.',
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg">
      <div className="flex items-center space-x-3 text-primary mb-6">
        <Shield className="h-6 w-6" />
        <h3 className="text-lg font-semibold">Set Up Two-Factor Authentication</h3>
      </div>

      <div className="space-y-6">
        <div className="text-sm text-gray-600">
          <p className="mb-2">Follow these steps to enable 2FA:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Download an authenticator app like Google Authenticator or Authy</li>
            <li>Scan the QR code below with your authenticator app</li>
            <li>Enter the 6-digit code from your authenticator app</li>
          </ol>
        </div>

        {qrCode && (
          <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
            <img src={qrCode} alt="QR Code" className="w-48 h-48" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Verification Code
          </label>
          <Input
            type="text"
            maxLength={6}
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
            className="text-center text-lg tracking-wider"
          />
        </div>

        <div className="bg-yellow-50 p-4 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> Store your backup codes in a safe place. You'll need them if you lose access to your authenticator app.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleVerification}
            disabled={!verificationCode || verificationCode.length !== 6 || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Enable 2FA
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
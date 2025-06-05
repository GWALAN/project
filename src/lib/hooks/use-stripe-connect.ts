import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '@/hooks/use-toast';

export function useStripeConnect() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  const connectStripeAccount = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: {
          userId,
          returnUrl: `${window.location.origin}/dashboard/settings`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to connect Stripe account');
      }

      if (!data?.url) {
        throw new Error('No redirect URL received from Stripe');
      }

      // Redirect to Stripe Connect onboarding
      window.location.href = data.url;
    } catch (error: any) {
      toast({
        title: 'Error connecting Stripe account',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    connectStripeAccount,
  };
}
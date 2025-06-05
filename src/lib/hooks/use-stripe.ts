import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { stripe } from '@/lib/stripe';
import { useToast } from '@/hooks/use-toast';

export function useStripe() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  const createCheckoutSession = async (productId: string, email: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { productId, email },
      });

      if (error) throw error;

      const { sessionId } = data;
      const stripeInstance = await stripe;
      
      if (!stripeInstance) {
        throw new Error('Failed to load Stripe');
      }

      const { error: stripeError } = await stripeInstance.redirectToCheckout({
        sessionId,
      });

      if (stripeError) throw stripeError;
    } catch (error: any) {
      toast({
        title: 'Error creating checkout session',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    createCheckoutSession,
  };
}
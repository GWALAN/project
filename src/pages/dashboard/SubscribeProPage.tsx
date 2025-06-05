import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { Shield, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export function SubscribeProPage() {
  const user = useUser();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'pro'>('free');

  useEffect(() => {
    async function checkSubscription() {
      if (!user) return;

      try {
        const { data: userData } = await supabase
          .from('users')
          .select('plan_type')
          .eq('id', user.id)
          .single();

        if (userData) {
          setCurrentPlan(userData.plan_type as 'free' | 'pro');
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkSubscription();
  }, [user, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Upgrade to Pro</h1>
          <p className="text-lg text-gray-600 mt-2">
            Get more features and lower fees with our Pro plan
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Pro Plan</h2>
                <p className="text-gray-600">$10/month</p>
              </div>
              {currentPlan === 'pro' && (
                <span className="px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-full">
                  Current Plan
                </span>
              )}
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-gray-600">
                  <span className="font-medium text-gray-900">0% Platform Fee</span>
                  {' '}- Keep more of what you earn (regular fee is 10%)
                </p>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-gray-600">
                  <span className="font-medium text-gray-900">50GB Storage</span>
                  {' '}- Upload larger files and more content (regular limit is 2GB)
                </p>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-gray-600">
                  <span className="font-medium text-gray-900">Priority Support</span>
                  {' '}- Get faster responses and dedicated assistance
                </p>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-gray-600">
                  <span className="font-medium text-gray-900">Advanced Analytics</span>
                  {' '}- Get deeper insights into your sales and audience
                </p>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-gray-600">
                  <span className="font-medium text-gray-900">Custom Domain</span>
                  {' '}- Use your own domain for your profile
                </p>
              </div>
            </div>

            {currentPlan === 'free' ? (
              <div className="space-y-4">
                <PayPalScriptProvider options={{ 
                  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
                  vault: true,
                  intent: "subscription"
                }}>
                  <PayPalButtons
                    createSubscription={(data, actions) => {
                      return actions.subscription.create({
                        plan_id: 'P-XXX', // Replace with your PayPal plan ID
                        custom_id: user?.id,
                      });
                    }}
                    onApprove={async (data, actions) => {
                      setIsSubscribing(true);
                      try {
                        // Update subscription status
                        const { error: subError } = await supabase
                          .from('pro_subscriptions')
                          .insert({
                            userid: user?.id,
                            paypalsubscriptionid: data.subscriptionID,
                            active: true
                          });

                        if (subError) throw subError;

                        // Update user plan type
                        const { error: userError } = await supabase
                          .from('users')
                          .update({ plan_type: 'pro' })
                          .eq('id', user?.id);

                        if (userError) throw userError;

                        toast({
                          title: 'Welcome to Pro!',
                          description: 'Your account has been upgraded successfully.',
                        });

                        navigate('/dashboard');
                      } catch (error: any) {
                        console.error('Error updating subscription:', error);
                        toast({
                          title: 'Error upgrading account',
                          description: error.message,
                          variant: 'destructive',
                        });
                      } finally {
                        setIsSubscribing(false);
                      }
                    }}
                    onError={() => {
                      toast({
                        title: 'Payment failed',
                        description: 'There was an error processing your payment. Please try again.',
                        variant: 'destructive',
                      });
                    }}
                    style={{ layout: 'vertical' }}
                  />
                </PayPalScriptProvider>

                <p className="text-xs text-center text-gray-500">
                  By subscribing, you agree to our Terms of Service and Privacy Policy.
                  You can cancel your subscription at any time.
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  You're already on the Pro plan! Enjoy all the premium features.
                </p>
                <Button onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
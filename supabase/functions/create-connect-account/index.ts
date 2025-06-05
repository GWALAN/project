import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { stripe } from './stripe.ts';
import { supabase } from './supabase.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate environment variables
    if (!Deno.env.get('STRIPE_SECRET_KEY')) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    const { userId, returnUrl } = await req.json();
    
    if (!userId || !returnUrl) {
      throw new Error('Missing required parameters: userId and returnUrl');
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, username, displayname')
      .eq('id', userId)
      .single();

    if (userError) throw userError;
    if (!user) throw new Error('User not found');

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: user.email,
      business_type: 'individual',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: user.displayname,
        url: `${req.headers.get('origin')}/u/${user.username}`,
      },
    });

    // Update user with Stripe account ID
    const { error: updateError } = await supabase
      .from('users')
      .update({
        stripeaccountid: account.id,
        stripeaccountstatus: 'pending'
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${returnUrl}?refresh=true`,
      return_url: `${returnUrl}?success=true`,
      type: 'account_onboarding',
    });

    return new Response(
      JSON.stringify({ url: accountLink.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Stripe Connect error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to connect Stripe account',
        details: error.toString()
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
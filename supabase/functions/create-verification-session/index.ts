import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { stripe } from './stripe.ts';
import { supabase } from './supabase.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, accountId } = await req.json();

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Create verification session
    const session = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        userId,
        accountId,
      },
      return_url: `${req.headers.get('origin')}/dashboard/settings?verified=true`,
      refresh_url: `${req.headers.get('origin')}/dashboard/settings?refresh=true`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
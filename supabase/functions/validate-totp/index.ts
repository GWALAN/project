import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import { TOTP } from "npm:otpauth@9.2.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      {
        auth: {
          persistSession: false
        }
      }
    );

    // Get validation details from request
    const { userId, token } = await req.json();
    if (!userId || !token) {
      throw new Error('User ID and token are required');
    }

    // Get user's TOTP secret
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !user) {
      throw new Error('User not found');
    }

    const totpSecret = user.user_metadata?.totp_secret;
    if (!totpSecret) {
      throw new Error('2FA not enabled for this user');
    }

    // Create TOTP instance
    const totp = new TOTP({
      secret: totpSecret,
      algorithm: 'SHA1',
      digits: 6,
      period: 30
    });

    // Validate token
    const isValid = totp.validate({ token, window: 1 }) !== null;
    if (!isValid) {
      throw new Error('Invalid verification code');
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
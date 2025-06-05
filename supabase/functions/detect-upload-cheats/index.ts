import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabase } from './supabase.ts';
import { validateFile, performSecurityChecks, FILE_SIZE_LIMITS } from './utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, file_name, file_type, claimed_content_type, file_content } = await req.json();

    // Validate required fields
    if (!user_id || !file_name || !file_type || !claimed_content_type) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields'
        }),
        { headers: corsHeaders, status: 400 }
      );
    }

    // Get user's account status
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('plan_type, identityverified')
      .eq('id', user_id)
      .single();

    if (userError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User not found'
        }),
        { headers: corsHeaders, status: 404 }
      );
    }

    // Perform security checks
    const securityError = performSecurityChecks(file_name, file_type);
    if (securityError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: securityError
        }),
        { headers: corsHeaders, status: 400 }
      );
    }

    // Get current storage usage
    const { data: usage, error: usageError } = await supabase
      .from('storage_usage')
      .select('total_size, file_count')
      .eq('userid', user_id)
      .single();

    if (usageError && usageError.code !== 'PGRST116') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error checking storage usage'
        }),
        { headers: corsHeaders, status: 500 }
      );
    }

    // Validate storage limits based on plan
    const storageLimit = user.plan_type === 'pro' ? 50 * 1024 * 1024 * 1024 : 2 * 1024 * 1024 * 1024;
    const fileCountLimit = user.plan_type === 'pro' ? Infinity : 5;

    if (usage && usage.total_size + FILE_SIZE_LIMITS[claimed_content_type] > storageLimit) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Storage limit exceeded'
        }),
        { headers: corsHeaders, status: 400 }
      );
    }

    if (usage && usage.file_count >= fileCountLimit) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'File count limit exceeded'
        }),
        { headers: corsHeaders, status: 400 }
      );
    }

    // Validate file type and content
    const validationError = validateFile(file_name, file_type, claimed_content_type);
    if (validationError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: validationError
        }),
        { headers: corsHeaders, status: 400 }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'File validation successful'
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { headers: corsHeaders, status: 500 }
    );
  }
});
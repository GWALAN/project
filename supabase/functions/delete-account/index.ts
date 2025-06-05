import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

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

    // Get user ID from auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    // Delete all storage files
    const { data: storageFiles } = await supabase.storage
      .from('product-files')
      .list(user.id);

    if (storageFiles) {
      await supabase.storage
        .from('product-files')
        .remove(storageFiles.map(file => `${user.id}/${file.name}`));
    }

    const { data: profileImages } = await supabase.storage
      .from('profile-images')
      .list(user.id);

    if (profileImages) {
      await supabase.storage
        .from('profile-images')
        .remove(profileImages.map(file => `${user.id}/${file.name}`));
    }

    // Delete user's data (RLS policies will cascade delete related records)
    await supabase
      .from('users')
      .delete()
      .eq('id', user.id);

    // Finally, delete the auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
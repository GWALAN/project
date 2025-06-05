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

    // Get user ID from request body
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    // First, delete from public.users to avoid foreign key constraints
    const { error: publicUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (publicUserError && publicUserError.code !== 'PGRST116') {
      console.error('Error deleting from public.users:', publicUserError);
    }

    // Delete any storage objects owned by this user
    try {
      // Delete from profile-images
      const { data: profileImages } = await supabase.storage
        .from('profile-images')
        .list(userId);
      
      if (profileImages && profileImages.length > 0) {
        await supabase.storage
          .from('profile-images')
          .remove(profileImages.map(file => `${userId}/${file.name}`));
      }

      // Delete from product-images
      const { data: productImages } = await supabase.storage
        .from('product-images')
        .list(userId);
      
      if (productImages && productImages.length > 0) {
        await supabase.storage
          .from('product-images')
          .remove(productImages.map(file => `${userId}/${file.name}`));
      }

      // Delete from product-files
      const { data: productFiles } = await supabase.storage
        .from('product-files')
        .list(userId);
      
      if (productFiles && productFiles.length > 0) {
        await supabase.storage
          .from('product-files')
          .remove(productFiles.map(file => `${userId}/${file.name}`));
      }
    } catch (storageError) {
      console.error('Error deleting storage files:', storageError);
    }

    // Finally, delete from auth.users
    const { error: authUserError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authUserError) {
      throw new Error(`Error deleting from auth.users: ${authUserError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${userId} deleted successfully` 
      }),
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
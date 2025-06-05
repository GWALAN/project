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

    // First, call the RPC function to delete all users from public.users
    const { error: rpcError } = await supabase.rpc('delete_all_users');
    
    if (rpcError) {
      console.error('Error calling delete_all_users RPC:', rpcError);
      
      // Fallback: try to delete directly from public.users
      const { error: fallbackError } = await supabase
        .from('users')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except dummy user
      
      if (fallbackError) {
        console.error('Fallback error deleting from public.users:', fallbackError);
      }
    }

    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Error fetching auth users: ${authError.message}`);
    }

    // Delete each user from auth.users
    const results = await Promise.all(
      authUsers.users.map(async (user) => {
        try {
          // Delete storage files first
          try {
            // Delete from profile-images
            const { data: profileImages } = await supabase.storage
              .from('profile-images')
              .list(user.id);
            
            if (profileImages && profileImages.length > 0) {
              await supabase.storage
                .from('profile-images')
                .remove(profileImages.map(file => `${user.id}/${file.name}`));
            }

            // Delete from product-images
            const { data: productImages } = await supabase.storage
              .from('product-images')
              .list(user.id);
            
            if (productImages && productImages.length > 0) {
              await supabase.storage
                .from('product-images')
                .remove(productImages.map(file => `${user.id}/${file.name}`));
            }

            // Delete from product-files
            const { data: productFiles } = await supabase.storage
              .from('product-files')
              .list(user.id);
            
            if (productFiles && productFiles.length > 0) {
              await supabase.storage
                .from('product-files')
                .remove(productFiles.map(file => `${user.id}/${file.name}`));
            }
          } catch (storageError) {
            console.error(`Error deleting storage for user ${user.id}:`, storageError);
          }

          // Delete the user
          const { error } = await supabase.auth.admin.deleteUser(user.id);
          
          return {
            id: user.id,
            email: user.email,
            success: !error,
            error: error ? error.message : null
          };
        } catch (userError) {
          return {
            id: user.id,
            email: user.email,
            success: false,
            error: userError.message
          };
        }
      })
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Deleted ${results.filter(r => r.success).length} users`,
        results
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
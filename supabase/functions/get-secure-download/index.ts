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

    // Get product ID from request
    const { productId } = await req.json();
    if (!productId) {
      throw new Error('Product ID is required');
    }

    // Check if user is the creator of the product (creators can always download their own files)
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('fileurl, creatorid')
      .eq('id', productId)
      .single();

    if (productError) {
      throw new Error('Product not found');
    }

    if (!product.fileurl) {
      throw new Error('No file associated with this product');
    }

    let hasAccess = false;

    // If user is the creator, they have access
    if (product.creatorid === user.id) {
      hasAccess = true;
    } else {
      // Check if user has purchased the product
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('productid', productId)
        .eq('buyeremail', user.email)
        .eq('status', 'paid')
        .maybeSingle();

      if (orderError) {
        throw new Error('Error checking purchase status');
      }

      hasAccess = !!order;
    }

    if (!hasAccess) {
      throw new Error('You do not have access to this file');
    }

    // Extract file path from the full URL
    const fileUrl = product.fileurl;
    const filePath = fileUrl.split('/').slice(4).join('/');

    // Generate signed URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('product-files')
      .createSignedUrl(filePath, 3600);

    if (signedUrlError) {
      throw new Error('Error generating download URL');
    }

    return new Response(
      JSON.stringify({ 
        url: signedUrlData.signedUrl,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
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
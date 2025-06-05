import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { stripe } from './stripe.ts';
import { supabase } from './supabase.ts';
import { calculatePlatformFee } from './utils.ts';

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
    const { productId, email } = await req.json();

    if (!productId || !email) {
      throw new Error('Missing required fields: productId and email');
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*, users!inner(*)')
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('Product fetch error:', productError);
      throw new Error('Failed to fetch product details');
    }
    
    if (!product) {
      throw new Error('Product not found');
    }

    // Get creator's Stripe account
    if (!product.users.stripeaccountid) {
      throw new Error('Creator has not connected their Stripe account');
    }

    // Calculate platform fee
    const platformFee = calculatePlatformFee(product.price, product.contenttype);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.title,
              description: product.description,
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: product.users.stripeaccountid,
        },
      },
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/u/${product.users.username}`,
    });

    // Create order record
    const { error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          productid: productId,
          buyeremail: email,
          status: 'pending',
          payoutstatus: 'pending',
          stripepaymentintentid: session.payment_intent as string,
        },
      ]);

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw new Error('Failed to create order record');
    }

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
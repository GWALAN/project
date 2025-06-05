import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
    // Get the signature from headers
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No Stripe signature found');
    }

    // Get the raw body
    const body = await req.text();

    // Verify the signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
      );
    } catch (err) {
      console.error('⚠️  Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Verify the payment intent exists
        if (!session.payment_intent) {
          throw new Error('No payment intent found');
        }
        
        // Update order status to paid
        const { error: orderError } = await supabase
          .from('orders')
          .update({ 
            status: 'paid',
            payoutstatus: 'pending'
          })
          .eq('stripepaymentintentid', session.payment_intent)
          .eq('status', 'pending'); // Only update pending orders

        if (orderError) throw orderError;

        // Get order details for email notification
        const { data: order, error: orderFetchError } = await supabase
          .from('orders')
          .select(`
            *,
            products (
              id,
              title,
              price,
              fileurl,
              contenttype,
              creatorid,
              users!inner (
                id,
                email,
                displayName,
                stripeaccountid
              )
            )
          `)
          .eq('stripepaymentintentid', session.payment_intent)
          .single();

        if (orderFetchError) throw orderFetchError;

        // Calculate platform fee based on monthly earnings
        const { data: feeData, error: feeError } = await supabase
          .rpc('calculate_platform_fee', {
            creator_id: order.products.users.id,
            amount: order.products.price,
            content_type: order.products.contenttype
          });

        if (feeError) throw feeError;

        const platformFee = feeData;

        // Create transfer to seller's connected account
        await stripe.transfers.create({
          amount: order.products.price - platformFee,
          currency: 'usd',
          destination: order.products.users.stripeaccountid,
          transfer_group: order.id,
          description: `Payment for order ${order.id}`,
          metadata: {
            orderId: order.id,
            productId: order.products.id,
            platformFee
          }
        });

        // Generate short-lived download URL if file exists
        let downloadUrl = null;
        if (order.products.fileurl) {
          const { data: { signedUrl } } = await supabase.storage
            .from('product-files')
            .createSignedUrl(order.products.fileurl, 300); // 5 minute expiry
          downloadUrl = signedUrl;
        }

        // Send email notifications
        await Promise.all([
          // Send confirmation to buyer
          supabase.functions.invoke('send-email', {
            body: {
              to: order.buyeremail,
              subject: 'Order Confirmation - LinkNest',
              template: 'orderConfirmation',
              data: {
                orderId: order.id,
                productTitle: order.products.title,
                amount: order.products.price,
                downloadUrl,
                messageUrl: `${req.headers.get('origin')}/messages/${order.id}`
              },
            },
          }),
          
          // Send notification to seller
          supabase.functions.invoke('send-email', {
            body: {
              to: order.products.users.email,
              subject: 'New Order Received - LinkNest',
              template: 'newOrder',
              data: {
                orderId: order.id,
                productTitle: order.products.title,
                buyerEmail: order.buyeremail,
                amount: order.products.price,
                platformFee,
                netAmount: order.products.price - platformFee,
                dashboardUrl: `${req.headers.get('origin')}/dashboard/orders`,
                isDigitalProduct: Boolean(order.products.fileurl),
              },
            },
          }),
        ]);

        break;
      }

      // Handle other event types...
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
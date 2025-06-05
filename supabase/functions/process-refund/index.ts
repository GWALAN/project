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

    // Check if user is admin
    const { data: userData, error: adminCheckError } = await supabase
      .from('users')
      .select('isadmin')
      .eq('id', user.id)
      .single();

    if (adminCheckError || !userData.isadmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Get refund request ID from request
    const { refundRequestId } = await req.json();
    if (!refundRequestId) {
      throw new Error('Refund request ID is required');
    }

    // Get refund request details
    const { data: refundRequest, error: refundError } = await supabase
      .from('refund_requests')
      .select(`
        *,
        order:orders(
          id,
          productid,
          buyeremail,
          status,
          paypalorderid,
          stripepaymentintentid,
          product:products(
            id,
            title,
            price,
            creatorid
          )
        )
      `)
      .eq('id', refundRequestId)
      .single();

    if (refundError || !refundRequest) {
      throw new Error('Refund request not found');
    }

    if (refundRequest.status !== 'pending') {
      throw new Error('Refund request has already been processed');
    }

    // Process refund based on payment method
    if (refundRequest.order.paypalorderid) {
      // For PayPal refunds, we would call PayPal API here
      // This is a placeholder for the actual implementation
      console.log('Processing PayPal refund for order:', refundRequest.order.paypalorderid);
      
      // In a real implementation, you would call PayPal's refund API
      // const paypalResponse = await fetch('https://api.paypal.com/v2/payments/captures/{capture_id}/refund', {...});
    } 
    else if (refundRequest.order.stripepaymentintentid) {
      // For Stripe refunds, we would call Stripe API here
      // This is a placeholder for the actual implementation
      console.log('Processing Stripe refund for payment intent:', refundRequest.order.stripepaymentintentid);
      
      // In a real implementation, you would call Stripe's refund API
      // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      // const refund = await stripe.refunds.create({ payment_intent: refundRequest.order.stripepaymentintentid });
    }
    else {
      throw new Error('No payment method found for this order');
    }

    // Update refund request status
    const { error: updateError } = await supabase
      .from('refund_requests')
      .update({ 
        status: 'approved',
        updatedat: new Date().toISOString()
      })
      .eq('id', refundRequestId);

    if (updateError) {
      throw updateError;
    }

    // Update order status
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({ status: 'refunded' })
      .eq('id', refundRequest.orderid);

    if (orderUpdateError) {
      throw orderUpdateError;
    }

    // Send email notifications
    try {
      // Notify buyer
      await supabase.functions.invoke('send-email', {
        body: {
          to: refundRequest.order.buyeremail,
          subject: 'Your Refund Request Has Been Approved',
          template: 'refundApproved',
          data: {
            orderid: refundRequest.orderid,
            productTitle: refundRequest.order.product.title,
            amount: refundRequest.order.product.price
          }
        }
      });

      // Notify creator
      const { data: creator } = await supabase
        .from('users')
        .select('email')
        .eq('id', refundRequest.order.product.creatorid)
        .single();

      if (creator) {
        await supabase.functions.invoke('send-email', {
          body: {
            to: creator.email,
            subject: 'Refund Processed for Your Product',
            template: 'creatorRefundNotification',
            data: {
              orderid: refundRequest.orderid,
              productTitle: refundRequest.order.product.title,
              amount: refundRequest.order.product.price,
              reason: refundRequest.reason
            }
          }
        });
      }
    } catch (emailError) {
      console.error('Error sending email notifications:', emailError);
      // Continue with the process even if email sending fails
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Refund processed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error processing refund:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'An error occurred while processing the refund'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
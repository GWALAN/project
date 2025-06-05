import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
    const payload = await req.json();
    const eventType = payload.event_type;

    // Handle PayPal webhook events
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const orderId = payload.resource.custom_id;
        const paypalOrderId = payload.resource.id;

        // Update order status
        const { error: orderError } = await supabase
          .from('orders')
          .update({ 
            status: 'paid',
            payoutstatus: 'completed',
            paypalorderid: paypalOrderId
          })
          .eq('id', orderId);

        if (orderError) throw orderError;

        // Send email notifications
        await Promise.all([
          // Notify buyer
          supabase.functions.invoke('send-email', {
            body: {
              to: payload.resource.payer.email_address,
              subject: 'Order Confirmation',
              template: 'orderConfirmation',
              data: {
                orderId,
                amount: payload.resource.amount.value
              }
            }
          }),
          // Notify seller
          supabase.functions.invoke('send-email', {
            body: {
              to: payload.resource.payee.email_address,
              subject: 'New Sale',
              template: 'newSale',
              data: {
                orderId,
                amount: payload.resource.amount.value,
                platformFee: payload.resource.platform_fees[0].amount.value
              }
            }
          })
        ]);

        break;
      }

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED': {
        const orderId = payload.resource.custom_id;
        
        await supabase
          .from('orders')
          .update({ 
            status: 'failed',
            payoutstatus: 'failed'
          })
          .eq('id', orderId);
        
        break;
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
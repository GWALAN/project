import React from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '@/hooks/use-toast';
import { ThemeConfig } from '@/types';
import braintree from 'braintree-web';

interface PaymentMethodSelectorProps {
  productId: string;
  email: string;
  theme: ThemeConfig;
  onSuccess: (orderId: string) => void;
}

export function PaymentMethodSelector({ productId, email, theme, onSuccess }: PaymentMethodSelectorProps) {
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const [amount, setAmount] = React.useState<string>('0.00');
  const [creatorId, setCreatorId] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchProductDetails() {
      try {
        const { data: product, error } = await supabase
          .from('products')
          .select('price, creatorid')
          .eq('id', productId)
          .single();

        if (error) throw error;
        
        // Convert cents to dollars
        const priceInDollars = (product.price / 100).toFixed(2);
        setAmount(priceInDollars);
        setCreatorId(product.creatorid);
      } catch (error) {
        console.error('Error fetching product details:', error);
        toast({
          title: 'Error',
          description: 'Could not fetch product details',
          variant: 'destructive'
        });
      }
    }

    fetchProductDetails();
  }, [productId, supabase, toast]);

  return (
    <div className="space-y-6">
      <PayPalScriptProvider options={{ 
        clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
        currency: "USD",
        intent: "capture",
        components: "buttons,hosted-fields"
      }}>
        <PayPalButtons
          style={{ layout: 'horizontal' }}
          createOrder={(data, actions) => {
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: amount,
                  breakdown: {
                    item_total: {
                      value: amount,
                      currency_code: 'USD'
                    }
                  }
                },
                custom_id: productId,
                description: 'Digital Product Purchase',
                payee: {
                  merchant_id: creatorId // Creator's PayPal merchant ID
                },
                payment_instruction: {
                  platform_fees: [{
                    amount: {
                      value: (parseFloat(amount) * 0.10).toFixed(2) // 10% platform fee
                    }
                  }]
                }
              }],
              application_context: {
                shipping_preference: 'NO_SHIPPING'
              }
            });
          }}
          onApprove={async (data, actions) => {
            if (!actions.order) return;
            const order = await actions.order.capture();
            
            // Create order in database
            try {
              const { error: orderError } = await supabase
                .from('orders')
                .insert([{
                  productid: productId,
                  buyeremail: email,
                  status: 'paid',
                  payoutstatus: 'completed', // PayPal handles the split automatically
                  paypalorderid: order.id
                }]);

              if (orderError) throw orderError;
              
              onSuccess(order.id);
            } catch (error) {
              console.error('Error creating order:', error);
              toast({
                title: 'Error',
                description: 'Failed to process order',
                variant: 'destructive'
              });
            }
          }}
          onError={() => {
            toast({
              title: 'Payment Failed',
              description: 'There was an error processing your payment. Please try again.',
              variant: 'destructive'
            });
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
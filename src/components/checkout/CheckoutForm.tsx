import React from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { ThemeConfig } from '@/types';

interface CheckoutFormProps {
  productId: string;
  theme: ThemeConfig;
}

interface FormValues {
  email: string;
}

export function CheckoutForm({ productId, theme }: CheckoutFormProps) {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormValues>();
  const email = watch('email');

  const handleSuccess = (orderId: string) => {
    // Handle successful payment
    console.log('Payment successful:', orderId);
  };

  return (
    <div className="space-y-6">
      <div>
        <label 
          htmlFor="email" 
          className="block text-sm font-medium mb-1"
          style={{ color: theme.text }}
        >
          Email address
        </label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {email && (
        <PaymentMethodSelector
          productId={productId}
          email={email}
          theme={theme}
          onSuccess={handleSuccess}
        />
      )}

      <p 
        className="text-xs text-center opacity-80"
        style={{ color: theme.text }}
      >
        Secure payment powered by Stripe and PayPal
      </p>
    </div>
  );
}
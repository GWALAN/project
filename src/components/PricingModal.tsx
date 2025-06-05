import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { Loader2, Info } from 'lucide-react';

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (pricing: PricingDetails) => void;
  contentType: string;
}

interface PricingDetails {
  model: 'one_time' | 'subscription';
  price: number;
  interval?: 'monthly' | 'yearly';
  currency: string;
}

export function PricingModal({ open, onClose, onSave, contentType }: PricingModalProps) {
  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm<PricingDetails>({
    defaultValues: {
      model: 'one_time',
      price: 0,
      interval: 'monthly',
      currency: 'USD'
    }
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const selectedModel = watch('model');
  const price = watch('price') || 0;
  const interval = watch('interval');

  // Calculate fees and earnings
  const platformFee = React.useMemo(() => {
    // Default platform fee is 10%
    const defaultFeePercentage = 0.10;
    
    return Math.round(price * defaultFeePercentage);
  }, [price, contentType]);

  const paypalFee = React.useMemo(() => {
    // PayPal's fee structure: 3.49% + $0.49 for most transactions
    return (price * 0.0349) + 0.49;
  }, [price]);

  const estimatedEarnings = price - platformFee - paypalFee;

  const submitHandler = async (data: PricingDetails) => {
    setIsSubmitting(true);
    try {
      // Validate minimum price
      if (data.model === 'one_time' && data.price < 0.50) {
        throw new Error('Minimum price is $0.50');
      }
      if (data.model === 'subscription' && data.price < 1.00) {
        throw new Error('Minimum subscription price is $1.00');
      }

      onSave(data);
      onClose();
    } catch (error: any) {
      console.error('Error saving pricing:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Set Pricing</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
          <Tabs defaultValue="one_time" onValueChange={(val) => setValue('model', val as 'one_time' | 'subscription')}>
            <TabsList className="w-full">
              <TabsTrigger value="one_time" className="flex-1">One-time Purchase</TabsTrigger>
              <TabsTrigger value="subscription" className="flex-1">Subscription</TabsTrigger>
            </TabsList>

            <TabsContent value="one_time" className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Price (USD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.50"
                    className="pl-7"
                    {...register('price', { 
                      required: 'Price is required',
                      min: {
                        value: 0.50,
                        message: 'Minimum price is $0.50'
                      }
                    })}
                  />
                </div>
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Platform Fee ({(platformFee / price * 100).toFixed(1)}%)</span>
                  <span className="text-gray-900">-${platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">PayPal Fee (3.49% + $0.49)</span>
                  <span className="text-gray-900">-${paypalFee.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between font-medium">
                  <span>You'll Receive</span>
                  <span className="text-green-600">${Math.max(0, estimatedEarnings).toFixed(2)}</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subscription Price (USD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    min="1.00"
                    className="pl-7"
                    {...register('price', { 
                      required: 'Price is required',
                      min: {
                        value: 1.00,
                        message: 'Minimum subscription price is $1.00'
                      }
                    })}
                  />
                </div>
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Billing Interval</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register('interval')}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Platform Fee (10%)</span>
                  <span className="text-gray-900">-${(price * 0.10).toFixed(2)}/{interval}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">PayPal Fee (3.49% + $0.49)</span>
                  <span className="text-gray-900">-${paypalFee.toFixed(2)}/{interval}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between font-medium">
                  <span>You'll Receive</span>
                  <span className="text-green-600">${Math.max(0, estimatedEarnings).toFixed(2)}/{interval}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Subscription Features:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>Automatic recurring billing</li>
                    <li>Subscriber-only content access</li>
                    <li>Cancel anytime policy</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Pricing'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
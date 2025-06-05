import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUserStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Edit2, Trash2, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_interval: 'monthly' | 'yearly';
}

export function MembershipManagerPage() {
  const supabase = useSupabaseClient();
  const { user } = useUserStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTier, setEditingTier] = useState<SubscriptionTier | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    billing_interval: 'monthly' as const
  });

  useEffect(() => {
    if (!user) return;
    loadTiers();
  }, [user]);

  const loadTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('userid', user?.id)
        .order('price', { ascending: true });

      if (error) throw error;
      setTiers(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading tiers',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const price = Math.round(parseFloat(form.price) * 100); // Convert to cents
    if (isNaN(price) || price < 100) { // Minimum $1.00
      toast({
        title: 'Invalid price',
        description: 'Price must be at least $1.00',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTier) {
        const { error } = await supabase
          .from('subscription_tiers')
          .update({
            name: form.name,
            description: form.description,
            price,
            billing_interval: form.billing_interval,
          })
          .eq('id', editingTier.id);

        if (error) throw error;

        toast({
          title: 'Tier updated',
          description: 'Your subscription tier has been updated successfully.',
        });
      } else {
        const { error } = await supabase
          .from('subscription_tiers')
          .insert([{
            userid: user.id,
            name: form.name,
            description: form.description,
            price,
            billing_interval: form.billing_interval,
          }]);

        if (error) throw error;

        toast({
          title: 'Tier created',
          description: 'Your subscription tier has been created successfully.',
        });
      }

      setForm({
        name: '',
        description: '',
        price: '',
        billing_interval: 'monthly'
      });
      setIsCreating(false);
      setEditingTier(null);
      loadTiers();
    } catch (error: any) {
      toast({
        title: 'Error saving tier',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (tier: SubscriptionTier) => {
    setEditingTier(tier);
    setForm({
      name: tier.name,
      description: tier.description,
      price: (tier.price / 100).toString(),
      billing_interval: tier.billing_interval
    });
    setIsCreating(true);
  };

  const handleDelete = async (tierId: string) => {
    if (!confirm('Are you sure you want to delete this tier? All subscribers will lose access.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subscription_tiers')
        .delete()
        .eq('id', tierId);

      if (error) throw error;

      toast({
        title: 'Tier deleted',
        description: 'The subscription tier has been deleted.',
      });

      loadTiers();
    } catch (error: any) {
      toast({
        title: 'Error deleting tier',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Membership Tiers</h1>
            <p className="text-gray-600">
              Create and manage your subscription tiers
            </p>
          </div>
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tier
            </Button>
          )}
        </div>

        {isCreating ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tier Name
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Basic, Pro, Premium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe what subscribers get with this tier"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (USD)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="pl-7"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Interval
                  </label>
                  <select
                    value={form.billing_interval}
                    onChange={(e) => setForm({ ...form, billing_interval: e.target.value as 'monthly' | 'yearly' })}
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingTier(null);
                    setForm({
                      name: '',
                      description: '',
                      price: '',
                      billing_interval: 'monthly'
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingTier ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingTier ? 'Update Tier' : 'Create Tier'
                  )}
                </Button>
              </div>
            </form>
          </div>
        ) : null}

        <div className="space-y-4">
          {tiers.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tiers yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first subscription tier.
              </p>
              <div className="mt-6">
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tier
                </Button>
              </div>
            </div>
          ) : (
            tiers.map((tier) => (
              <div
                key={tier.id}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {tier.name}
                    </h3>
                    <p className="mt-1 text-gray-600">{tier.description}</p>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(tier.price)}
                      </span>
                      <span className="text-gray-500">
                        /{tier.billing_interval === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(tier)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tier.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
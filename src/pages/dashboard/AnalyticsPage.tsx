import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useUserStore } from '@/lib/store';
import { 
  BarChart, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package,
  Loader2 
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  platformFees: number;
}

export function AnalyticsPage() {
  const supabase = useSupabaseClient();
  const { user } = useUserStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchAnalytics();
  }, [user, dateRange, navigate]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      // Pass the user ID directly with the correct parameter name
      const { data, error } = await supabase.rpc('get_dashboard_analytics', { 
        user_id: user.id,
        date_range: dateRange
      });

      if (error) {
        throw error;
      }

      setAnalytics(data as AdminStats);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error loading analytics',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Analytics</h1>
        <p className="text-gray-600">No analytics data available.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <div className="space-x-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                dateRange === range
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <h3 className="text-2xl font-semibold text-gray-900 mt-1">
                {formatCurrency(analytics.totalRevenue)}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <h3 className="text-2xl font-semibold text-gray-900 mt-1">
                {analytics.totalOrders}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <ShoppingCart className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Products</p>
              <h3 className="text-2xl font-semibold text-gray-900 mt-1">
                {analytics.totalProducts}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Platform Fees</p>
              <h3 className="text-2xl font-semibold text-gray-900 mt-1">
                {formatCurrency(analytics.platformFees)}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Revenue Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">
            <p className="text-gray-500">Chart data loading...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
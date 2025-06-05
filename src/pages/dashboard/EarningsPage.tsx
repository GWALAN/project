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
  Loader2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Shield
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface MonthlyEarnings {
  month: string;
  amount: number;
}

interface EarningsSummary {
  totalEarnings: number;
  platformFees: number;
  netEarnings: number;
  totalOrders: number;
  totalProducts: number;
  monthlyEarnings: MonthlyEarnings[];
  topProducts: {
    id: string;
    title: string;
    revenue: number;
    orders: number;
  }[];
}

export function EarningsPage() {
  const supabase = useSupabaseClient();
  const { user } = useUserStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function checkProStatus() {
      const { data } = await supabase
        .from('pro_subscriptions')
        .select('*')
        .eq('userid', user.id)
        .eq('active', true)
        .maybeSingle();
      
      setIsPro(!!data);
    }

    checkProStatus();
  }, [user, supabase]);

  useEffect(() => {
    if (!user) return;

    async function loadEarnings() {
      setIsLoading(true);
      try {
        // Get date range
        const now = new Date();
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const startDate = new Date(now.setDate(now.getDate() - days));

        // Get orders within date range
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            products!inner(
              id,
              title,
              price,
              contenttype,
              creatorid
            )
          `)
          .eq('products.creatorid', user.id)
          .eq('status', 'paid')
          .gte('createdat', startDate.toISOString())
          .order('createdat', { ascending: true });

        if (ordersError) throw ordersError;

        // Calculate earnings
        const summary: EarningsSummary = {
          totalEarnings: 0,
          platformFees: 0,
          netEarnings: 0,
          totalOrders: orders.length,
          totalProducts: 0,
          monthlyEarnings: [],
          topProducts: []
        };

        // Get total products
        const { count: productsCount, error: productsError } = await supabase
          .from('products')
          .select('id', { count: 'exact' })
          .eq('creatorid', user.id);

        if (productsError) throw productsError;
        summary.totalProducts = productsCount || 0;

        // Process orders
        const productStats = new Map<string, { revenue: number; orders: number; title: string }>();
        const monthlyStats = new Map<string, number>();

        orders.forEach(order => {
          const revenue = order.products.price;
          const monthKey = new Date(order.createdat).toISOString().slice(0, 7);
          
          // Update monthly stats
          monthlyStats.set(monthKey, (monthlyStats.get(monthKey) || 0) + revenue);
          
          // Update product stats
          const productStat = productStats.get(order.products.id) || {
            revenue: 0,
            orders: 0,
            title: order.products.title
          };
          productStat.revenue += revenue;
          productStat.orders += 1;
          productStats.set(order.products.id, productStat);
          
          // Update totals
          summary.totalEarnings += revenue;
          summary.platformFees += isPro ? 0 : Math.round(revenue * 0.1); // 10% platform fee for non-pro
        });

        summary.netEarnings = summary.totalEarnings - summary.platformFees;

        // Convert monthly stats to array
        summary.monthlyEarnings = Array.from(monthlyStats.entries())
          .map(([month, amount]) => ({ month, amount }))
          .sort((a, b) => a.month.localeCompare(b.month));

        // Get top products
        summary.topProducts = Array.from(productStats.entries())
          .map(([id, stats]) => ({ id, ...stats }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        setEarnings(summary);
      } catch (error: any) {
        console.error('Error loading earnings:', error);
        toast({
          title: 'Error loading earnings',
          description: 'There was a problem loading your earnings data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadEarnings();
  }, [user, supabase, dateRange, toast, isPro]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!earnings) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">No Earnings Data</h2>
          <p className="text-gray-600 mt-2">Start selling to see your earnings</p>
        </div>
      </div>
    );
  }

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  };

  const previousPeriodEarnings = earnings.monthlyEarnings
    .slice(-2)[0]?.amount || 0;
  const currentPeriodEarnings = earnings.monthlyEarnings
    .slice(-1)[0]?.amount || 0;
  const earningsChange = getPercentageChange(
    currentPeriodEarnings,
    previousPeriodEarnings
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
            <p className="text-gray-600">
              Track your revenue and payment history
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
            <Button
              variant={dateRange === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('7d')}
            >
              7 Days
            </Button>
            <Button
              variant={dateRange === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('30d')}
            >
              30 Days
            </Button>
            <Button
              variant={dateRange === '90d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange('90d')}
            >
              90 Days
            </Button>
          </div>
        </div>

        {!isPro && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-8">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-yellow-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h2 className="font-semibold text-yellow-900">Upgrade to Pro</h2>
                <p className="text-sm text-yellow-800 mb-3">
                  Pay $10/month to remove platform fees and unlock 50GB storage + priority support.
                </p>
                <Button onClick={() => navigate('/subscribe-pro')}>
                  Upgrade Now
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Net Earnings</p>
                <h3 className="text-2xl font-semibold text-gray-900 mt-1">
                  {formatCurrency(earnings.netEarnings)}
                </h3>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {earningsChange > 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm ml-1 ${
                earningsChange > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {Math.abs(earningsChange).toFixed(1)}% from last period
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <h3 className="text-2xl font-semibold text-gray-900 mt-1">
                  {earnings.totalOrders}
                </h3>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <ShoppingCart className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500 ml-1">
                Last {dateRange}
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Platform Fees</p>
                <h3 className="text-2xl font-semibold text-gray-900 mt-1">
                  {formatCurrency(earnings.platformFees)}
                </h3>
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-500">
                {isPro ? 'Pro Plan - No Fees' : '10% of total earnings'}
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Products</p>
                <h3 className="text-2xl font-semibold text-gray-900 mt-1">
                  {earnings.totalProducts}
                </h3>
              </div>
              <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                <Package className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href="/dashboard/products">
                  <Package className="mr-2 h-4 w-4" />
                  Manage Products
                </a>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Revenue Over Time
              </h2>
              <BarChart className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              {earnings.monthlyEarnings.map(month => (
                <div key={month.month} className="flex items-center">
                  <div className="w-24 text-sm text-gray-600">
                    {new Date(month.month).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="flex-1">
                    <div className="h-4 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${(month.amount / earnings.totalEarnings) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-24 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(month.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Top Products
              </h2>
              <Package className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="space-y-6">
              {earnings.topProducts.map(product => (
                <div key={product.id}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{product.title}</h3>
                    <span className="text-sm text-gray-600">
                      {product.orders} orders
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(product.revenue / earnings.totalEarnings) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(product.revenue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
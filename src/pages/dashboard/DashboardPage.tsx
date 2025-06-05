import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Package, ShoppingCart, Settings, PlusCircle, TrendingUp, ExternalLink, Loader2, FileText, Video, Music, Archive, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/lib/store';
import { Product, Order } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export function DashboardPage() {
  const supabase = useSupabaseClient();
  const { user } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return;

      setIsLoading(true);
      try {
        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (productsError) throw productsError;
        setProducts(productsData as Product[]);

        // Fetch recent orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*, product:products(*)')
          .in('product.creator_id', [user.id])
          .order('created_at', { ascending: false })
          .limit(5);

        if (ordersError) throw ordersError;
        setRecentOrders(ordersData as Order[]);

        // Calculate stats
        const { data: statsData, error: statsError } = await supabase
          .from('orders')
          .select('*, product:products(*)')
          .in('product.creator_id', [user.id]);

        if (statsError) throw statsError;

        const totalRevenue = statsData.reduce((sum, order) => sum + (order.product?.price || 0), 0);
        setStats({
          totalProducts: productsData.length,
          totalOrders: statsData.length,
          totalRevenue,
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [supabase, user]);

  const getFileTypeIcon = (product: Product) => {
    if (!product.filetype) return <File className="h-4 w-4 text-gray-400" />;

    switch (product.filetype) {
      case 'application/pdf':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'video/mp4':
      case 'video/quicktime':
        return <Video className="h-4 w-4 text-purple-500" />;
      case 'audio/mpeg':
      case 'audio/wav':
        return <Music className="h-4 w-4 text-green-500" />;
      case 'application/zip':
        return <Archive className="h-4 w-4 text-orange-500" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Manage your products and track your sales
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <Link to={`/u/${user?.username}`} target="_blank">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Profile
            </Button>
          </Link>
                </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="dashboard-card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <Package className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <h3 className="text-2xl font-semibold text-gray-900">{stats.totalProducts}</h3>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-accent/10 text-accent">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <h3 className="text-2xl font-semibold text-gray-900">{stats.totalOrders}</h3>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <h3 className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalRevenue)}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="content-section p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Products</h2>
            <Link to="/dashboard/products" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          
          {products.length > 0 ? (
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="flex items-center p-3 rounded-lg hover:bg-gray-50">
                  <div className="h-12 w-12 rounded-md bg-gray-100 flex-shrink-0 overflow-hidden">
                    {product.previewimageurl ? (
                      <img
                        src={product.previewimageurl}
                        alt={product.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        {getFileTypeIcon(product)}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-grow">
                    <h3 className="text-sm font-medium text-gray-900">{product.title}</h3>
                    <p className="text-sm text-gray-500">{formatCurrency(product.price)}</p>
                  </div>
                  <Link to={`/dashboard/products/${product.id}`}>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You haven't added any products yet</p>
        
            </div>
          )}
        </div>
        
        <div className="content-section p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link to="/dashboard/orders" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          
          {recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center p-3 rounded-lg hover:bg-gray-50">
                  <div className="h-12 w-12 rounded-md bg-gray-100 flex-shrink-0 overflow-hidden">
                    {order.product?.previewimageurl ? (
                      <img
                        src={order.product.previewimageurl}
                        alt={order.product?.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        {getFileTypeIcon(order.product)}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-grow">
                    <h3 className="text-sm font-medium text-gray-900">{order.product?.title}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <span>{formatCurrency(order.product?.price || 0)}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'delivered' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No orders yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
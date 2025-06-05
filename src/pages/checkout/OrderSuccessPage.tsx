import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { ThemeButton } from '@/components/ui/theme-button';
import { AccessManager } from '@/components/checkout/AccessManager';
import { Order, Product, Profile, User, DEFAULT_THEME } from '@/types';
import { formatCurrency } from '@/lib/utils';

export function OrderSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [creator, setCreator] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function loadOrderDetails() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams(location.search);
        const orderId = params.get('orderId');
        
        if (!orderId) {
          navigate('/');
          return;
        }
        
        // Load order details
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();
        
        if (orderError) throw orderError;
        setOrder(orderData);
        
        // Load product details
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', orderData.productid)
          .single();
        
        if (productError) throw productError;
        setProduct(productData);

        // Load creator details
        const { data: creatorData, error: creatorError } = await supabase
          .from('users')
          .select('*')
          .eq('id', productData.creatorid)
          .single();
        
        if (creatorError) throw creatorError;
        setCreator(creatorData);

        // Load profile settings
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('userid', creatorData.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }
        
        if (profileData) {
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error loading order details:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadOrderDetails();
  }, [location, supabase, navigate]);

  const getThemeConfig = () => {
    if (!profile) return DEFAULT_THEME;
    
    if (profile.theme === 'custom') {
      return profile.themeConfig || DEFAULT_THEME;
    }
    
    return DEFAULT_THEME;
  };

  const theme = getThemeConfig();

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!order || !product || !creator) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">
            The order you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/">
            <ThemeButton primary={theme.primary}>Return to Home</ThemeButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-[calc(100vh-64px)]"
      style={{ background: theme.background }}
    >
      <div className="max-w-lg mx-auto px-4 py-12">
        <div 
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: theme.background === '#FFFFFF' ? '#F9FAFB' : '#FFFFFF' }}
        >
          <div className="p-8">
            <div className="text-center mb-6">
              <div 
                className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                style={{ backgroundColor: `${theme.primary}20` }}
              >
                <CheckCircle 
                  className="h-8 w-8"
                  style={{ color: theme.primary }}
                />
              </div>
              <h1 
                className="text-2xl font-bold mb-1"
                style={{ color: theme.text }}
              >
                Thank You!
              </h1>
              <p 
                className="opacity-80"
                style={{ color: theme.text }}
              >
                Your purchase was successful
              </p>
            </div>
            
            <div 
              className="rounded-md p-4 mb-6"
              style={{ backgroundColor: `${theme.primary}10` }}
            >
              <div className="flex items-start">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                  {product.previewimageurl && (
                    <img
                      src={product.previewimageurl}
                      alt={product.title}
                      className="h-full w-full object-cover object-center"
                    />
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <h3 
                    className="text-sm font-medium"
                    style={{ color: theme.text }}
                  >
                    {product.title}
                  </h3>
                  <p 
                    className="mt-1 text-sm opacity-80"
                    style={{ color: theme.text }}
                  >
                    {formatCurrency(product.price)}
                  </p>
                </div>
              </div>
            </div>
            
            <div 
              className="rounded-md p-4 mb-6"
              style={{ backgroundColor: `${theme.primary}10` }}
            >
              <h3 
                className="font-medium mb-2"
                style={{ color: theme.text }}
              >
                Order Details
              </h3>
              <div 
                className="space-y-2 text-sm"
                style={{ color: theme.text }}
              >
                <div className="flex justify-between">
                  <span className="opacity-80">Order ID</span>
                  <span>{order.id.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-80">Date</span>
                  <span>
                    {new Date(order.createdat).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-80">Email</span>
                  <span>{order.buyeremail}</span>
                </div>
              </div>
            </div>
            
            <AccessManager 
              fileUrl={product.fileurl}
              orderId={order.id}
              theme={theme}
            />
            
            <div className="mt-6">
              <ThemeButton 
                primary={theme.primary}
                variant="outline"
                style={theme.buttonStyle}
                className="w-full"
                onClick={() => navigate(`/u/${creator.username}`)}
              >
                Continue Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </ThemeButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { ThemeButton } from '@/components/ui/theme-button';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { CheckoutSummary } from '@/components/checkout/CheckoutSummary';
import { User, Product, Profile, DEFAULT_THEME } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AgeVerificationProps {
  onVerify: () => void;
  onCancel: () => void;
  theme: any;
}

function AgeVerification({ onVerify, onCancel, theme }: AgeVerificationProps) {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4" style={{ color: theme.text }}>
        Age Verification Required
      </h2>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          This product contains mature content and requires age verification to proceed.
        </p>
        
        <div className="space-y-4">
          <label className="flex items-start">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
            />
            <span className="ml-2 text-sm text-gray-600">
              I confirm that I am 18 years of age or older and I understand that this product contains mature content. 
              I agree to comply with all applicable laws and regulations regarding mature content in my jurisdiction.
            </span>
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <ThemeButton
          primary={theme.primary}
          variant="outline"
          style={theme.buttonStyle}
          onClick={onCancel}
        >
          Cancel
        </ThemeButton>
        
        <ThemeButton
          primary={theme.primary}
          variant={theme.buttonVariant}
          style={theme.buttonStyle}
          onClick={onVerify}
          disabled={!isChecked}
        >
          Continue
        </ThemeButton>
      </div>
    </div>
  );
}

export function ProductCheckoutPage() {
  const { productId } = useParams<{ productId: string }>();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [creator, setCreator] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);

  useEffect(() => {
    if (!productId) return;
    
    async function loadProductDetails() {
      setIsLoading(true);
      try {
        // Load product details
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();
        
        if (productError) throw productError;
        
        if (!productData) {
          toast({
            title: 'Product not found',
            description: 'The product you are trying to purchase does not exist.',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }
        
        setProduct(productData);
        
        // Check if age verification is needed
        if (productData.ismaturecontent) {
          setShowAgeVerification(true);
        }
        
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
        console.error('Error loading product details:', error);
        toast({
          title: 'Error loading product',
          description: 'There was a problem loading the product details.',
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadProductDetails();
  }, [productId, supabase, navigate, toast]);

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
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product || !creator) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-600 mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/">
            <ThemeButton primary={theme?.primary || DEFAULT_THEME.primary}>Return to Home</ThemeButton>
          </Link>
        </div>
      </div>
    );
  }

  // Check if creator has connected their Stripe account
  if (!creator.stripeaccountid || creator.stripeaccountstatus !== 'active') {
    return (
      <div 
        className="min-h-[calc(100vh-64px)]"
        style={{ background: theme?.background || DEFAULT_THEME.background }}
      >
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="mb-8">
            <Link to={`/u/${creator.username}`}>
              <ThemeButton
                primary={theme?.primary || DEFAULT_THEME.primary}
                variant="ghost"
                style={theme?.buttonStyle || DEFAULT_THEME.buttonStyle}
                size="sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to {creator.displayName}'s Profile
              </ThemeButton>
            </Link>
          </div>

          <div 
            className="bg-white rounded-lg p-6 text-center"
            style={{ 
              backgroundColor: theme?.background === '#FFFFFF' ? '#F9FAFB' : '#FFFFFF'
            }}
          >
            <AlertCircle 
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: theme?.primary }}
            />
            <h2 
              className="text-xl font-semibold mb-2"
              style={{ color: theme?.text }}
            >
              Purchases Not Available
            </h2>
            <p 
              className="text-gray-600 mb-6"
              style={{ color: theme?.text, opacity: 0.8 }}
            >
              This creator hasn't completed their payment setup yet. Please check back later.
            </p>
            <Link to={`/u/${creator.username}`}>
              <ThemeButton
                primary={theme?.primary || DEFAULT_THEME.primary}
                variant={theme?.buttonVariant || DEFAULT_THEME.buttonVariant}
                style={theme?.buttonStyle || DEFAULT_THEME.buttonStyle}
              >
                Return to Profile
              </ThemeButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (showAgeVerification && !isAgeVerified) {
    return (
      <div 
        className="min-h-[calc(100vh-64px)] flex items-center justify-center"
        style={{ background: theme?.background || DEFAULT_THEME.background }}
      >
        <div className="w-full max-w-2xl mx-4">
          <AgeVerification
            theme={theme}
            onVerify={() => setIsAgeVerified(true)}
            onCancel={() => navigate(`/u/${creator.username}`)}
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-[calc(100vh-64px)]"
      style={{ background: theme?.background || DEFAULT_THEME.background }}
    >
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link to={`/u/${creator.username}`}>
            <ThemeButton
              primary={theme?.primary || DEFAULT_THEME.primary}
              variant="ghost"
              style={theme?.buttonStyle || DEFAULT_THEME.buttonStyle}
              size="sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {creator.displayName}'s Profile
            </ThemeButton>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <CheckoutSummary product={product} theme={theme} />
          </div>

          <div>
            <CheckoutForm productId={product.id} theme={theme} />
          </div>
        </div>
      </div>
    </div>
  );
}
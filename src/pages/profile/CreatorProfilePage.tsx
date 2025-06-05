import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { motion } from 'framer-motion';
import { Lock, Copy, Check } from 'lucide-react';
import { ThemeButton } from '@/components/ui/theme-button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { User, Product, Profile, DEFAULT_THEME } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { SocialLinkButton } from '@/components/ui/social-link-button';
import { useLinkStore } from '@/lib/store';

export function CreatorProfilePage() {
  const { username } = useParams<{ username: string }>();
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [creator, setCreator] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { links, setLinks } = useLinkStore();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadCreatorProfile() {
      if (!username) return;
      
      setIsLoading(true);
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .single();
        
        if (userError) throw userError;
        if (!userData) {
          setError('Creator not found');
          return;
        }
        
        setCreator(userData);
        
        // Load profile image
        if (userData.profileImage) {
          // If it's a full URL, use it directly
          if (userData.profileImage.startsWith('http')) {
            setProfileImageUrl(userData.profileImage);
          } else {
            // Otherwise, get the public URL from Supabase
            const { data } = supabase.storage
              .from('profile-images')
              .getPublicUrl(userData.profileImage);
              
            if (data?.publicUrl) {
              setProfileImageUrl(data.publicUrl);
            } else {
              setProfileImageUrl(userData.profileImage);
            }
          }
        }
        
        // Load products and profile in parallel for better performance
        const [productsResponse, profileResponse] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .eq('owner_uid', userData.id)
            .eq('hidden', false)
            .order('created_at', { ascending: false }),
          supabase
            .from('profiles')
            .select('*')
            .eq('userid', userData.id)
            .maybeSingle()
        ]);

        if (productsResponse.error) throw productsResponse.error;
        setProducts(productsResponse.data);

        if (profileResponse.error && profileResponse.error.code !== 'PGRST116') {
          throw profileResponse.error;
        }
        
        if (profileResponse.data) {
          setProfile(profileResponse.data);
        }

        setLinks(profileResponse.data?.externallinks || []);
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Error loading profile');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadCreatorProfile();
  }, [username, supabase, setLinks]);

  const handleCopyLink = async () => {
    if (!creator) return;
    const url = `${window.location.origin}/u/${creator.username}`;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Link copied',
        description: 'Profile link copied to clipboard',
      });
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please try copying manually',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-semibold mb-2">Profile Not Found</h1>
        <p className="text-gray-600 mb-4">This profile doesn't exist or was removed.</p>
        <Link to="/"><ThemeButton primary={DEFAULT_THEME.primary}>Return Home</ThemeButton></Link>
      </div>
    );
  }

  const theme = profile?.themeconfig || DEFAULT_THEME;

  return (
    <div style={{ background: theme.background }} className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="text-center mb-6">
          {profileImageUrl ? (
            <img 
              src={profileImageUrl}
              alt={creator.displayName}
              className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-white shadow-sm"
              loading="lazy"
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white mx-auto flex items-center justify-center shadow-sm">
              <span className="text-xl font-semibold text-gray-400">
                {creator.displayName ? creator.displayName.charAt(0) : '?'}
              </span>
            </div>
          )}
          
          <h1 className="text-lg font-semibold mt-3 mb-1" style={{ color: theme.text }}>
            {creator.displayName}
          </h1>
          
          <button
            onClick={handleCopyLink}
            className={`inline-flex items-center px-2 py-1 text-xs rounded-full transition-all ${
              copied ? 'bg-green-100 text-green-800' : 'hover:bg-opacity-10'
            }`}
            style={{ 
              backgroundColor: copied ? undefined : `${theme.primary}10`,
              color: copied ? undefined : theme.primary
            }}
          >
            {copied ? (
              <><Check className="h-3 w-3 mr-1" />Copied!</>
            ) : (
              <><Copy className="h-3 w-3 mr-1" />Copy Link</>
            )}
          </button>

          <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: theme.text }}>
            {creator.bio}
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="links" className="w-full">
          <TabsList className="w-full justify-center mb-6">
            <TabsTrigger value="links" className="flex-1">Links</TabsTrigger>
            <TabsTrigger value="shop" className="flex-1">Shop</TabsTrigger>
          </TabsList>

          {/* Links Tab */}
          <TabsContent value="links" className="focus-visible:outline-none">
            {links.length > 0 ? (
              <div className="space-y-2 max-w-xs mx-auto">
                {links.map((link, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <SocialLinkButton {...link} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div 
                className="text-center rounded-lg p-6"
                style={{ 
                  backgroundColor: `${theme.primary}10`,
                  color: theme.text
                }}
              >
                <p className="text-sm opacity-80">No links added yet</p>
              </div>
            )}
          </TabsContent>

          {/* Shop Tab */}
          <TabsContent value="shop" className="focus-visible:outline-none">
            {products.length > 0 ? (
              <div className={`grid gap-3 ${
                profile?.layout === 'list' 
                  ? 'grid-cols-1 max-w-lg mx-auto' 
                  : 'grid-cols-2 sm:grid-cols-3'
              }`}>
                {products.map((product, i) => (
                  <motion.div
                    key={product.id}
                    className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="relative aspect-[4/3]">
                      {product.previewimageurl && (
                        <img
                          src={product.previewimageurl}
                          alt={product.title}
                          className={`h-full w-full object-cover ${
                            product.blurpreview ? 'filter blur-sm' : ''
                          }`}
                          loading="lazy"
                        />
                      )}
                      {product.blurpreview && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Lock className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-2">
                      <h2 className="font-medium text-sm text-gray-900 line-clamp-1">
                        {product.title}
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5 mb-2 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(product.price)}
                        </span>
                        <Link to={`/checkout/${product.id}`}>
                          <ThemeButton
                            primary={theme.primary}
                            variant="outline"
                            size="sm"
                          >
                            Buy
                          </ThemeButton>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div 
                className="text-center rounded-lg p-6"
                style={{ 
                  backgroundColor: `${theme.primary}10`,
                  color: theme.text
                }}
              >
                <p className="text-sm opacity-80">No products available yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
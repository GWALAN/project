import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Lock, Loader2, Download, ExternalLink, MessageSquare, CalendarClock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types';

export default function ContentAccessPage() {
  const { id } = useParams();
  const user = useUser();
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    async function fetchContent() {
      if (!id) return;
      
      try {
        setIsLoading(true);

        // Get product details with creator info
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select(`
            *,
            creator:users!inner(
              id,
              displayName,
              username
            )
          `)
          .eq('id', id)
          .single();

        if (productError) throw productError;
        if (!productData) {
          toast({
            title: 'Content not found',
            description: 'This content may have been removed.',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        setProduct(productData);

        // Check access
        if (productData.creatorid === user.id) {
          setHasAccess(true);
        } else {
          const { data: orderData } = await supabase
            .from('orders')
            .select('*')
            .eq('productid', id)
            .eq('buyeremail', user.email)
            .eq('status', 'paid')
            .maybeSingle();

          if (orderData) {
            setOrder(orderData);
            setHasAccess(true);

            // Send receipt email if not already sent
            if (!emailSent) {
              await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-receipt-email`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify({
                  to: user.email,
                  productTitle: productData.title,
                  contentLink: window.location.href,
                  orderDetails: {
                    id: orderData.id,
                    amount: productData.price
                  }
                })
              });
              setEmailSent(true);
            }
          }
        }
      } catch (error: any) {
        console.error('Error fetching content:', error);
        toast({
          title: 'Error loading content',
          description: error.message,
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, [id, user, supabase, navigate, toast, emailSent]);

  const generateDownloadUrl = async () => {
    if (!product || !product.fileurl || !user) return;
    
    try {
      setIsGeneratingUrl(true);
      
      // Get session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to download this file',
          variant: 'destructive',
        });
        return;
      }
      
      // Call the secure download edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-secure-download`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId: product.id })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate download URL');
      }
      
      const data = await response.json();
      setDownloadUrl(data.url);
    } catch (error: any) {
      console.error('Error generating download URL:', error);
      toast({
        title: 'Download error',
        description: error.message || 'Failed to generate download URL',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingUrl(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-semibold mb-2">Content Not Found</h1>
        <p className="text-gray-600 mb-4">This content doesn't exist or was removed.</p>
        <Link to="/"><Button>Return Home</Button></Link>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4">
        <Lock className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Required</h2>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          You need to purchase this content to access it.
        </p>
        <Link to={`/u/${product.creator.username}`}>
          <Button>
            View Creator's Profile
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
            <Link to={`/u/${product.creator.username}`}>
              <Button variant="outline" size="sm">
                More from {product.creator.displayName}
              </Button>
            </Link>
          </div>

          <div className="space-y-6">
            {product.contenttype === 'video' && (
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <video controls className="w-full h-full">
                  <source src={downloadUrl || ''} type="video/mp4" />
                  Your browser does not support video playback.
                </video>
              </div>
            )}

            {product.contenttype === 'audio' && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <audio controls className="w-full">
                  <source src={downloadUrl || ''} type="audio/mpeg" />
                  Your browser does not support audio playback.
                </audio>
              </div>
            )}

            {product.contenttype === 'digital_product' && product.fileurl && (
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold mb-2">Download Your Purchase</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {downloadUrl ? 'Your download is ready. This link will expire in 1 hour.' : 'Generate a secure download link for your purchase.'}
                </p>
                {downloadUrl ? (
                  <Button asChild>
                    <a href={downloadUrl} download>
                      <Download className="mr-2 h-4 w-4" />
                      Download File
                    </a>
                  </Button>
                ) : (
                  <Button onClick={generateDownloadUrl} disabled={isGeneratingUrl}>
                    {isGeneratingUrl ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Link...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Generate Download Link
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {product.contenttype === 'image' && product.fileurl && (
              <img 
                src={downloadUrl || ''} 
                alt={product.title} 
                className="rounded-lg max-w-full mx-auto"
              />
            )}

            {product.contenttype === 'blog' && (
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}

            {product.contenttype === 'chat' && (
              <div className="bg-blue-50 p-6 rounded-lg flex items-start space-x-4">
                <MessageSquare className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900">Chat Session Access</h3>
                  <p className="text-blue-800 mt-1">
                    The creator will contact you shortly to schedule your chat session.
                  </p>
                </div>
              </div>
            )}

            {product.contenttype === 'booking' && (
              <div className="bg-purple-50 p-6 rounded-lg flex items-start space-x-4">
                <CalendarClock className="h-6 w-6 text-purple-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-purple-900">Booking Confirmation</h3>
                  <p className="text-purple-800 mt-1">
                    The creator will reach out to schedule your session.
                  </p>
                </div>
              </div>
            )}

            <div className="prose max-w-none mt-6">
              <h2 className="text-lg font-semibold">About this {product.contenttype}</h2>
              <p className="text-gray-600">{product.description}</p>
            </div>

            {order && (
              <div className="border-t pt-4 mt-8">
                <p className="text-sm text-gray-500">
                  Order #{order.id.substring(0, 8)} • Purchased on {formatDate(order.createdat)} • {formatCurrency(product.price)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { ContentAccessPage }
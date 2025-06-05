import React, { useEffect, useState } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, FileText, Video, Music, Image, MessageSquare, CalendarClock, Receipt, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface Purchase {
  id: string;
  productid: string;
  status: string;
  createdat: string;
  product: Product;
}

interface RefundRequest {
  id: string;
  orderid: string;
  status: string;
  reason: string;
  createdat: string;
}

export default function MyPurchasesPage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [refundRequests, setRefundRequests] = useState<Record<string, RefundRequest>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    async function fetchPurchases() {
      try {
        // Fetch orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            productid,
            status,
            createdat,
            product:products(
              id,
              title,
              description,
              price,
              contenttype,
              previewimageurl,
              creator:users!inner(
                displayName,
                username
              )
            )
          `)
          .eq('buyeremail', user.email)
          .eq('status', 'paid')
          .order('createdat', { ascending: false });

        if (ordersError) throw ordersError;
        setPurchases(ordersData || []);

        // Fetch existing refund requests
        if (ordersData && ordersData.length > 0) {
          const orderIds = ordersData.map(order => order.id);
          
          const { data: refundData, error: refundError } = await supabase
            .from('refund_requests')
            .select('*')
            .in('orderid', orderIds);

          if (refundError) throw refundError;
          
          // Create a map of order ID to refund request
          const refundMap: Record<string, RefundRequest> = {};
          refundData?.forEach(refund => {
            refundMap[refund.orderid] = refund;
          });
          
          setRefundRequests(refundMap);
        }
      } catch (error: any) {
        console.error('Error fetching purchases:', error);
        toast({
          title: 'Error loading purchases',
          description: 'There was a problem loading your purchases.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchPurchases();
  }, [user, supabase, navigate, toast]);

  const handleRefundRequest = async () => {
    if (!selectedOrder || !refundReason.trim()) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('refund_requests')
        .insert({
          orderid: selectedOrder,
          userid: user?.id,
          reason: refundReason.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setRefundRequests(prev => ({
        ...prev,
        [selectedOrder]: data
      }));

      toast({
        title: 'Refund request submitted',
        description: 'We will review your request and get back to you soon.',
      });

      setSelectedOrder(null);
      setRefundReason('');
    } catch (error: any) {
      toast({
        title: 'Error submitting refund request',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return <Video className="h-5 w-5 text-purple-500" />;
      case 'audio':
        return <Music className="h-5 w-5 text-green-500" />;
      case 'digital_product':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'image':
        return <Image className="h-5 w-5 text-pink-500" />;
      case 'chat':
        return <MessageSquare className="h-5 w-5 text-orange-500" />;
      case 'booking':
        return <CalendarClock className="h-5 w-5 text-cyan-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRefundStatus = (orderId: string) => {
    const refund = refundRequests[orderId];
    if (!refund) return null;

    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      processing: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[refund.status as keyof typeof statusColors] || statusColors.pending}`}>
        Refund {refund.status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Purchases</h1>

          {purchases.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-2">No purchases yet</h2>
              <p className="text-gray-600 mb-6">
                When you buy content from creators, it will appear here.
              </p>
              <Link
                to="/"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Discover Creators
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="grid gap-6 p-6">
                {purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-4 p-4 rounded-lg border border-gray-100 hover:border-primary/20 hover:bg-gray-50 transition-colors"
                  >
                    <Link
                      to={`/content/${purchase.product.id}`}
                      className="flex-1 flex items-start space-x-4"
                    >
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        {purchase.product.previewimageurl ? (
                          <img
                            src={purchase.product.previewimageurl}
                            alt={purchase.product.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-100">
                            {getContentIcon(purchase.product.contenttype)}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {purchase.product.title}
                          </h3>
                          {getContentIcon(purchase.product.contenttype)}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          by {purchase.product.creator.displayName}
                        </p>
                        <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                          <span>{formatCurrency(purchase.product.price)}</span>
                          <span>•</span>
                          <span>Purchased {formatDate(purchase.createdat)}</span>
                        </div>
                      </div>
                    </Link>

                    <div className="flex flex-col md:items-end space-y-2">
                      {getRefundStatus(purchase.id) && (
                        <div className="mb-2">
                          {getRefundStatus(purchase.id)}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          asChild
                        >
                          <Link to={`/invoice/${purchase.id}`}>
                            <Receipt className="h-3 w-3 mr-1" />
                            Invoice
                          </Link>
                        </Button>
                        
                        {!refundRequests[purchase.id] && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs text-red-600 hover:text-red-700"
                            onClick={() => setSelectedOrder(purchase.id)}
                          >
                            Request Refund
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Refund</DialogTitle>
            <DialogDescription>
              Please explain why you would like a refund. We will review your request and respond within 2 business days.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-yellow-50 p-4 rounded-md mb-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium">Important information:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Refunds are only available within 14 days of purchase</li>
                  <li>Digital products that have been downloaded may not be eligible for refund</li>
                  <li>Provide specific details about why you're requesting a refund</li>
                </ul>
              </div>
            </div>
          </div>

          <Textarea
            placeholder="Enter your reason for requesting a refund..."
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            className="min-h-[100px]"
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedOrder(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRefundRequest}
              disabled={!refundReason.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { MyPurchasesPage }
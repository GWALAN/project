import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Check, X, Loader2, AlertTriangle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

interface RefundRequest {
  id: string;
  orderid: string;
  userid: string;
  reason: string;
  status: string;
  createdat: string;
  updatedat: string;
  order: {
    id: string;
    productid: string;
    buyeremail: string;
    status: string;
    createdat: string;
    product: {
      id: string;
      title: string;
      price: number;
      creatorid: string;
      creator: {
        displayName: string;
        email: string;
      }
    }
  }
  user: {
    email: string;
    displayName: string;
  }
}

export function RefundRequestsManager() {
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadRefundRequests();
  }, []);

  const loadRefundRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('refund_requests')
        .select(`
          *,
          order:orders(
            id,
            productid,
            buyeremail,
            status,
            createdat,
            product:products(
              id,
              title,
              price,
              creatorid,
              creator:users!inner(
                displayName,
                email
              )
            )
          ),
          user:users(
            email,
            displayName
          )
        `)
        .order('createdat', { ascending: false });

      if (error) throw error;
      setRefundRequests(data || []);
    } catch (error: any) {
      console.error('Error loading refund requests:', error);
      toast({
        title: 'Error loading refund requests',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setIsProcessing(prev => ({ ...prev, [id]: true }));
    try {
      const { error } = await supabase
        .from('refund_requests')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setRefundRequests(prev => 
        prev.map(request => 
          request.id === id ? { ...request, status } : request
        )
      );

      // If approved, process the refund
      if (status === 'approved') {
        // In a real app, you would call a secure edge function to process the refund
        // For now, we'll just show a toast
        toast({
          title: 'Refund approved',
          description: 'The refund has been approved and will be processed.',
        });
      } else {
        toast({
          title: 'Refund request updated',
          description: `The refund request has been ${status}.`,
        });
      }
    } catch (error: any) {
      console.error('Error updating refund request:', error);
      toast({
        title: 'Error updating refund request',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(prev => ({ ...prev, [id]: false }));
    }
  };

  const filteredRequests = refundRequests.filter(request => {
    const searchLower = searchQuery.toLowerCase();
    return (
      request.order.buyeremail.toLowerCase().includes(searchLower) ||
      request.order.product.title.toLowerCase().includes(searchLower) ||
      request.reason.toLowerCase().includes(searchLower) ||
      request.status.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Refund Requests</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No refund requests found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? 'Try adjusting your search query' : 'There are no pending refund requests at this time'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.order.product.title}</div>
                      <div className="text-sm text-gray-500">{request.orderid.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.order.buyeremail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{request.reason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.createdat)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        request.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : request.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {request.status === 'pending' && (
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleUpdateStatus(request.id, 'approved')}
                            disabled={isProcessing[request.id]}
                          >
                            {isProcessing[request.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleUpdateStatus(request.id, 'rejected')}
                            disabled={isProcessing[request.id]}
                          >
                            {isProcessing[request.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
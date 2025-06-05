import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Loader2, ArrowLeft, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function InvoicePage() {
  const { id } = useParams();
  const user = useUser();
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoice() {
      if (!id || !user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            product:products(
              id,
              title,
              description,
              price,
              contenttype,
              creator:users!inner(
                displayName,
                email
              )
            )
          `)
          .eq('id', id)
          .eq('buyeremail', user.email)
          .single();

        if (error) throw error;
        if (!data) {
          toast({
            title: 'Invoice not found',
            description: 'This invoice does not exist or you do not have access to it.',
            variant: 'destructive',
          });
          return;
        }

        setInvoice(data);
      } catch (error: any) {
        console.error('Error fetching invoice:', error);
        toast({
          title: 'Error loading invoice',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvoice();
  }, [id, user, supabase, toast]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invoice Not Found</h1>
          <p className="text-gray-600 mb-6">
            This invoice does not exist or you do not have access to it.
          </p>
          <Link to="/purchases">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Purchases
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link to="/purchases">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Purchases
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
              <p className="text-sm text-gray-600">Order #{invoice.id.substring(0, 8)}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <FileText className="mr-2 h-4 w-4" />
              Print Invoice
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">From</h3>
              <p className="text-sm">{invoice.product.creator.displayName}</p>
              <p className="text-sm text-gray-600">{invoice.product.creator.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">To</h3>
              <p className="text-sm">{user.email}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 py-8">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="pb-4 text-sm font-medium text-gray-500">Description</th>
                  <th className="pb-4 text-sm font-medium text-gray-500 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-4">
                    <p className="text-sm font-medium text-gray-900">{invoice.product.title}</p>
                    <p className="text-sm text-gray-600">{invoice.product.description}</p>
                  </td>
                  <td className="py-4 text-sm text-right">{formatCurrency(invoice.product.price)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td className="pt-4 text-sm font-medium text-gray-900">Total</td>
                  <td className="pt-4 text-sm font-medium text-gray-900 text-right">
                    {formatCurrency(invoice.product.price)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <div className="text-sm text-gray-600">
              <p><strong>Order Date:</strong> {formatDate(invoice.createdat)}</p>
              <p><strong>Payment Status:</strong> {invoice.status}</p>
              <p><strong>Payment Method:</strong> {invoice.paypalorderid ? 'PayPal' : 'Credit Card'}</p>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-500">
            <p>This is an automatically generated invoice.</p>
            <p>For questions about this purchase, please contact the creator directly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { InvoicePage }
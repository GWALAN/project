import React from 'react';
import { Product, ThemeConfig } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface CheckoutSummaryProps {
  product: Product;
  theme: ThemeConfig;
}

export function CheckoutSummary({ product, theme }: CheckoutSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-4">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
          {product.previewimageurl && (
            <img
              src={product.previewimageurl}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <h3 
            className="text-lg font-semibold"
            style={{ color: theme.text }}
          >
            {product.title}
          </h3>
          <p 
            className="text-sm opacity-80"
            style={{ color: theme.text }}
          >
            {product.description}
          </p>
        </div>
      </div>

      <div 
        className="rounded-lg p-4"
        style={{ backgroundColor: `${theme.primary}10` }}
      >
        <div className="space-y-2">
          <div className="flex justify-between">
            <span 
              className="text-sm"
              style={{ color: theme.text }}
            >
              Subtotal
            </span>
            <span 
              className="font-medium"
              style={{ color: theme.text }}
            >
              {formatCurrency(product.price)}
            </span>
          </div>
          <div className="flex justify-between">
            <span 
              className="text-sm"
              style={{ color: theme.text }}
            >
              Platform Fee
            </span>
            <span 
              className="font-medium"
              style={{ color: theme.text }}
            >
              Included
            </span>
          </div>
          <div className="pt-2 border-t" style={{ borderColor: `${theme.primary}20` }}>
            <div className="flex justify-between">
              <span 
                className="font-medium"
                style={{ color: theme.text }}
              >
                Total
              </span>
              <span 
                className="font-bold"
                style={{ color: theme.text }}
              >
                {formatCurrency(product.price)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { ButtonPreview } from '@/components/ui/button-preview';

export function ButtonPreviewPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Button Styles</h1>
          <p className="text-gray-600">
            A comprehensive showcase of all available button styles and variants
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <ButtonPreview />
        </div>
      </div>
    </div>
  );
}
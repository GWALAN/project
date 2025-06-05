import React from 'react';
import { CONTENT_TYPE_LABELS, CONTENT_TYPE_ICONS, ContentType } from '@/types';

interface ContentTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function ContentTypeSelector({ value, onChange, error }: ContentTypeSelectorProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <option value="" disabled>Select Content Type before uploading</option>
        {Object.entries(CONTENT_TYPE_LABELS).map(([type, label]) => {
          const Icon = CONTENT_TYPE_ICONS[type as ContentType];
          return (
            <option key={type} value={type} className="flex items-center">
              {label}
            </option>
          );
        })}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        {value && CONTENT_TYPE_ICONS[value as ContentType] && React.createElement(CONTENT_TYPE_ICONS[value as ContentType], {
          className: "h-4 w-4 text-gray-500"
        })}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
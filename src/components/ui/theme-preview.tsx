import React from 'react';
import { ThemeConfig, DEFAULT_THEME } from '@/types';

interface ThemePreviewProps {
  theme?: ThemeConfig;
  className?: string;
}

export function ThemePreview({ theme, className }: ThemePreviewProps) {
  const previewTheme = theme || DEFAULT_THEME;

  return (
    <div 
      className={`flex flex-col items-center rounded-lg overflow-hidden shadow-sm ${className}`}
      style={{ background: previewTheme.background }}
    >
      <div 
        className="w-full h-12 rounded-lg"
        style={{ backgroundColor: `${previewTheme.primary}10` }}
      />
    </div>
  );
}
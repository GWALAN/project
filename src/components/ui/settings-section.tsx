import React from 'react';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <div className="mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <div className="bg-[#E5E7EB] rounded-lg border border-[#E0E0E0] shadow-[0px_2px_4px_rgba(0,0,0,0.05)] p-6">
        {children}
      </div>
    </div>
  );
}
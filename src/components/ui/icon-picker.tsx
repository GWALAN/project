import React from 'react';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  // Priority icons that should appear first
  const priorityIcons = [
    'Globe', 'Twitter', 'Instagram', 'Facebook', 'Youtube', 'Twitch',
    'Github', 'Linkedin', 'MessageCircle', 'Phone', 'Mail', 'Link',
    'Store', 'ShoppingBag', 'Gift', 'Heart', 'Star', 'Award'
  ];

  // Common category icons
  const categoryIcons = [
    'Music', 'Video', 'Image', 'Camera', 'Film', 'Tv', 'Radio',
    'Newspaper', 'Book', 'Bookmark', 'FileText', 'Files', 'Folder',
    'Podcast', 'Mic', 'Headphones', 'Speaker', 'Volume2',
    'Gamepad', 'Dice', 'Puzzle', 'Target', 'Crosshair',
    'Palette', 'Brush', 'PenTool', 'Pencil', 'Edit', 'Scissors',
    'Code', 'Terminal', 'Command', 'Server', 'Database',
    'Coffee', 'Beer', 'Wine', 'Pizza', 'Utensils',
    'Home', 'Building', 'Landmark', 'Map', 'Navigation',
    'Car', 'Plane', 'Train', 'Bus', 'Bike',
    'User', 'Users', 'UserPlus', 'UserCheck', 'UserX',
    'Brain', 'Glasses', 'Eye', 'Lightbulb', 'Zap',
    'Sun', 'Moon', 'Cloud', 'CloudRain', 'CloudSnow',
    'Flower2', 'Tree', 'Leaf', 'Plant', 'Seedling',
    'Dog', 'Cat', 'Bird', 'Fish', 'Bug',
    'Crown', 'Diamond', 'Gem', 'Medal', 'Trophy',
    'Wallet', 'CreditCard', 'DollarSign', 'Coins', 'Banknote',
    'Calendar', 'Clock', 'Timer', 'Alarm', 'Watch',
    'Smile', 'Laugh', 'Heart', 'ThumbsUp', 'ThumbsDown',
    'Flame', 'Fire', 'Rocket', 'Sparkles', 'Magic',
    'Compass', 'Map', 'Globe2', 'Navigation', 'Route'
  ];

  // Get remaining icons, excluding duplicates
  const remainingIcons = Object.keys(Icons)
    .filter(key => 
      typeof Icons[key as keyof typeof Icons] === 'function' && 
      key !== 'createLucideIcon' &&
      !priorityIcons.includes(key) &&
      !categoryIcons.includes(key)
    );

  // Create a Set to ensure unique icons
  const uniqueIcons = Array.from(new Set([...priorityIcons, ...categoryIcons, ...remainingIcons]));

  return (
    <div className="space-y-4">
      {/* Selected Icon Preview */}
      {value && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
          {React.createElement(Icons[value as keyof typeof Icons], {
            className: "h-5 w-5 text-gray-600"
          })}
          <span className="text-sm text-gray-600">{value}</span>
        </div>
      )}

      {/* Icon Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 p-4 bg-gray-100 rounded-lg max-h-[240px] overflow-y-auto">
        {uniqueIcons.map((iconName) => {
          const Icon = Icons[iconName as keyof typeof Icons] as React.FC<{ className?: string }>;
          if (!Icon) return null;
          
          const isSelected = value === iconName;
          
          return (
            <button
              key={iconName}
              type="button"
              onClick={() => onChange(iconName)}
              className={cn(
                'flex items-center justify-center p-2 rounded-lg border bg-white transition-all',
                'hover:border-primary hover:bg-primary/5',
                isSelected 
                  ? 'border-primary ring-2 ring-primary/20 scale-105' 
                  : 'border-gray-200'
              )}
              title={iconName}
            >
              <Icon 
                className={cn(
                  'h-5 w-5 transition-colors',
                  isSelected ? 'text-primary' : 'text-gray-600'
                )} 
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
import React from 'react';
import { Button } from './button';

interface ButtonStyleSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const BUTTON_CATEGORIES = [
  { id: 'default', label: 'Default' },
  { id: 'gradient', label: 'Gradient' },
  { id: 'duotone', label: 'Duotone' },
  { id: 'shadow', label: 'Shadow' }
] as const;

const BUTTON_STYLES = {
  default: [
    { value: 'default', label: 'Default' },
    { value: 'alternative', label: 'Alternative' },
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
    { value: 'green', label: 'Green' },
    { value: 'red', label: 'Red' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'purple', label: 'Purple' },
    { value: 'indigo', label: 'Indigo' },
    { value: 'orange', label: 'Orange' }
  ],
  gradient: [
    { value: 'gradient-blue', label: 'Blue' },
    { value: 'gradient-green', label: 'Green' },
    { value: 'gradient-red', label: 'Red' },
    { value: 'gradient-yellow', label: 'Yellow' },
    { value: 'gradient-purple', label: 'Purple' },
    { value: 'gradient-indigo', label: 'Indigo' },
    { value: 'gradient-pink', label: 'Pink' },
    { value: 'gradient-orange', label: 'Orange' }
  ],
  duotone: [
    { value: 'gradient-purple-blue', label: 'Purple to Blue' },
    { value: 'gradient-cyan-blue', label: 'Cyan to Blue' },
    { value: 'gradient-green-blue', label: 'Green to Blue' },
    { value: 'gradient-purple-pink', label: 'Purple to Pink' },
    { value: 'gradient-pink-orange', label: 'Pink to Orange' },
    { value: 'gradient-teal-lime', label: 'Teal to Lime' },
    { value: 'gradient-red-yellow', label: 'Red to Yellow' }
  ],
  shadow: [
    { value: 'shadow-blue', label: 'Blue' },
    { value: 'shadow-green', label: 'Green' },
    { value: 'shadow-red', label: 'Red' },
    { value: 'shadow-yellow', label: 'Yellow' },
    { value: 'shadow-purple', label: 'Purple' },
    { value: 'shadow-indigo', label: 'Indigo' },
    { value: 'shadow-pink', label: 'Pink' },
    { value: 'shadow-orange', label: 'Orange' }
  ]
};

export function ButtonStyleSelector({ value, onChange }: ButtonStyleSelectorProps) {
  // Find the category that contains the current value
  const findCategory = (value: string) => {
    for (const [category, styles] of Object.entries(BUTTON_STYLES)) {
      if (styles.some(style => style.value === value)) {
        return category;
      }
    }
    return 'default';
  };

  const [selectedCategory, setSelectedCategory] = React.useState(findCategory(value));

  // Update category when value changes externally
  React.useEffect(() => {
    const newCategory = findCategory(value);
    if (newCategory !== selectedCategory) {
      setSelectedCategory(newCategory);
    }
  }, [value]);

  return (
    <div className="space-y-4">
      {/* Category Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {BUTTON_CATEGORIES.map(category => (
          <Button
            key={category.id}
            type="button"
            variant={selectedCategory === category.id ? 'default' : 'light'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="whitespace-nowrap"
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* Button Style Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[240px] overflow-y-auto p-4 bg-gray-100 rounded-lg scrollbar-hide">
        {BUTTON_STYLES[selectedCategory as keyof typeof BUTTON_STYLES].map(style => {
          const isSelected = value === style.value;
          return (
            <Button
              key={style.value}
              type="button"
              variant={style.value as any}
              size="sm"
              className={`w-full ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              onClick={() => onChange(style.value)}
            >
              {style.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
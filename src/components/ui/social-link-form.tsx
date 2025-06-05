import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from './button';
import { Input } from './input';
import { IconPicker } from './icon-picker';
import { ButtonStyleSelector } from './button-style-selector';
import { Loader2, Sun, Moon, Globe } from 'lucide-react';
import * as Icons from 'lucide-react';
import { buttonVariants } from './button';
import { cn } from '@/lib/utils';

interface SocialLinkFormValues {
  title: string;
  url: string;
  icon: string;
  buttonStyle: string;
}

interface SocialLinkFormProps {
  initialValues?: Partial<SocialLinkFormValues>;
  onSubmit: (data: SocialLinkFormValues) => void;
  onCancel: () => void;
}

export function SocialLinkForm({ initialValues, onSubmit, onCancel }: SocialLinkFormProps) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<SocialLinkFormValues>({
    defaultValues: {
      icon: 'Globe',
      buttonStyle: 'default',
      ...initialValues,
    },
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const selectedIcon = watch('icon');
  const selectedStyle = watch('buttonStyle');
  const title = watch('title');

  const handleFormSubmit = async (data: SocialLinkFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the icon component
  const Icon = (Icons[selectedIcon as keyof typeof Icons] || Globe) as React.FC<{ className?: string }>;

  return (
    <div className="space-y-6">
      {/* Live Preview */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Live Preview
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        {/* ✅ Fixed Template Literal Formatting */}
        <div
          className={
            `p-4 rounded-lg transition-colors ${
              isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
            }`
          }
        >
          <div
            className={cn(
              buttonVariants({ variant: selectedStyle as any }),
              'w-full justify-center gap-2'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{title || "Preview Button"}</span>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Link Title
          </label>
          <Input
            {...register('title', { required: 'Title is required' })}
            placeholder="e.g. Twitter, Instagram, My Website"
            className="bg-gray-50 border-gray-200"
            disabled={isSubmitting}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL
          </label>
          <Input
            {...register('url', {
              required: 'URL is required',
              pattern: {
                value: /^https?:\/\/.+/,
                message: 'Please enter a valid URL',
              },
            })}
            placeholder="https://example.com"
            className="bg-gray-50 border-gray-200"
            disabled={isSubmitting}
          />
          {errors.url && (
            <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Icon
          </label>
          <IconPicker
            value={selectedIcon}
            onChange={(value) => setValue('icon', value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Button Style
          </label>
          <ButtonStyleSelector
            value={selectedStyle}
            onChange={(value) => setValue('buttonStyle', value)}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit(handleFormSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {initialValues ? 'Saving...' : 'Adding...'}
            </>
          ) : (
            initialValues ? 'Save Changes' : 'Add Link'
          )}
        </Button>
      </div>
    </div>
  );
}

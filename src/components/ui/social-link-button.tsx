import React from 'react';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from './button';

interface SocialLinkButtonProps {
  url: string;
  title: string;
  icon: string;
  buttonStyle: string;
}

export function SocialLinkButton({
  url,
  title,
  icon = 'Globe',
  buttonStyle = 'default',
}: SocialLinkButtonProps) {
  // Get the icon component, fallback to Globe if not found
  const Icon = (Icons[icon as keyof typeof Icons] || Icons.Globe) as React.FC<{ className?: string }>;

  // Ensure URL has proper protocol
  const getFormattedUrl = (url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  return (
    <a
      href={getFormattedUrl(url)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        buttonVariants({ variant: buttonStyle as any }),
        'w-full justify-center gap-2'
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{title}</span>
    </a>
  );
}

import React from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Lock, Download, ExternalLink, Loader2 } from 'lucide-react';
import { ThemeButton } from '@/components/ui/theme-button';
import { ThemeConfig } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AccessManagerProps {
  fileUrl: string | null;
  orderId: string;
  theme: ThemeConfig;
}

export function AccessManager({ fileUrl, orderId, theme }: AccessManagerProps) {
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const generateDownloadUrl = async () => {
    if (!fileUrl) return;

    try {
      setIsLoading(true);
      
      // Extract product ID from file URL or use a different approach if needed
      const urlParts = fileUrl.split('/');
      const productId = urlParts[urlParts.length - 2]; // Adjust based on your URL structure
      
      // Get session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to download this file',
          variant: 'destructive',
        });
        return;
      }
      
      // Call the secure download edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-secure-download`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate download URL');
      }
      
      const data = await response.json();
      setDownloadUrl(data.url);
    } catch (error: any) {
      console.error('Error generating download URL:', error);
      toast({
        title: 'Download error',
        description: error.message || 'Failed to generate download URL',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (fileUrl) {
      generateDownloadUrl();
    }
  }, [fileUrl]);

  if (!fileUrl) {
    return (
      <div 
        className="rounded-lg p-4 text-center"
        style={{ backgroundColor: `${theme.primary}10` }}
      >
        <Lock className="mx-auto h-8 w-8 mb-2" style={{ color: theme.primary }} />
        <p 
          className="text-sm font-medium mb-1"
          style={{ color: theme.text }}
        >
          Content Not Available
        </p>
        <p 
          className="text-sm opacity-80"
          style={{ color: theme.text }}
        >
          The creator will contact you with access details.
        </p>
      </div>
    );
  }

  return (
    <div 
      className="rounded-lg p-4"
      style={{ backgroundColor: `${theme.primary}10` }}
    >
      <div className="text-center mb-4">
        <Download 
          className="mx-auto h-8 w-8 mb-2" 
          style={{ color: theme.primary }}
        />
        <p 
          className="text-sm font-medium mb-1"
          style={{ color: theme.text }}
        >
          Your Download is Ready
        </p>
        <p 
          className="text-sm opacity-80"
          style={{ color: theme.text }}
        >
          Click the button below to download your purchase
        </p>
      </div>

      <div className="space-y-2">
        <ThemeButton
          primary={theme.primary}
          variant={theme.buttonVariant}
          style={theme.buttonStyle}
          className="w-full"
          disabled={isLoading || !downloadUrl}
          asChild={!!downloadUrl}
        >
          {downloadUrl ? (
            <a 
              href={downloadUrl} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Now
            </a>
          ) : (
            <button onClick={generateDownloadUrl}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preparing Download...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate Download Link
                </>
              )}
            </button>
          )}
        </ThemeButton>

        <p 
          className="text-xs text-center opacity-60"
          style={{ color: theme.text }}
        >
          Download link expires in 1 hour
        </p>
      </div>
    </div>
  );
}
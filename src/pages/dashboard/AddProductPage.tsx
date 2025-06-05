import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ContentTypeSelector } from '@/components/ui/content-type-selector';
import { useUserStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { FileUploader } from '@/components/upload/FileUploader';
import { generateSecureFilePath, sanitizeFileName } from '@/lib/utils';

interface ProductFormValues {
  title: string;
  description: string;
  price: string;
  contentType: string;
  blurPreview: boolean;
  isMatureContent: boolean;
  acceptTerms: boolean;
  articleBody?: string;
  deliveryInstructions?: string;
  sessionDuration?: number;
  bookingLink?: string;
}

const FILE_BASED_TYPES = ['video', 'audio', 'digital_product', 'image'];
const needsFile = (type?: string) => FILE_BASED_TYPES.includes(type || '');

export function AddProductPage() {
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<File | null>(null);
  
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ProductFormValues>({
    defaultValues: {
      contentType: '',
      blurPreview: false,
      isMatureContent: false,
      acceptTerms: false,
    }
  });

  const contentType = watch('contentType');

  const onSubmit = async (data: ProductFormValues) => {
    if (!user) {
      toast({
        title: 'Authentication error',
        description: 'You must be logged in to add a product.',
        variant: 'destructive',
      });
      return;
    }

    // Validate required files based on content type
    if (needsFile(contentType)) {
      if (!previewImage) {
        toast({
          title: 'Missing preview image',
          description: 'Please upload a preview image for your product.',
          variant: 'destructive',
        });
        return;
      }

      if (!productFile) {
        toast({
          title: 'Missing product file',
          description: 'Please upload your product file.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let fileUrl = null;
      let previewUrl = null;
      
      // Upload preview image if provided
      if (previewImage) {
        const filePath = generateSecureFilePath(user.id, previewImage.name);
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, previewImage, {
            contentType: previewImage.type,
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('Preview image upload error:', uploadError);
          throw new Error('Failed to upload preview image: ' + uploadError.message);
        }
        
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
        
        previewUrl = urlData.publicUrl;
      }
      
      // Upload product file if provided
      if (productFile) {
        const filePath = generateSecureFilePath(user.id, productFile.name);
        
        const { error: uploadError } = await supabase.storage
          .from('product-files')
          .upload(filePath, productFile, {
            contentType: productFile.type,
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('Product file upload error:', uploadError);
          throw new Error('Failed to upload product file: ' + uploadError.message);
        }
        
        const { data: urlData } = supabase.storage
          .from('product-files')
          .getPublicUrl(filePath);
        
        fileUrl = urlData.publicUrl;
      }
      
      // Convert price to cents and validate
      const priceInCents = Math.round(parseFloat(data.price) * 100);
      if (isNaN(priceInCents) || priceInCents < 50) {
        throw new Error('Price must be at least $0.50');
      }
      
      // Create product
      const { error: productError } = await supabase
        .from('products')
        .insert([{
          creatorid: user.id,
          owner_uid: user.id, // Explicitly set owner_uid to fix RLS issues
          title: data.title.trim(),
          description: data.description.trim(),
          price: priceInCents,
          contenttype: data.contentType,
          fileurl: fileUrl,
          previewimageurl: previewUrl,
          blurpreview: data.blurPreview,
          ismaturecontent: data.isMatureContent,
          bookinglink: data.bookingLink,
          filetype: productFile?.type || null,
          filesize: productFile?.size || null,
          filemetadata: {
            ...productFile && {
              name: sanitizeFileName(productFile.name),
              type: productFile.type,
              size: productFile.size,
              lastModified: productFile.lastModified
            },
            ...(contentType === 'blog' && { articleBody: data.articleBody }),
            ...(contentType === 'chat' && { deliveryInstructions: data.deliveryInstructions }),
            ...(contentType === 'session' && { sessionDuration: data.sessionDuration })
          }
        }]);
      
      if (productError) {
        console.error('Product creation error:', productError);
        throw new Error('Failed to create product: ' + productError.message);
      }
      
      toast({
        title: 'Product added successfully',
        description: 'Your new product is now available for purchase.',
      });
      
      navigate('/dashboard/products');
    } catch (error: any) {
      toast({
        title: 'Error adding product',
        description: error.message || 'An error occurred while adding the product.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/products')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600">
            Create a new digital product to sell on your profile
          </p>
        </div>
        
        <div className="content-section p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Product Title *
              </label>
              <Input
                id="title"
                {...register('title', { 
                  required: 'Title is required',
                  maxLength: {
                    value: 100,
                    message: 'Title cannot exceed 100 characters',
                  },
                })}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <Textarea
                id="description"
                rows={4}
                {...register('description', { 
                  required: 'Description is required',
                })}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price (USD) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0.50"
                  className="pl-7"
                  {...register('price', { 
                    required: 'Price is required',
                    min: {
                      value: 0.5,
                      message: 'Price must be at least $0.50',
                    },
                  })}
                />
              </div>
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="contentType" className="block text-sm font-medium text-gray-700 mb-1">
                Content Type *
              </label>
              <ContentTypeSelector
                value={contentType}
                onChange={(value) => setValue('contentType', value)}
                error={errors.contentType?.message}
              />
            </div>

            {/* Content type specific fields */}
            {contentType === 'blog' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Article Body *
                </label>
                <Textarea
                  rows={12}
                  {...register('articleBody', { 
                    required: 'Article content is required'
                  })}
                  placeholder="Write your article content here..."
                />
                {errors.articleBody && (
                  <p className="mt-1 text-sm text-red-600">{errors.articleBody.message}</p>
                )}
              </div>
            )}

            {contentType === 'chat' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Instructions *
                </label>
                <Textarea
                  rows={4}
                  {...register('deliveryInstructions', {
                    required: 'Please explain how you will deliver the chat service'
                  })}
                  placeholder="Explain how you will deliver the chat service (e.g., Discord, Telegram, response time, etc.)"
                />
                {errors.deliveryInstructions && (
                  <p className="mt-1 text-sm text-red-600">{errors.deliveryInstructions.message}</p>
                )}
              </div>
            )}

            {contentType === 'booking' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Link (optional)
                </label>
                <Input
                  type="url"
                  {...register('bookingLink')}
                  placeholder="https://calendly.com/yourusername"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Add a link to your booking calendar (Calendly, Cal.com, etc.)
                </p>
              </div>
            )}

            {contentType === 'membership' && (
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-700">
                  To sell memberships, first set up your subscription tiers in the Membership Manager.
                  Once configured, you can create products linked to specific tiers.
                </p>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => navigate('/dashboard/memberships')}
                  className="mt-2 text-blue-600 hover:text-blue-700"
                >
                  Go to Membership Manager
                </Button>
              </div>
            )}
            
            {needsFile(contentType) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUploader
                  label="Preview Image *"
                  onFileSelect={setPreviewImage}
                  accept="image/jpeg, image/png, image/webp"
                  maxSize={5 * 1024 * 1024} // 5MB
                  file={previewImage}
                  isUploading={isSubmitting}
                />
                
                <FileUploader
                  label="Product File *"
                  onFileSelect={setProductFile}
                  accept={
                    contentType === 'video' ? 'video/mp4, video/webm' :
                    contentType === 'audio' ? 'audio/mpeg, audio/mp3, audio/wav' :
                    contentType === 'digital_product' ? 'application/pdf, application/zip' :
                    contentType === 'image' ? 'image/jpeg, image/png, image/webp' :
                    'application/octet-stream'
                  }
                  maxSize={
                    contentType === 'video' ? 2 * 1024 * 1024 * 1024 : // 2GB
                    contentType === 'audio' ? 500 * 1024 * 1024 : // 500MB
                    contentType === 'digital_product' ? 100 * 1024 * 1024 : // 100MB
                    contentType === 'image' ? 10 * 1024 * 1024 : // 10MB
                    5 * 1024 * 1024 // 5MB default
                  }
                  file={productFile}
                  isUploading={isSubmitting}
                />
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="blurPreview"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  {...register('blurPreview')}
                />
                <label htmlFor="blurPreview" className="ml-2 block text-sm text-gray-700">
                  Blur preview until purchase
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="isMatureContent"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  {...register('isMatureContent')}
                />
                <label htmlFor="isMatureContent" className="ml-2 block text-sm text-gray-700">
                  This product contains mature content (18+)
                </label>
              </div>

              {watch('isMatureContent') && (
                <div className="rounded-lg bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> By marking this as mature content, buyers will be required to:
                  </p>
                  <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                    <li>Verify they are 18 or older before purchase</li>
                    <li>Agree to view mature content</li>
                    <li>Confirm they understand the content restrictions</li>
                  </ul>
                </div>
              )}

              <div className="flex items-start pt-4">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  {...register('acceptTerms', {
                    required: 'You must accept the Terms & Conditions'
                  })}
                />
                <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700">
                  I agree to the <a href="/terms" target="_blank" className="text-primary hover:underline">Terms & Conditions</a> and confirm that my product complies with all applicable laws and platform guidelines. I understand that I am responsible for the content I upload and sell through this platform.
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
              )}
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="mr-3"
                onClick={() => navigate('/dashboard/products')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Adding Product...
                  </>
                ) : (
                  'Add Product'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
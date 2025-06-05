import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, Upload, Loader2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUserStore } from '@/lib/store';
import { ContentType, CONTENT_TYPE_LABELS, Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { generateSecureFilePath } from '@/lib/utils';

interface ProductFormValues {
  title: string;
  description: string;
  price: string;
  contentType: ContentType;
  blurPreview: boolean;
}

export function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [originalFileUrl, setOriginalFileUrl] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProductFormValues>();

  useEffect(() => {
    if (!id || !user) return;
    
    async function loadProduct() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .eq('creatorid', user.id)
          .single();
        
        if (error) throw error;
        
        if (!data) {
          toast({
            title: 'Product not found',
            description: 'The requested product could not be found.',
            variant: 'destructive',
          });
          navigate('/dashboard/products');
          return;
        }
        
        const product = data as Product;
        
        reset({
          title: product.title,
          description: product.description,
          price: (product.price / 100).toFixed(2),
          contentType: product.contenttype as ContentType,
          blurPreview: product.blurpreview,
        });
        
        // Set both preview URL and original file URL
        setPreviewImageUrl(product.previewimageurl);
        setOriginalFileUrl(product.fileurl || null);
      } catch (error) {
        console.error('Error loading product:', error);
        toast({
          title: 'Error loading product',
          description: 'There was a problem loading the product details.',
          variant: 'destructive',
        });
        navigate('/dashboard/products');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadProduct();
  }, [id, user, navigate, reset, supabase, toast]);

  const productDropzone = useDropzone({
    onDrop: (acceptedFiles) => {
      setProductFile(acceptedFiles[0]);
    },
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'audio/*': ['.mp3', '.wav'],
      'video/*': ['.mp4', '.mov'],
      'application/zip': ['.zip'],
    },
    maxFiles: 1,
  });

  const previewDropzone = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setPreviewImage(file);
      setPreviewImageUrl(URL.createObjectURL(file));
    },
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1,
  });

  const onSubmit = async (data: ProductFormValues) => {
    if (!user || !id) {
      toast({
        title: 'Authentication error',
        description: 'You must be logged in to update a product.',
        variant: 'destructive',
      });
      return;
    }

    if (!previewImageUrl) {
      toast({
        title: 'Missing preview image',
        description: 'Please upload a preview image for your product.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      let fileUrl = originalFileUrl;
      let previewUrl = previewImageUrl;
      
      // Upload new preview image if provided
      if (previewImage) {
        const filePath = generateSecureFilePath(user.id, previewImage.name);
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, previewImage, {
            contentType: previewImage.type,
            upsert: true,
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
      
      // Upload new product file if provided
      if (productFile) {
        const filePath = generateSecureFilePath(user.id, productFile.name);
        
        const { error: uploadError } = await supabase.storage
          .from('product-files')
          .upload(filePath, productFile, {
            contentType: productFile.type,
            upsert: true,
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
      
      // Convert price to cents
      const priceInCents = Math.round(parseFloat(data.price) * 100);
      
      // Update product
      const { error: updateError } = await supabase
        .from('products')
        .update({
          title: data.title,
          description: data.description,
          price: priceInCents,
          contenttype: data.contentType,
          fileurl: fileUrl,
          previewimageurl: previewUrl,
          blurpreview: data.blurPreview,
          owner_uid: user.id // Ensure owner_uid is set for RLS
        })
        .eq('id', id)
        .eq('creatorid', user.id);
      
      if (updateError) {
        console.error('Product update error:', updateError);
        throw new Error('Failed to update product: ' + updateError.message);
      }
      
      toast({
        title: 'Product updated successfully',
        description: 'Your product has been updated.',
      });
      
      navigate('/dashboard/products');
    } catch (error: any) {
      toast({
        title: 'Error updating product',
        description: error.message || 'An error occurred while updating the product.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-600">
            Update your product details
          </p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
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
              <select
                id="contentType"
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register('contentType', { required: 'Content type is required' })}
              >
                {Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.contentType && (
                <p className="mt-1 text-sm text-red-600">{errors.contentType.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preview Image * 
                </label>
                <div 
                  {...previewDropzone.getRootProps()} 
                  className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition ${
                    previewDropzone.isDragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...previewDropzone.getInputProps()} />
                  
                  {previewImageUrl ? (
                    <div className="space-y-2">
                      <div className="w-full h-32 mx-auto overflow-hidden rounded-md">
                        <img
                          src={previewImageUrl}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="text-sm text-gray-500">Click or drag to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Image className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-400">PNG, JPG, JPEG up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product File {originalFileUrl && <span className="text-xs text-gray-500">(Current file will be kept unless replaced)</span>}
                </label>
                <div 
                  {...productDropzone.getRootProps()} 
                  className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition ${
                    productDropzone.isDragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...productDropzone.getInputProps()} />
                  
                  {productFile ? (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-12 w-12 text-green-500" />
                      <p className="text-sm font-medium text-gray-900">{productFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(productFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : originalFileUrl ? (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-12 w-12 text-blue-500" />
                      <p className="text-sm font-medium text-gray-900">File already uploaded</p>
                      <p className="text-xs text-gray-500">Click or drag to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-400">PDF, Images, Audio, Video, ZIP up to 50MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
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
                    Saving Changes...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
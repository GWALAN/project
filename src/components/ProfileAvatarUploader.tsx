import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { UserIcon, Upload, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUserStore } from '@/lib/store';
import { generateSecureFilePath } from '@/lib/utils';

interface ProfileAvatarUploaderProps {
  onImageChange?: (url: string) => void;
  className?: string;
}

const ProfileAvatarUploader: React.FC<ProfileAvatarUploaderProps> = ({ 
  onImageChange,
  className = ''
}) => {
  const supabase = useSupabaseClient();
  const { user, updateUser } = useUserStore();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Maximum file size: 3MB
  const MAX_FILE_SIZE = 3 * 1024 * 1024;

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    if (!user?.profileImage) return;
    
    try {
      // If it's a full URL, use it directly
      if (user.profileImage.startsWith('http')) {
        setPreviewUrl(user.profileImage);
        return;
      }
      
      // Otherwise, get the public URL from Supabase
      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(user.profileImage);
        
      if (data?.publicUrl) {
        setPreviewUrl(data.publicUrl);
      } else {
        setPreviewUrl(user.profileImage);
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
      setPreviewUrl(user.profileImage);
    }
  }, [user, supabase]);

  const onDrop = (
    acceptedFiles: File[],
    fileRejections: FileRejection[]
  ) => {
    // Clear any previous errors
    setFileError(null);
    
    // Handle file rejections (too large or wrong type)
    if (fileRejections.length > 0) {
      const rej = fileRejections[0];
      const tooBig = rej.file.size > MAX_FILE_SIZE;
      
      setFileError(
        tooBig
          ? `File is ${formatFileSize(rej.file.size)} – please choose an image ≤ 3 MB.`
          : 'Unsupported file type. PNG, JPG or GIF only.'
      );
      return;
    }
    
    // Handle accepted files
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/png': [], 'image/jpeg': [], 'image/jpg': [], 'image/gif': [] },
    maxSize: MAX_FILE_SIZE,
    multiple: false
  });

  const handleUpload = async () => {
    if (!profileImage || !user) return;
    
    setIsUploading(true);
    try {
      // Generate a secure file path with user ID as the folder
      const filePath = generateSecureFilePath(user.id, profileImage.name);
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, profileImage, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);
      
      const profileImageUrl = urlData.publicUrl;
      
      // Update user profile in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          profileImage: profileImageUrl,
          profileimage: profileImageUrl // Update both column versions
        })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      // Update local user state
      updateUser({ profileImage: profileImageUrl });
      
      if (onImageChange) {
        onImageChange(profileImageUrl);
      }
      
      toast({
        title: 'Profile image updated',
        description: 'Your profile image has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error uploading image',
        description: error.message || 'An error occurred while uploading your image.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 mb-4">
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt="Profile preview" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-400">
            <UserIcon className="h-12 w-12" />
          </div>
        )}
        
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-center space-y-2">
        <div {...getRootProps()} className="cursor-pointer">
          <input {...getInputProps()} />
          <Button type="button" variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Select Photo
          </Button>
        </div>
        
        {profileImage && !fileError && (
          <Button 
            type="button" 
            size="sm"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Photo'
            )}
          </Button>
        )}
        
        {fileError && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md w-full max-w-xs">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium">File upload error</p>
                <p>{fileError}</p>
              </div>
            </div>
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-1">
          PNG, JPG, or GIF up to 3MB
        </p>
      </div>
    </div>
  );
};

export default ProfileAvatarUploader;
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Video, Music, Image as ImageIcon, File, X, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FileUploaderProps {
  label: string;
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSize?: number;
  file?: File | null;
  isUploading?: boolean;
}

export function FileUploader({
  label,
  onFileSelect,
  accept,
  maxSize = 5 * 1024 * 1024, // 5MB default
  file,
  isUploading = false
}: FileUploaderProps) {
  const { toast } = useToast();
  const [isDragActive, setIsDragActive] = useState(false);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      const selectedFile = acceptedFiles[0];
      if (!selectedFile) return;
      
      // Check file size
      if (selectedFile.size > maxSize) {
        toast({
          title: 'File too large',
          description: `Maximum file size is ${formatFileSize(maxSize)}`,
          variant: 'destructive'
        });
        return;
      }
      
      onFileSelect(selectedFile);
    },
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: accept ? parseAccept(accept) : undefined,
    maxFiles: 1,
    multiple: false
  });

  // Parse accept string into the format required by react-dropzone
  function parseAccept(acceptString: string): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    const types = acceptString.split(', ');
    
    types.forEach(type => {
      if (type.includes('/')) {
        // Handle MIME types like 'image/*'
        const [category, subtype] = type.split('/');
        if (subtype === '*') {
          result[`${category}/*`] = [];
        } else {
          if (!result[`${category}/*`]) {
            result[`${category}/*`] = [];
          }
          result[`${category}/*`].push(`.${subtype}`);
        }
      } else if (type.startsWith('application/')) {
        // Handle application types
        const subtype = type.replace('application/', '');
        if (!result['application/*']) {
          result['application/*'] = [];
        }
        result['application/*'].push(`.${subtype}`);
      }
    });
    
    return result;
  }

  // Format file size for display
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get icon based on file type
  const getFileTypeIcon = () => {
    if (!file) {
      return <Upload className="h-12 w-12 text-gray-400" />;
    }

    if (file.type.startsWith('video/')) {
      return <Video className="h-12 w-12 text-purple-500" />;
    } else if (file.type.startsWith('audio/')) {
      return <Music className="h-12 w-12 text-green-500" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-12 w-12 text-red-500" />;
    } else if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-12 w-12 text-blue-500" />;
    } else {
      return <File className="h-12 w-12 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      <div
        {...getRootProps()}
        className={`relative border-2 ${
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-dashed border-gray-300 hover:border-gray-400'
        } rounded-lg transition-colors`}
      >
        <input {...getInputProps()} />

        {file ? (
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getFileTypeIcon()}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isUploading ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileSelect(null);
                    }}
                    className="text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              {getFileTypeIcon()}
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {accept ? `Supported formats: ${accept}` : 'All file types supported'}
                </p>
                {maxSize && (
                  <p className="text-xs text-gray-500">
                    Maximum size: {formatFileSize(maxSize)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {isDragActive && (
          <div className="absolute inset-0 bg-primary/10 rounded-lg border-2 border-primary flex items-center justify-center">
            <div className="text-center">
              <Upload className="h-12 w-12 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-primary">Drop your file here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
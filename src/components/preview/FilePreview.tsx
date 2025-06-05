import React from 'react';
import { FileText, Video, Music, Archive, File, Lock } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

interface FilePreviewProps {
  contentType: string;
  fileType?: string;
  fileSize?: number;
  isBlurred?: boolean;
  previewUrl?: string;
}

export function FilePreview({
  contentType,
  fileType,
  fileSize,
  isBlurred,
  previewUrl
}: FilePreviewProps) {
  const getPreviewContent = () => {
    if (isBlurred) {
      return (
        <div className="relative w-full aspect-video bg-gray-100 rounded-md overflow-hidden">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover filter blur-xl"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Lock className="h-8 w-8 text-white" />
          </div>
        </div>
      );
    }

    switch (contentType) {
      case 'video':
        return (
          <div className="relative w-full aspect-video bg-gray-100 rounded-md overflow-hidden">
            {previewUrl ? (
              <video
                src={previewUrl}
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Video className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="relative w-full aspect-[4/1] bg-gray-100 rounded-md overflow-hidden">
            {previewUrl ? (
              <audio
                src={previewUrl}
                controls
                className="absolute bottom-0 w-full"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Music className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-md overflow-hidden">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                {fileType === 'application/pdf' ? (
                  <FileText className="h-12 w-12 text-gray-400" />
                ) : fileType === 'application/zip' ? (
                  <Archive className="h-12 w-12 text-gray-400" />
                ) : (
                  <File className="h-12 w-12 text-gray-400" />
                )}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      {getPreviewContent()}
      {fileSize && (
        <p className="text-sm text-gray-500 text-center">
          {formatFileSize(fileSize)}
        </p>
      )}
    </div>
  );
}
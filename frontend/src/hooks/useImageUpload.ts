import { useState } from 'react';
import { imageUploadService } from '@/lib/image-upload';

export function useImageUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  const selectFile = async (file: File, options?: { maxSize?: number; allowedTypes?: string[] }) => {
    setError(null);
    
    // Validate the file
    const validationError = imageUploadService.validateImage(file, options);
    if (validationError) {
      setError(validationError);
      return false;
    }

    try {
      // Get dimensions
      const imageDimensions = await imageUploadService.getImageDimensions(file);
      
      // Check dimension limits (100x100 to 2048x2048)
      if (imageDimensions.width < 100 || imageDimensions.height < 100) {
        setError('Image dimensions must be at least 100x100 pixels');
        return false;
      }
      
      if (imageDimensions.width > 2048 || imageDimensions.height > 2048) {
        setError('Image dimensions must not exceed 2048x2048 pixels');
        return false;
      }

      // Clean up previous preview
      if (previewUrl) {
        imageUploadService.revokePreviewUrl(previewUrl);
      }

      // Set new file and preview
      setSelectedFile(file);
      setDimensions(imageDimensions);
      setPreviewUrl(imageUploadService.createPreviewUrl(file));
      
      return true;
    } catch {
      setError('Failed to process image');
      return false;
    }
  };

  const clearFile = () => {
    if (previewUrl) {
      imageUploadService.revokePreviewUrl(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setDimensions(null);
  };

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await selectFile(file);
    } else {
      clearFile();
    }
  };

  return {
    selectedFile,
    previewUrl,
    error,
    dimensions,
    selectFile,
    clearFile,
    handleFileInput,
    hasFile: !!selectedFile
  };
} 
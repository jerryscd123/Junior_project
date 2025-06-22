export interface ImageUploadOptions {
  file: File;
  alt?: string;
  maxSize?: number; // in MB
  allowedTypes?: string[];
}

export const imageUploadService = {
  // Validate image before upload
  validateImage(file: File, options: Partial<ImageUploadOptions> = {}): string | null {
    const maxSize = (options.maxSize || 5) * 1024 * 1024; // Default 5MB
    const allowedTypes = options.allowedTypes || [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`;
    }

    if (file.size > maxSize) {
      return `File size too large. Maximum size: ${options.maxSize || 5}MB`;
    }

    return null; // Valid
  },

  // Create image preview URL
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  },

  // Clean up preview URL
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  },

  // Get image dimensions
  async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
}; 
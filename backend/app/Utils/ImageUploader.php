<?php

namespace App\Utils;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ImageUploader
{
    /**
     * Allowed image MIME types
     */
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
    ];

    /**
     * Allowed file extensions
     */
    private const ALLOWED_EXTENSIONS = [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
    ];

    /**
     * Maximum file size in bytes (5MB)
     */
    private const MAX_FILE_SIZE = 5 * 1024 * 1024;

    /**
     * Avatar dimensions
     */
    private const AVATAR_SIZES = [
        'thumbnail' => ['width' => 50, 'height' => 50],
        'small' => ['width' => 100, 'height' => 100],
        'medium' => ['width' => 200, 'height' => 200],
        'large' => ['width' => 400, 'height' => 400],
    ];

    /**
     * Default storage disk
     */
    private const STORAGE_DISK = 'public';

    /**
     * Upload and process avatar image
     *
     * @param UploadedFile $file
     * @param int|null $userId
     * @param string $folder
     * @return array|null
     */
    public static function uploadAvatar(UploadedFile $file, ?int $userId = null, string $folder = 'avatars'): ?array
    {
        // Validate the uploaded file
        $validation = self::validateImage($file);
        if (!$validation['valid']) {
            return [
                'success' => false,
                'error' => $validation['error'],
            ];
        }

        try {
            // Generate unique filename
            $filename = self::generateFilename($file);
            $basePath = $folder . '/' . ($userId ? "user_{$userId}" : 'anonymous');

            // Create different sizes
            $sizes = [];
            foreach (self::AVATAR_SIZES as $sizeName => $dimensions) {
                $sizePath = $basePath . '/' . $sizeName . '_' . $filename;
                $resizedImage = self::resizeImage($file, $dimensions['width'], $dimensions['height']);
                
                if ($resizedImage) {
                    Storage::disk(self::STORAGE_DISK)->put($sizePath, $resizedImage);
                    $sizes[$sizeName] = Storage::disk(self::STORAGE_DISK)->url($sizePath);
                }
            }

            // Store original image
            $originalPath = $basePath . '/original_' . $filename;
            Storage::disk(self::STORAGE_DISK)->putFileAs($basePath, $file, 'original_' . $filename);
            $originalUrl = Storage::disk(self::STORAGE_DISK)->url($originalPath);

            return [
                'success' => true,
                'filename' => $filename,
                'original' => $originalUrl,
                'sizes' => $sizes,
                'path' => $basePath,
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to upload image: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Upload and process post image
     *
     * @param UploadedFile $file
     * @param int|null $userId
     * @param string $folder
     * @return array|null
     */
    public static function uploadPostImage(UploadedFile $file, ?int $userId = null, string $folder = 'posts'): ?array
    {
        // Validate the uploaded file
        $validation = self::validateImage($file);
        if (!$validation['valid']) {
            return [
                'success' => false,
                'error' => $validation['error'],
            ];
        }

        try {
            // Generate unique filename
            $filename = self::generateFilename($file);
            $basePath = $folder . '/' . ($userId ? "user_{$userId}" : 'anonymous');

            // Get original image dimensions
            $dimensions = self::getImageDimensions($file);

            // Create optimized version for web
            $optimizedImage = self::optimizeForWeb($file, 1200, 1200, 85);
            $optimizedPath = $basePath . '/optimized_' . $filename;
            
            if ($optimizedImage) {
                Storage::disk(self::STORAGE_DISK)->put($optimizedPath, $optimizedImage);
            }

            // Create thumbnail
            $thumbnailImage = self::createThumbnail($file, 300);
            $thumbnailPath = $basePath . '/thumbnail_' . $filename;
            
            if ($thumbnailImage) {
                Storage::disk(self::STORAGE_DISK)->put($thumbnailPath, $thumbnailImage);
            }

            // Store original image
            $originalPath = $basePath . '/original_' . $filename;
            Storage::disk(self::STORAGE_DISK)->putFileAs($basePath, $file, 'original_' . $filename);

            // Prepare metadata
            $metadata = [
                'width' => $dimensions['width'] ?? null,
                'height' => $dimensions['height'] ?? null,
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'original_name' => $file->getClientOriginalName(),
                'optimized' => $optimizedImage ? $optimizedPath : null,
                'thumbnail' => $thumbnailImage ? $thumbnailPath : null,
            ];

            return [
                'success' => true,
                'filename' => $filename,
                'path' => $originalPath,
                'metadata' => $metadata,
                'url' => Storage::disk(self::STORAGE_DISK)->url($originalPath),
                'thumbnail_url' => $thumbnailImage ? Storage::disk(self::STORAGE_DISK)->url($thumbnailPath) : null,
                'optimized_url' => $optimizedImage ? Storage::disk(self::STORAGE_DISK)->url($optimizedPath) : null,
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to upload post image: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Validate uploaded image
     *
     * @param UploadedFile $file
     * @return array
     */
    public static function validateImage(UploadedFile $file): array
    {
        // Check if file is valid
        if (!$file->isValid()) {
            return [
                'valid' => false,
                'error' => 'Invalid file upload',
            ];
        }

        // Check file size
        if ($file->getSize() > self::MAX_FILE_SIZE) {
            return [
                'valid' => false,
                'error' => 'File size exceeds maximum allowed size of ' . (self::MAX_FILE_SIZE / 1024 / 1024) . 'MB',
            ];
        }

        // Check MIME type
        if (!in_array($file->getMimeType(), self::ALLOWED_MIME_TYPES)) {
            return [
                'valid' => false,
                'error' => 'Invalid file type. Allowed types: ' . implode(', ', self::ALLOWED_MIME_TYPES),
            ];
        }

        // Check file extension
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, self::ALLOWED_EXTENSIONS)) {
            return [
                'valid' => false,
                'error' => 'Invalid file extension. Allowed extensions: ' . implode(', ', self::ALLOWED_EXTENSIONS),
            ];
        }

        // Additional security check - verify it's actually an image
        try {
            $imageInfo = getimagesize($file->getPathname());
            if ($imageInfo === false) {
                return [
                    'valid' => false,
                    'error' => 'File is not a valid image',
                ];
            }
        } catch (\Exception $e) {
            return [
                'valid' => false,
                'error' => 'Unable to verify image file',
            ];
        }

        return [
            'valid' => true,
            'error' => null,
        ];
    }

    /**
     * Resize image to specified dimensions
     *
     * @param UploadedFile $file
     * @param int $width
     * @param int $height
     * @param int $quality
     * @return string|null
     */
    public static function resizeImage(UploadedFile $file, int $width, int $height, int $quality = 85): ?string
    {
        try {
            $manager = new ImageManager(new Driver());
            $image = $manager->read($file->getPathname());
            
            // Resize image while maintaining aspect ratio
            $image->cover($width, $height);

            // Encode with quality
            $encoded = $image->toJpeg($quality);

            return $encoded;

        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Generate unique filename
     *
     * @param UploadedFile $file
     * @return string
     */
    public static function generateFilename(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        $timestamp = now()->format('Y-m-d_H-i-s');
        $random = Str::random(8);
        
        return "{$timestamp}_{$random}.{$extension}";
    }

    /**
     * Delete avatar files
     *
     * @param string $path
     * @return bool
     */
    public static function deleteAvatar(string $path): bool
    {
        try {
            $disk = Storage::disk(self::STORAGE_DISK);
            
            // Delete all size variants
            foreach (array_keys(self::AVATAR_SIZES) as $sizeName) {
                $sizePath = str_replace('original_', $sizeName . '_', $path);
                if ($disk->exists($sizePath)) {
                    $disk->delete($sizePath);
                }
            }
            
            // Delete original
            if ($disk->exists($path)) {
                $disk->delete($path);
            }
            
            return true;

        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get image dimensions
     *
     * @param UploadedFile $file
     * @return array|null
     */
    public static function getImageDimensions(UploadedFile $file): ?array
    {
        try {
            $imageInfo = getimagesize($file->getPathname());
            
            if ($imageInfo !== false) {
                return [
                    'width' => $imageInfo[0],
                    'height' => $imageInfo[1],
                    'type' => $imageInfo[2],
                    'mime' => $imageInfo['mime'],
                ];
            }
            
            return null;

        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Optimize image for web
     *
     * @param UploadedFile $file
     * @param int $maxWidth
     * @param int $maxHeight
     * @param int $quality
     * @return string|null
     */
    public static function optimizeForWeb(UploadedFile $file, int $maxWidth = 1200, int $maxHeight = 1200, int $quality = 80): ?string
    {
        try {
            $manager = new ImageManager(new Driver());
            $image = $manager->read($file->getPathname());
            
            // Get current dimensions
            $currentWidth = $image->width();
            $currentHeight = $image->height();
            
            // Only resize if image is larger than max dimensions
            if ($currentWidth > $maxWidth || $currentHeight > $maxHeight) {
                $image->scale($maxWidth, $maxHeight);
            }
            
            // Encode with quality
            $encoded = $image->toJpeg($quality);
            
            return $encoded;

        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Create thumbnail from image
     *
     * @param UploadedFile $file
     * @param int $size
     * @return string|null
     */
    public static function createThumbnail(UploadedFile $file, int $size = 150): ?string
    {
        return self::resizeImage($file, $size, $size, 75);
    }

    /**
     * Get file size in human readable format
     *
     * @param int $bytes
     * @return string
     */
    public static function formatFileSize(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $factor = floor((strlen($bytes) - 1) / 3);
        
        return sprintf("%.2f %s", $bytes / pow(1024, $factor), $units[$factor]);
    }

    /**
     * Check if file is an image
     *
     * @param UploadedFile $file
     * @return bool
     */
    public static function isImage(UploadedFile $file): bool
    {
        $validation = self::validateImage($file);
        return $validation['valid'];
    }

    /**
     * Get allowed file types for frontend validation
     *
     * @return array
     */
    public static function getAllowedTypes(): array
    {
        return [
            'mime_types' => self::ALLOWED_MIME_TYPES,
            'extensions' => self::ALLOWED_EXTENSIONS,
            'max_size' => self::MAX_FILE_SIZE,
            'max_size_formatted' => self::formatFileSize(self::MAX_FILE_SIZE),
        ];
    }

    /**
     * Clean up temporary files
     *
     * @param string $directory
     * @param int $olderThanHours
     * @return int Number of files deleted
     */
    public static function cleanupTempFiles(string $directory = 'temp', int $olderThanHours = 24): int
    {
        try {
            $disk = Storage::disk(self::STORAGE_DISK);
            $files = $disk->files($directory);
            $deletedCount = 0;
            $cutoffTime = now()->subHours($olderThanHours);
            
            foreach ($files as $file) {
                $lastModified = $disk->lastModified($file);
                if ($lastModified < $cutoffTime->timestamp) {
                    $disk->delete($file);
                    $deletedCount++;
                }
            }
            
            return $deletedCount;

        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Get storage usage statistics
     *
     * @param string $directory
     * @return array
     */
    public static function getStorageStats(string $directory = 'avatars'): array
    {
        try {
            $disk = Storage::disk(self::STORAGE_DISK);
            $files = $disk->allFiles($directory);
            $totalSize = 0;
            $fileCount = count($files);
            
            foreach ($files as $file) {
                $totalSize += $disk->size($file);
            }
            
            return [
                'file_count' => $fileCount,
                'total_size' => $totalSize,
                'total_size_formatted' => self::formatFileSize($totalSize),
                'directory' => $directory,
            ];

        } catch (\Exception $e) {
            return [
                'file_count' => 0,
                'total_size' => 0,
                'total_size_formatted' => '0 B',
                'directory' => $directory,
            ];
        }
    }
} 
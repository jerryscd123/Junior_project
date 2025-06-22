<?php

namespace App\Utils;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Cache;

class AnonymousHelper
{
    /**
     * Session key for anonymous user identifier
     */
    private const ANONYMOUS_SESSION_KEY = 'anonymous_user_id';

    /**
     * Cache prefix for anonymous user data
     */
    private const CACHE_PREFIX = 'anonymous_user_';

    /**
     * Default cache duration for anonymous user data (in minutes)
     */
    private const CACHE_DURATION = 1440; // 24 hours

    /**
     * Anonymous user name patterns
     */
    private static array $anonymousNames = [
        'Anonymous User',
        'Guest User',
        'Unknown User',
        'Private User',
        'Hidden User',
    ];

    /**
     * Generate a unique anonymous identifier
     *
     * @return string
     */
    public static function generateAnonymousId(): string
    {
        return 'anon_' . Str::random(16) . '_' . time();
    }

    /**
     * Get or create anonymous identifier for current session
     *
     * @return string
     */
    public static function getSessionAnonymousId(): string
    {
        $anonymousId = Session::get(self::ANONYMOUS_SESSION_KEY);
        
        if (!$anonymousId) {
            $anonymousId = self::generateAnonymousId();
            Session::put(self::ANONYMOUS_SESSION_KEY, $anonymousId);
        }
        
        return $anonymousId;
    }

    /**
     * Set anonymous identifier for current session
     *
     * @param string $anonymousId
     * @return void
     */
    public static function setSessionAnonymousId(string $anonymousId): void
    {
        Session::put(self::ANONYMOUS_SESSION_KEY, $anonymousId);
    }

    /**
     * Generate anonymous display name
     *
     * @param string|null $anonymousId
     * @return string
     */
    public static function generateAnonymousName(?string $anonymousId = null): string
    {
        if ($anonymousId) {
            // Generate consistent name based on ID
            $hash = crc32($anonymousId);
            $index = abs($hash) % count(self::$anonymousNames);
            $number = abs($hash) % 9999 + 1;
            return self::$anonymousNames[$index] . ' #' . $number;
        }
        
        return self::$anonymousNames[array_rand(self::$anonymousNames)];
    }

    /**
     * Store anonymous user data temporarily
     *
     * @param string $anonymousId
     * @param array $data
     * @param int|null $minutes
     * @return bool
     */
    public static function storeAnonymousData(string $anonymousId, array $data, ?int $minutes = null): bool
    {
        $cacheKey = self::CACHE_PREFIX . $anonymousId;
        $duration = $minutes ?? self::CACHE_DURATION;
        
        return Cache::put($cacheKey, $data, now()->addMinutes($duration));
    }

    /**
     * Retrieve anonymous user data
     *
     * @param string $anonymousId
     * @return array|null
     */
    public static function getAnonymousData(string $anonymousId): ?array
    {
        $cacheKey = self::CACHE_PREFIX . $anonymousId;
        return Cache::get($cacheKey);
    }

    /**
     * Update anonymous user data
     *
     * @param string $anonymousId
     * @param array $newData
     * @param bool $merge
     * @return bool
     */
    public static function updateAnonymousData(string $anonymousId, array $newData, bool $merge = true): bool
    {
        $cacheKey = self::CACHE_PREFIX . $anonymousId;
        
        if ($merge) {
            $existingData = Cache::get($cacheKey, []);
            $data = array_merge($existingData, $newData);
        } else {
            $data = $newData;
        }
        
        return Cache::put($cacheKey, $data, now()->addMinutes(self::CACHE_DURATION));
    }

    /**
     * Delete anonymous user data
     *
     * @param string $anonymousId
     * @return bool
     */
    public static function deleteAnonymousData(string $anonymousId): bool
    {
        $cacheKey = self::CACHE_PREFIX . $anonymousId;
        return Cache::forget($cacheKey);
    }

    /**
     * Check if user is anonymous
     *
     * @param mixed $user
     * @return bool
     */
    public static function isAnonymous($user): bool
    {
        if (is_null($user)) {
            return true;
        }
        
        if (is_array($user) && isset($user['is_anonymous'])) {
            return (bool) $user['is_anonymous'];
        }
        
        if (is_object($user) && property_exists($user, 'is_anonymous')) {
            return (bool) $user->is_anonymous;
        }
        
        return false;
    }

    /**
     * Sanitize data for anonymous users
     *
     * @param array $data
     * @return array
     */
    public static function sanitizeAnonymousData(array $data): array
    {
        // Remove sensitive fields that shouldn't be stored for anonymous users
        $sensitiveFields = [
            'email',
            'phone',
            'address',
            'ip_address',
            'user_agent',
            'real_name',
            'personal_info',
        ];
        
        foreach ($sensitiveFields as $field) {
            unset($data[$field]);
        }
        
        return $data;
    }

    /**
     * Generate anonymous user profile data
     *
     * @param string|null $anonymousId
     * @return array
     */
    public static function generateAnonymousProfile(?string $anonymousId = null): array
    {
        $anonymousId = $anonymousId ?? self::generateAnonymousId();
        
        return [
            'anonymous_id' => $anonymousId,
            'display_name' => self::generateAnonymousName($anonymousId),
            'is_anonymous' => true,
            'avatar' => null,
            'bio' => null,
            'created_at' => now()->toISOString(),
        ];
    }

    /**
     * Mask sensitive information for display
     *
     * @param string $value
     * @param int $visibleChars
     * @param string $maskChar
     * @return string
     */
    public static function maskSensitiveInfo(string $value, int $visibleChars = 2, string $maskChar = '*'): string
    {
        $length = strlen($value);
        
        if ($length <= $visibleChars) {
            return str_repeat($maskChar, $length);
        }
        
        $visible = substr($value, 0, $visibleChars);
        $masked = str_repeat($maskChar, $length - $visibleChars);
        
        return $visible . $masked;
    }

    /**
     * Clean up expired anonymous data
     *
     * @return int Number of cleaned up entries
     */
    public static function cleanupExpiredData(): int
    {
        // This would typically be implemented with a more sophisticated cache system
        // For now, we'll return 0 as Laravel's cache handles expiration automatically
        return 0;
    }

    /**
     * Get anonymous user statistics
     *
     * @return array
     */
    public static function getAnonymousStats(): array
    {
        // This would require a more sophisticated tracking system
        // For now, return basic structure
        return [
            'active_anonymous_users' => 0,
            'total_anonymous_posts' => 0,
            'total_anonymous_comments' => 0,
        ];
    }

    /**
     * Validate anonymous identifier format
     *
     * @param string $anonymousId
     * @return bool
     */
    public static function isValidAnonymousId(string $anonymousId): bool
    {
        // Check if it matches our anonymous ID pattern
        return preg_match('/^anon_[a-zA-Z0-9]{16}_\d+$/', $anonymousId) === 1;
    }

    /**
     * Convert user data to anonymous format
     *
     * @param array $userData
     * @param string|null $anonymousId
     * @return array
     */
    public static function convertToAnonymous(array $userData, ?string $anonymousId = null): array
    {
        $anonymousId = $anonymousId ?? self::generateAnonymousId();
        
        return [
            'id' => null,
            'anonymous_id' => $anonymousId,
            'name' => self::generateAnonymousName($anonymousId),
            'email' => null,
            'avatar' => null,
            'bio' => null,
            'is_anonymous' => true,
            'role' => 'user',
        ];
    }

    /**
     * Get anonymous user display information
     *
     * @param string $anonymousId
     * @return array
     */
    public static function getAnonymousDisplayInfo(string $anonymousId): array
    {
        return [
            'id' => null,
            'anonymous_id' => $anonymousId,
            'name' => self::generateAnonymousName($anonymousId),
            'avatar' => null,
            'is_anonymous' => true,
        ];
    }

    /**
     * Check if anonymous posting is allowed
     *
     * @return bool
     */
    public static function isAnonymousPostingAllowed(): bool
    {
        // This could be configurable via settings
        return config('mindspeak.allow_anonymous_posting', true);
    }

    /**
     * Rate limit check for anonymous users
     *
     * @param string $anonymousId
     * @param string $action
     * @param int $maxAttempts
     * @param int $decayMinutes
     * @return bool
     */
    public static function checkRateLimit(string $anonymousId, string $action, int $maxAttempts = 5, int $decayMinutes = 60): bool
    {
        $key = "rate_limit_{$action}_{$anonymousId}";
        $attempts = Cache::get($key, 0);
        
        if ($attempts >= $maxAttempts) {
            return false;
        }
        
        Cache::put($key, $attempts + 1, now()->addMinutes($decayMinutes));
        return true;
    }

    /**
     * Clear session anonymous data
     *
     * @return void
     */
    public static function clearSessionData(): void
    {
        $anonymousId = Session::get(self::ANONYMOUS_SESSION_KEY);
        
        if ($anonymousId) {
            self::deleteAnonymousData($anonymousId);
            Session::forget(self::ANONYMOUS_SESSION_KEY);
        }
    }
} 
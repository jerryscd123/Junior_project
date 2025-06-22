<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;

class RateLimitMiddleware
{
    /**
     * Rate limit configurations for different endpoints
     */
    private $rateLimits = [
        'posts' => [
            'authenticated' => ['max' => 10, 'decay' => 60], // 10 posts per hour
            'anonymous' => ['max' => 3, 'decay' => 60]       // 3 posts per hour
        ],
        'comments' => [
            'authenticated' => ['max' => 30, 'decay' => 60], // 30 comments per hour
            'anonymous' => ['max' => 10, 'decay' => 60]      // 10 comments per hour
        ],
        'likes' => [
            'authenticated' => ['max' => 100, 'decay' => 60], // 100 likes per hour
            'anonymous' => ['max' => 20, 'decay' => 60]       // 20 likes per hour
        ],
        'messages' => [
            'authenticated' => ['max' => 5, 'decay' => 60],   // 5 messages per hour
            'anonymous' => ['max' => 1, 'decay' => 60]        // 1 message per hour
        ],
        'auth' => [
            'all' => ['max' => 5, 'decay' => 15]              // 5 auth attempts per 15 minutes
        ],
        'default' => [
            'authenticated' => ['max' => 60, 'decay' => 60],  // 60 requests per hour
            'anonymous' => ['max' => 30, 'decay' => 60]       // 30 requests per hour
        ]
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $type = 'default'): Response
    {
        // Determine user type and identifier
        $user = $request->user();
        $isAuthenticated = $user !== null;
        $identifier = $this->getUserIdentifier($request, $user);

        // Get rate limit configuration for this endpoint type
        $config = $this->getRateLimitConfig($type, $isAuthenticated);
        
        if (!$config) {
            return $next($request);
        }

        // Create rate limit key
        $key = $this->createRateLimitKey($type, $identifier);

        // Check if rate limit is exceeded
        if (RateLimiter::tooManyAttempts($key, $config['max'])) {
            return $this->buildRateLimitResponse($key, $config);
        }

        // Increment the rate limit counter
        RateLimiter::hit($key, $config['decay'] * 60); // Convert minutes to seconds

        // Add rate limit headers to response
        $response = $next($request);
        return $this->addRateLimitHeaders($response, $key, $config);
    }

    /**
     * Get user identifier for rate limiting
     */
    private function getUserIdentifier(Request $request, $user): string
    {
        if ($user) {
            return 'user:' . $user->id;
        }

        // For anonymous users, use IP address or anonymous ID
        $anonymousId = $request->input('anonymous_id');
        if ($anonymousId) {
            return 'anonymous:' . $anonymousId;
        }

        return 'ip:' . $request->ip();
    }

    /**
     * Get rate limit configuration for endpoint type and user type
     */
    private function getRateLimitConfig(string $type, bool $isAuthenticated): ?array
    {
        if (!isset($this->rateLimits[$type])) {
            $type = 'default';
        }

        $config = $this->rateLimits[$type];

        // Special case for auth endpoints
        if ($type === 'auth' && isset($config['all'])) {
            return $config['all'];
        }

        // Return config based on authentication status
        if ($isAuthenticated && isset($config['authenticated'])) {
            return $config['authenticated'];
        }

        if (!$isAuthenticated && isset($config['anonymous'])) {
            return $config['anonymous'];
        }

        // Fallback to default
        return $this->rateLimits['default'][$isAuthenticated ? 'authenticated' : 'anonymous'] ?? null;
    }

    /**
     * Create rate limit key
     */
    private function createRateLimitKey(string $type, string $identifier): string
    {
        return "rate_limit:{$type}:{$identifier}";
    }

    /**
     * Build rate limit exceeded response
     */
    private function buildRateLimitResponse(string $key, array $config): Response
    {
        $retryAfter = RateLimiter::availableIn($key);
        
        return response()->json([
            'success' => false,
            'message' => 'Rate limit exceeded. Please try again later.',
            'error_code' => 'RATE_LIMIT_EXCEEDED',
            'retry_after' => $retryAfter,
            'limit' => $config['max'],
            'window' => $config['decay'] . ' minutes'
        ], 429)->header('Retry-After', $retryAfter);
    }

    /**
     * Add rate limit headers to response
     */
    private function addRateLimitHeaders(Response $response, string $key, array $config): Response
    {
        $attempts = RateLimiter::attempts($key);
        $remaining = max(0, $config['max'] - $attempts);
        $retryAfter = RateLimiter::availableIn($key);

        return $response->withHeaders([
            'X-RateLimit-Limit' => $config['max'],
            'X-RateLimit-Remaining' => $remaining,
            'X-RateLimit-Reset' => now()->addSeconds($retryAfter)->timestamp,
        ]);
    }
}

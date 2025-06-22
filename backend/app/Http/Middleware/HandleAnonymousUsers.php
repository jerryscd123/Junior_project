<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;

class HandleAnonymousUsers
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if this is an anonymous request
        $isAnonymous = $request->input('is_anonymous', false) || !$request->user();

        if ($isAnonymous) {
            // Generate or retrieve anonymous session identifier
            $anonymousId = $this->getOrCreateAnonymousId($request);
            
            // Add anonymous identifier to request
            $request->merge([
                'anonymous_id' => $anonymousId,
                'is_anonymous' => true
            ]);

            // For anonymous users, we need to ensure they can't access protected routes
            if ($this->isProtectedRoute($request)) {
                return response()->json([
                    'success' => false,
                    'message' => 'This action requires authentication.',
                    'error_code' => 'AUTHENTICATION_REQUIRED'
                ], 401);
            }

            // Apply anonymous user rate limiting
            $this->applyAnonymousRateLimit($request, $anonymousId);
        } else {
            // For authenticated users who want to post anonymously
            if ($request->input('is_anonymous', false)) {
                $request->merge([
                    'is_anonymous' => true,
                    'anonymous_id' => $this->generateAnonymousId()
                ]);
            }
        }

        return $next($request);
    }

    /**
     * Get or create anonymous session identifier
     */
    private function getOrCreateAnonymousId(Request $request): string
    {
        // Try to get from session first
        $sessionKey = 'anonymous_id';
        $anonymousId = Session::get($sessionKey);

        if (!$anonymousId) {
            // Generate new anonymous ID
            $anonymousId = $this->generateAnonymousId();
            Session::put($sessionKey, $anonymousId);
        }

        return $anonymousId;
    }

    /**
     * Generate a secure anonymous identifier
     */
    private function generateAnonymousId(): string
    {
        return 'anon_' . Str::random(16) . '_' . time();
    }

    /**
     * Check if the current route requires authentication
     */
    private function isProtectedRoute(Request $request): bool
    {
        $protectedRoutes = [
            'user/profile',
            'user/settings',
            'notifications',
            'messages',
            'admin/*'
        ];

        $currentPath = $request->path();

        foreach ($protectedRoutes as $pattern) {
            if (Str::is($pattern, $currentPath)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Apply rate limiting for anonymous users
     */
    private function applyAnonymousRateLimit(Request $request, string $anonymousId): void
    {
        // Anonymous users have stricter rate limits
        $key = 'anonymous_rate_limit:' . $anonymousId;
        $maxAttempts = 5; // Lower limit for anonymous users
        $decayMinutes = 60; // Longer decay time

        // Get current attempts
        $attempts = cache()->get($key, 0);

        if ($attempts >= $maxAttempts) {
            // Store rate limit exceeded flag
            $request->merge(['rate_limit_exceeded' => true]);
        }

        // Increment attempts
        cache()->put($key, $attempts + 1, now()->addMinutes($decayMinutes));

        // Store rate limit info in request
        $request->merge([
            'anonymous_rate_limit_attempts' => $attempts + 1,
            'anonymous_rate_limit_max' => $maxAttempts
        ]);
    }
}

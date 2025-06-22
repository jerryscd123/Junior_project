<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ContentModerationMiddleware
{
    /**
     * Banned words list - in production, this should be stored in database or config
     */
    private $bannedWords = [
        'spam', 'scam', 'hate', 'violence', 'abuse', 'harassment',
        'inappropriate', 'offensive', 'vulgar', 'profanity'
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only apply content moderation to POST and PUT requests with content
        if (!in_array($request->method(), ['POST', 'PUT'])) {
            return $next($request);
        }

        // Check for content fields that need moderation
        $contentFields = ['content', 'title', 'message', 'subject', 'bio'];
        $flaggedContent = [];
        $severity = 0;

        foreach ($contentFields as $field) {
            if ($request->has($field)) {
                $content = $request->input($field);
                $result = $this->moderateContent($content);
                
                if ($result['flagged']) {
                    $flaggedContent[$field] = $result;
                    $severity = max($severity, $result['severity']);
                }
            }
        }

        // If content is flagged, handle based on severity
        if (!empty($flaggedContent)) {
            $this->logModerationEvent($request, $flaggedContent, $severity);

            // High severity content is blocked immediately
            if ($severity >= 8) {
                return response()->json([
                    'success' => false,
                    'message' => 'Content contains prohibited material and cannot be posted.',
                    'error_code' => 'CONTENT_BLOCKED'
                ], 422);
            }

            // Medium severity content requires approval
            if ($severity >= 5) {
                $request->merge(['requires_approval' => true]);
                $request->merge(['moderation_note' => 'Flagged for manual review']);
            }

            // Low severity content gets a warning but is allowed
            if ($severity >= 3) {
                $request->merge(['content_warning' => true]);
            }
        }

        // Apply rate limiting for content creation
        $this->applyContentRateLimit($request);

        return $next($request);
    }

    /**
     * Moderate content for banned words and inappropriate material
     */
    private function moderateContent(string $content): array
    {
        $content = strtolower($content);
        $flagged = false;
        $severity = 0;
        $reasons = [];

        // Check for banned words
        foreach ($this->bannedWords as $word) {
            if (strpos($content, strtolower($word)) !== false) {
                $flagged = true;
                $severity += 3;
                $reasons[] = "Contains banned word: {$word}";
            }
        }

        // Check for excessive caps (potential spam)
        $capsRatio = $this->calculateCapsRatio($content);
        if ($capsRatio > 0.7) {
            $flagged = true;
            $severity += 2;
            $reasons[] = 'Excessive use of capital letters';
        }

        // Check for repeated characters (potential spam)
        if (preg_match('/(.)\1{4,}/', $content)) {
            $flagged = true;
            $severity += 2;
            $reasons[] = 'Excessive repeated characters';
        }

        // Check for URLs (potential spam)
        if (preg_match('/https?:\/\//', $content)) {
            $flagged = true;
            $severity += 1;
            $reasons[] = 'Contains URLs';
        }

        return [
            'flagged' => $flagged,
            'severity' => $severity,
            'reasons' => $reasons
        ];
    }

    /**
     * Calculate the ratio of capital letters in content
     */
    private function calculateCapsRatio(string $content): float
    {
        $letters = preg_replace('/[^a-zA-Z]/', '', $content);
        if (strlen($letters) === 0) return 0;
        
        $caps = preg_replace('/[^A-Z]/', '', $letters);
        return strlen($caps) / strlen($letters);
    }

    /**
     * Apply rate limiting for content creation
     */
    private function applyContentRateLimit(Request $request): void
    {
        $user = $request->user();
        $key = 'content_rate_limit:' . ($user ? $user->id : $request->ip());
        
        $attempts = Cache::get($key, 0);
        Cache::put($key, $attempts + 1, now()->addMinutes(15));

        // Store rate limit info in request for potential use by controllers
        $request->merge(['rate_limit_attempts' => $attempts + 1]);
    }

    /**
     * Log moderation events for analysis
     */
    private function logModerationEvent(Request $request, array $flaggedContent, int $severity): void
    {
        Log::channel('moderation')->info('Content flagged by moderation middleware', [
            'user_id' => $request->user()?->id,
            'ip' => $request->ip(),
            'route' => $request->route()?->getName(),
            'flagged_content' => $flaggedContent,
            'severity' => $severity,
            'timestamp' => now()
        ]);
    }
}

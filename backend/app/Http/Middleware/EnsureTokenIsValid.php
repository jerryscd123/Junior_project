<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTokenIsValid
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated via Sanctum
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Valid token required.',
                'error_code' => 'TOKEN_INVALID'
            ], 401);
        }

        // Check if the token is valid and not expired
        $user = $request->user();
        $token = $user->currentAccessToken();
        
        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired token.',
                'error_code' => 'TOKEN_EXPIRED'
            ], 401);
        }

        // Optional: Check token abilities/scopes if needed
        // This can be extended later for more granular permissions
        
        return $next($request);
    }
}

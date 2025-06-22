<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required.',
                'error_code' => 'UNAUTHENTICATED'
            ], 401);
        }

        $user = $request->user();

        // Check if user has admin role
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Admin privileges required.',
                'error_code' => 'INSUFFICIENT_PRIVILEGES'
            ], 403);
        }

        return $next($request);
    }
}

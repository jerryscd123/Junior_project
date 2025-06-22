<?php

namespace App\Utils;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class ResponseHelper
{
    /**
     * Standard HTTP status codes
     */
    public const HTTP_OK = 200;
    public const HTTP_CREATED = 201;
    public const HTTP_ACCEPTED = 202;
    public const HTTP_NO_CONTENT = 204;
    public const HTTP_BAD_REQUEST = 400;
    public const HTTP_UNAUTHORIZED = 401;
    public const HTTP_FORBIDDEN = 403;
    public const HTTP_NOT_FOUND = 404;
    public const HTTP_METHOD_NOT_ALLOWED = 405;
    public const HTTP_CONFLICT = 409;
    public const HTTP_UNPROCESSABLE_ENTITY = 422;
    public const HTTP_TOO_MANY_REQUESTS = 429;
    public const HTTP_INTERNAL_SERVER_ERROR = 500;
    public const HTTP_SERVICE_UNAVAILABLE = 503;

    /**
     * Success response
     *
     * @param mixed $data
     * @param string $message
     * @param int $statusCode
     * @param array $meta
     * @return JsonResponse
     */
    public static function success($data = null, string $message = 'Success', int $statusCode = self::HTTP_OK, array $meta = []): JsonResponse
    {
        $response = [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ];

        if (!empty($meta)) {
            $response['meta'] = $meta;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Error response
     *
     * @param string $message
     * @param int $statusCode
     * @param mixed $errors
     * @param array $meta
     * @return JsonResponse
     */
    public static function error(string $message = 'An error occurred', int $statusCode = self::HTTP_BAD_REQUEST, $errors = null, array $meta = []): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        if (!empty($meta)) {
            $response['meta'] = $meta;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Validation error response
     *
     * @param array $errors
     * @param string $message
     * @return JsonResponse
     */
    public static function validationError(array $errors, string $message = 'Validation failed'): JsonResponse
    {
        return self::error($message, self::HTTP_UNPROCESSABLE_ENTITY, $errors);
    }

    /**
     * Not found response
     *
     * @param string $message
     * @return JsonResponse
     */
    public static function notFound(string $message = 'Resource not found'): JsonResponse
    {
        return self::error($message, self::HTTP_NOT_FOUND);
    }

    /**
     * Unauthorized response
     *
     * @param string $message
     * @return JsonResponse
     */
    public static function unauthorized(string $message = 'Unauthorized'): JsonResponse
    {
        return self::error($message, self::HTTP_UNAUTHORIZED);
    }

    /**
     * Forbidden response
     *
     * @param string $message
     * @return JsonResponse
     */
    public static function forbidden(string $message = 'Forbidden'): JsonResponse
    {
        return self::error($message, self::HTTP_FORBIDDEN);
    }

    /**
     * Created response
     *
     * @param mixed $data
     * @param string $message
     * @return JsonResponse
     */
    public static function created($data = null, string $message = 'Resource created successfully'): JsonResponse
    {
        return self::success($data, $message, self::HTTP_CREATED);
    }

    /**
     * Updated response
     *
     * @param mixed $data
     * @param string $message
     * @return JsonResponse
     */
    public static function updated($data = null, string $message = 'Resource updated successfully'): JsonResponse
    {
        return self::success($data, $message, self::HTTP_OK);
    }

    /**
     * Deleted response
     *
     * @param string $message
     * @return JsonResponse
     */
    public static function deleted(string $message = 'Resource deleted successfully'): JsonResponse
    {
        return self::success(null, $message, self::HTTP_OK);
    }

    /**
     * No content response
     *
     * @return JsonResponse
     */
    public static function noContent(): JsonResponse
    {
        return response()->json(null, self::HTTP_NO_CONTENT);
    }

    /**
     * Paginated response
     *
     * @param LengthAwarePaginator $paginator
     * @param string $message
     * @return JsonResponse
     */
    public static function paginated(LengthAwarePaginator $paginator, string $message = 'Data retrieved successfully'): JsonResponse
    {
        $meta = [
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
                'has_more_pages' => $paginator->hasMorePages(),
            ],
        ];

        return self::success($paginator->items(), $message, self::HTTP_OK, $meta);
    }

    /**
     * Collection response with metadata
     *
     * @param Collection $collection
     * @param string $message
     * @param array $meta
     * @return JsonResponse
     */
    public static function collection(Collection $collection, string $message = 'Data retrieved successfully', array $meta = []): JsonResponse
    {
        $defaultMeta = [
            'count' => $collection->count(),
        ];

        $meta = array_merge($defaultMeta, $meta);

        return self::success($collection->values(), $message, self::HTTP_OK, $meta);
    }

    /**
     * Rate limit exceeded response
     *
     * @param string $message
     * @param int $retryAfter
     * @return JsonResponse
     */
    public static function rateLimitExceeded(string $message = 'Rate limit exceeded', int $retryAfter = 60): JsonResponse
    {
        $meta = [
            'retry_after' => $retryAfter,
        ];

        return self::error($message, self::HTTP_TOO_MANY_REQUESTS, null, $meta);
    }

    /**
     * Server error response
     *
     * @param string $message
     * @param mixed $debug
     * @return JsonResponse
     */
    public static function serverError(string $message = 'Internal server error', $debug = null): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        // Only include debug information in development
        if (app()->environment('local', 'development') && $debug !== null) {
            $response['debug'] = $debug;
        }

        return response()->json($response, self::HTTP_INTERNAL_SERVER_ERROR);
    }

    /**
     * Service unavailable response
     *
     * @param string $message
     * @param int $retryAfter
     * @return JsonResponse
     */
    public static function serviceUnavailable(string $message = 'Service temporarily unavailable', int $retryAfter = 300): JsonResponse
    {
        $meta = [
            'retry_after' => $retryAfter,
        ];

        return self::error($message, self::HTTP_SERVICE_UNAVAILABLE, null, $meta);
    }

    /**
     * Conflict response
     *
     * @param string $message
     * @param mixed $conflicts
     * @return JsonResponse
     */
    public static function conflict(string $message = 'Resource conflict', $conflicts = null): JsonResponse
    {
        return self::error($message, self::HTTP_CONFLICT, $conflicts);
    }

    /**
     * Custom response with flexible structure
     *
     * @param array $data
     * @param int $statusCode
     * @return JsonResponse
     */
    public static function custom(array $data, int $statusCode = self::HTTP_OK): JsonResponse
    {
        return response()->json($data, $statusCode);
    }

    /**
     * API response with standardized format for resources
     *
     * @param mixed $resource
     * @param string $message
     * @param string $type
     * @return JsonResponse
     */
    public static function resource($resource, string $message = 'Success', string $type = 'data'): JsonResponse
    {
        if ($resource instanceof LengthAwarePaginator) {
            return self::paginated($resource, $message);
        }

        if ($resource instanceof Collection) {
            return self::collection($resource, $message);
        }

        return self::success($resource, $message);
    }

    /**
     * Authentication success response
     *
     * @param array $user
     * @param string $token
     * @param string $message
     * @return JsonResponse
     */
    public static function authSuccess(array $user, string $token, string $message = 'Authentication successful'): JsonResponse
    {
        $data = [
            'user' => $user,
            'token' => $token,
            'token_type' => 'Bearer',
        ];

        return self::success($data, $message);
    }

    /**
     * Logout success response
     *
     * @param string $message
     * @return JsonResponse
     */
    public static function logoutSuccess(string $message = 'Logged out successfully'): JsonResponse
    {
        return self::success(null, $message);
    }

    /**
     * Content moderation response
     *
     * @param bool $approved
     * @param string $reason
     * @param array $analysis
     * @return JsonResponse
     */
    public static function moderationResult(bool $approved, string $reason = '', array $analysis = []): JsonResponse
    {
        $data = [
            'approved' => $approved,
            'status' => $approved ? 'approved' : 'rejected',
            'reason' => $reason,
        ];

        if (!empty($analysis)) {
            $data['analysis'] = $analysis;
        }

        $message = $approved ? 'Content approved' : 'Content requires moderation';

        return self::success($data, $message);
    }

    /**
     * File upload response
     *
     * @param array $fileData
     * @param string $message
     * @return JsonResponse
     */
    public static function fileUpload(array $fileData, string $message = 'File uploaded successfully'): JsonResponse
    {
        return self::success($fileData, $message);
    }

    /**
     * Notification response
     *
     * @param array $notifications
     * @param int $unreadCount
     * @param string $message
     * @return JsonResponse
     */
    public static function notifications(array $notifications, int $unreadCount = 0, string $message = 'Notifications retrieved'): JsonResponse
    {
        $meta = [
            'unread_count' => $unreadCount,
            'total_count' => count($notifications),
        ];

        return self::success($notifications, $message, self::HTTP_OK, $meta);
    }

    /**
     * Search results response
     *
     * @param array $results
     * @param string $query
     * @param int $totalResults
     * @param string $message
     * @return JsonResponse
     */
    public static function searchResults(array $results, string $query, int $totalResults = 0, string $message = 'Search completed'): JsonResponse
    {
        $meta = [
            'query' => $query,
            'total_results' => $totalResults,
            'results_count' => count($results),
        ];

        return self::success($results, $message, self::HTTP_OK, $meta);
    }

    /**
     * Statistics response
     *
     * @param array $stats
     * @param string $message
     * @return JsonResponse
     */
    public static function statistics(array $stats, string $message = 'Statistics retrieved'): JsonResponse
    {
        $meta = [
            'generated_at' => now()->toISOString(),
        ];

        return self::success($stats, $message, self::HTTP_OK, $meta);
    }

    /**
     * Health check response
     *
     * @param array $checks
     * @param bool $healthy
     * @return JsonResponse
     */
    public static function healthCheck(array $checks, bool $healthy = true): JsonResponse
    {
        $statusCode = $healthy ? self::HTTP_OK : self::HTTP_SERVICE_UNAVAILABLE;
        $message = $healthy ? 'System healthy' : 'System issues detected';

        $data = [
            'status' => $healthy ? 'healthy' : 'unhealthy',
            'checks' => $checks,
            'timestamp' => now()->toISOString(),
        ];

        return response()->json($data, $statusCode);
    }

    /**
     * Get HTTP status text
     *
     * @param int $statusCode
     * @return string
     */
    public static function getStatusText(int $statusCode): string
    {
        $statusTexts = [
            self::HTTP_OK => 'OK',
            self::HTTP_CREATED => 'Created',
            self::HTTP_ACCEPTED => 'Accepted',
            self::HTTP_NO_CONTENT => 'No Content',
            self::HTTP_BAD_REQUEST => 'Bad Request',
            self::HTTP_UNAUTHORIZED => 'Unauthorized',
            self::HTTP_FORBIDDEN => 'Forbidden',
            self::HTTP_NOT_FOUND => 'Not Found',
            self::HTTP_METHOD_NOT_ALLOWED => 'Method Not Allowed',
            self::HTTP_CONFLICT => 'Conflict',
            self::HTTP_UNPROCESSABLE_ENTITY => 'Unprocessable Entity',
            self::HTTP_TOO_MANY_REQUESTS => 'Too Many Requests',
            self::HTTP_INTERNAL_SERVER_ERROR => 'Internal Server Error',
            self::HTTP_SERVICE_UNAVAILABLE => 'Service Unavailable',
        ];

        return $statusTexts[$statusCode] ?? 'Unknown Status';
    }
} 
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Utils\ResponseHelper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class NotificationController extends Controller
{
    /**
     * List user notifications
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Validate query parameters
            $request->validate([
                'per_page' => 'integer|min:1|max:100',
                'page' => 'integer|min:1',
                'type' => ['string', Rule::in(Notification::TYPES)],
                'is_read' => 'nullable|boolean',
                'sort' => 'string|in:latest,oldest',
            ]);

            // Build query
            $query = Notification::where('user_id', $user->id);

            // Apply filters
            if ($request->has('type')) {
                $query->ofType($request->type);
            }

            if ($request->has('is_read') && $request->input('is_read') !== null) {
                if ($request->boolean('is_read')) {
                    $query->read();
                } else {
                    $query->unread();
                }
            }

            // Apply sorting
            $sort = $request->get('sort', 'latest');
            if ($sort === 'oldest') {
                $query->orderBy('created_at', 'asc');
            } else {
                $query->latest();
            }

            // Paginate results
            $perPage = $request->get('per_page', 15);
            $notifications = $query->paginate($perPage);

            // Transform notifications for response
            $transformedNotifications = $notifications->getCollection()->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'title' => $notification->getTitle(),
                    'message' => $notification->getMessage(),
                    'data' => $notification->data,
                    'url' => $notification->getUrl(),
                    'is_read' => $notification->is_read,
                    'created_at' => $notification->created_at,
                    'updated_at' => $notification->updated_at,
                ];
            });

            // Get unread count
            $unreadCount = Notification::getUnreadCountForUser($user->id);

            // Prepare pagination meta
            $meta = [
                'pagination' => [
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage(),
                    'per_page' => $notifications->perPage(),
                    'total' => $notifications->total(),
                    'from' => $notifications->firstItem(),
                    'to' => $notifications->lastItem(),
                    'has_more_pages' => $notifications->hasMorePages(),
                ],
                'unread_count' => $unreadCount,
                'filters' => [
                    'type' => $request->get('type'),
                    'is_read' => $request->get('is_read'),
                    'sort' => $sort,
                ],
            ];

            return ResponseHelper::success(
                $transformedNotifications->toArray(),
                'Notifications retrieved successfully',
                200,
                $meta
            );

        } catch (\Illuminate\Validation\ValidationException $e) {
            return ResponseHelper::validationError($e->errors(), 'Invalid parameters');
        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve notifications: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Mark notifications as read
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function markAsRead(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Validate request
            $request->validate([
                'notification_ids' => 'array|min:1',
                'notification_ids.*' => 'integer|exists:notifications,id',
                'mark_all' => 'boolean',
            ]);

            $markedCount = 0;

            if ($request->boolean('mark_all')) {
                // Mark all notifications as read for the user
                $markedCount = Notification::markAllAsReadForUser($user->id);
                $message = $markedCount > 0 
                    ? "All notifications marked as read ({$markedCount} notifications)" 
                    : 'No unread notifications found';
            } else {
                // Mark specific notifications as read
                $notificationIds = $request->get('notification_ids', []);
                
                if (empty($notificationIds)) {
                    return ResponseHelper::validationError(
                        ['notification_ids' => ['Please provide notification IDs or set mark_all to true']],
                        'Invalid request'
                    );
                }

                // Verify all notifications belong to the user
                $userNotifications = Notification::where('user_id', $user->id)
                    ->whereIn('id', $notificationIds)
                    ->pluck('id')
                    ->toArray();

                if (count($userNotifications) !== count($notificationIds)) {
                    return ResponseHelper::forbidden('You can only mark your own notifications as read');
                }

                // Mark notifications as read
                $markedCount = Notification::markMultipleAsRead($notificationIds);
                $message = $markedCount > 0 
                    ? "Notifications marked as read ({$markedCount} notifications)" 
                    : 'No notifications were updated';
            }

            // Get updated unread count
            $unreadCount = Notification::getUnreadCountForUser($user->id);

            $responseData = [
                'marked_count' => $markedCount,
                'unread_count' => $unreadCount,
            ];

            return ResponseHelper::success($responseData, $message);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return ResponseHelper::validationError($e->errors(), 'Invalid parameters');
        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to mark notifications as read: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get notification statistics for the user
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            $stats = [
                'total_notifications' => Notification::where('user_id', $user->id)->count(),
                'unread_notifications' => Notification::getUnreadCountForUser($user->id),
                'read_notifications' => Notification::where('user_id', $user->id)->read()->count(),
                'notifications_by_type' => [],
            ];

            // Get count by type
            foreach (Notification::TYPES as $type) {
                $stats['notifications_by_type'][$type] = Notification::where('user_id', $user->id)
                    ->ofType($type)
                    ->count();
            }

            return ResponseHelper::success($stats, 'Notification statistics retrieved successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve notification statistics: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Mark a single notification as read
     *
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function markSingleAsRead(Request $request, string $id): JsonResponse
    {
        try {
            $user = $request->user();

            $notification = Notification::where('user_id', $user->id)
                ->where('id', $id)
                ->first();

            if (!$notification) {
                return ResponseHelper::notFound('Notification not found');
            }

            if ($notification->is_read) {
                return ResponseHelper::success(
                    ['is_read' => true],
                    'Notification was already marked as read'
                );
            }

            $notification->markAsRead();

            $unreadCount = Notification::getUnreadCountForUser($user->id);

            $responseData = [
                'notification' => [
                    'id' => $notification->id,
                    'is_read' => $notification->is_read,
                    'updated_at' => $notification->updated_at,
                ],
                'unread_count' => $unreadCount,
            ];

            return ResponseHelper::success($responseData, 'Notification marked as read');

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to mark notification as read: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a notification
     *
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        try {
            $user = $request->user();

            $notification = Notification::where('user_id', $user->id)
                ->where('id', $id)
                ->first();

            if (!$notification) {
                return ResponseHelper::notFound('Notification not found');
            }

            $notification->delete();

            $unreadCount = Notification::getUnreadCountForUser($user->id);

            return ResponseHelper::success(
                ['unread_count' => $unreadCount],
                'Notification deleted successfully'
            );

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to delete notification: ' . $e->getMessage(), 500);
        }
    }
}

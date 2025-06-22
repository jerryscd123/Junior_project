<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendMessageRequest;
use App\Models\Message;
use App\Models\User;
use App\Utils\ResponseHelper;
use App\Utils\NotificationHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MessageController extends Controller
{
    /**
     * Display a listing of the user's messages.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            
            // Get query parameters
            $perPage = min($request->get('per_page', 15), 50); // Max 50 per page
            $status = $request->get('status');
            $search = $request->get('search');
            
            // Build query
            $query = Message::forUser($user->id)
                ->with(['admin:id,name'])
                ->latest();
            
            // Apply status filter if provided
            if ($status && Message::isValidStatus($status)) {
                $query->byStatus($status);
            }
            
            // Apply search filter if provided
            if ($search) {
                $query->search($search);
            }
            
            // Get paginated results
            $messages = $query->paginate($perPage);
            
            // Transform the data
            $transformedMessages = $messages->getCollection()->map(function ($message) {
                return [
                    'id' => $message->id,
                    'subject' => $message->subject,
                    'content' => $message->content,
                    'status' => $message->status,
                    'status_display' => $message->getStatusDisplayText(),
                    'status_color' => $message->getStatusBadgeColor(),
                    'admin_name' => $message->getAdminName(),
                    'is_unread' => $message->isUnread(),
                    'is_read' => $message->isRead(),
                    'is_responded' => $message->isResponded(),
                    'created_at' => $message->created_at,
                    'updated_at' => $message->updated_at,
                ];
            });
            
            // Replace the collection in paginator
            $messages->setCollection($transformedMessages);
            
            // Get message statistics
            $stats = [
                'total_messages' => Message::forUser($user->id)->count(),
                'unread_count' => Message::forUser($user->id)->unread()->count(),
                'read_count' => Message::forUser($user->id)->read()->count(),
                'responded_count' => Message::forUser($user->id)->responded()->count(),
            ];
            
            // Create custom meta data that includes both pagination and stats
            $meta = [
                'pagination' => [
                    'current_page' => $messages->currentPage(),
                    'last_page' => $messages->lastPage(),
                    'per_page' => $messages->perPage(),
                    'total' => $messages->total(),
                    'from' => $messages->firstItem(),
                    'to' => $messages->lastItem(),
                    'has_more_pages' => $messages->hasMorePages(),
                ],
                'stats' => $stats,
            ];
            
            return ResponseHelper::success(
                $messages->items(),
                'Messages retrieved successfully',
                ResponseHelper::HTTP_OK,
                $meta
            );
            
        } catch (\Exception $e) {
            Log::error('Error retrieving user messages', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return ResponseHelper::serverError('Failed to retrieve messages');
        }
    }

    /**
     * Send a message to admin.
     *
     * @param SendMessageRequest $request
     * @return JsonResponse
     */
    public function store(SendMessageRequest $request): JsonResponse
    {
        try {
            $user = Auth::user();
            
            // Check rate limiting - prevent spam
            $recentMessagesCount = Message::forUser($user->id)
                ->where('created_at', '>=', now()->subHour())
                ->count();
                
            if ($recentMessagesCount >= 5) {
                return ResponseHelper::rateLimitExceeded(
                    'You can only send 5 messages per hour. Please try again later.',
                    3600
                );
            }
            
            DB::beginTransaction();
            
            try {
                // Create the message
                $message = Message::sendToAdmin(
                    $user->id,
                    $request->subject,
                    $request->content
                );
                
                // Load the admin relationship for response
                $message->load(['admin:id,name']);
                
                // Create notification for admins
                $admins = User::where('role', 'admin')->get();
                foreach ($admins as $admin) {
                    NotificationHelper::createAdminMessageNotification(
                        $admin->id,
                        $request->subject,
                        "New message from {$user->name}: " . substr($request->content, 0, 100) . (strlen($request->content) > 100 ? '...' : ''),
                        $message->id
                    );
                }
                
                DB::commit();
                
                // Transform the response data
                $responseData = [
                    'id' => $message->id,
                    'subject' => $message->subject,
                    'content' => $message->content,
                    'status' => $message->status,
                    'status_display' => $message->getStatusDisplayText(),
                    'status_color' => $message->getStatusBadgeColor(),
                    'admin_name' => $message->getAdminName(),
                    'is_unread' => $message->isUnread(),
                    'is_read' => $message->isRead(),
                    'is_responded' => $message->isResponded(),
                    'created_at' => $message->created_at,
                    'updated_at' => $message->updated_at,
                ];
                
                return ResponseHelper::created(
                    $responseData,
                    'Message sent successfully. An admin will respond to you soon.'
                );
                
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
            
        } catch (\Exception $e) {
            Log::error('Error sending message to admin', [
                'user_id' => Auth::id(),
                'subject' => $request->subject ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return ResponseHelper::serverError('Failed to send message. Please try again later.');
        }
    }

    /**
     * Mark a message as read (when user views it).
     *
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        try {
            $user = Auth::user();
            
            $message = Message::forUser($user->id)->findOrFail($id);
            
            if ($message->markAsRead()) {
                return ResponseHelper::success(
                    ['status' => $message->status],
                    'Message marked as read'
                );
            }
            
            return ResponseHelper::success(
                ['status' => $message->status],
                'Message status unchanged'
            );
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return ResponseHelper::notFound('Message not found');
        } catch (\Exception $e) {
            Log::error('Error marking message as read', [
                'user_id' => Auth::id(),
                'message_id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return ResponseHelper::serverError('Failed to update message status');
        }
    }

    /**
     * Get message statistics for the authenticated user.
     *
     * @return JsonResponse
     */
    public function getStats(): JsonResponse
    {
        try {
            $user = Auth::user();
            
            $stats = [
                'total_messages' => Message::forUser($user->id)->count(),
                'unread_count' => Message::forUser($user->id)->unread()->count(),
                'read_count' => Message::forUser($user->id)->read()->count(),
                'responded_count' => Message::forUser($user->id)->responded()->count(),
                'recent_messages' => Message::forUser($user->id)
                    ->where('created_at', '>=', now()->subDays(7))
                    ->count(),
            ];
            
            return ResponseHelper::success($stats, 'Message statistics retrieved successfully');
            
        } catch (\Exception $e) {
            Log::error('Error retrieving message statistics', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);
            
            return ResponseHelper::serverError('Failed to retrieve message statistics');
        }
    }

    /**
     * Get a specific message for the authenticated user.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        try {
            $user = Auth::user();
            
            $message = Message::forUser($user->id)
                ->with(['admin:id,name'])
                ->findOrFail($id);
            
            // Mark as read when viewing
            $message->markAsRead();
            
            $responseData = [
                'id' => $message->id,
                'subject' => $message->subject,
                'content' => $message->content,
                'status' => $message->status,
                'status_display' => $message->getStatusDisplayText(),
                'status_color' => $message->getStatusBadgeColor(),
                'admin_name' => $message->getAdminName(),
                'is_unread' => $message->isUnread(),
                'is_read' => $message->isRead(),
                'is_responded' => $message->isResponded(),
                'created_at' => $message->created_at,
                'updated_at' => $message->updated_at,
            ];
            
            return ResponseHelper::success($responseData, 'Message retrieved successfully');
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return ResponseHelper::notFound('Message not found');
        } catch (\Exception $e) {
            Log::error('Error retrieving message', [
                'user_id' => Auth::id(),
                'message_id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return ResponseHelper::serverError('Failed to retrieve message');
        }
    }
}

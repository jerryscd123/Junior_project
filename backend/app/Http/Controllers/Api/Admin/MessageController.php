<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReplyMessageRequest;
use App\Models\Message;
use App\Models\User;
use App\Utils\ResponseHelper;
use App\Utils\NotificationHelper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MessageController extends Controller
{
    /**
     * Display a listing of all messages for admin review.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Ensure user is admin
            if (!Auth::check() || Auth::user()->role !== 'admin') {
                return ResponseHelper::error('Unauthorized access', 403);
            }

            // Get query parameters
            $perPage = min($request->get('per_page', 15), 50); // Max 50 per page
            $status = $request->get('status');
            $search = $request->get('search');
            $userId = $request->get('user_id');
            $adminId = $request->get('admin_id');
            $sortBy = $request->get('sort_by', 'latest');

            // Build query
            $query = Message::with(['user:id,name,email,avatar', 'admin:id,name'])
                ->latest();

            // Apply status filter if provided
            if ($status && Message::isValidStatus($status)) {
                $query->byStatus($status);
            }

            // Apply search filter if provided
            if ($search) {
                $query->search($search);
            }

            // Filter by specific user
            if ($userId) {
                $query->forUser($userId);
            }

            // Filter by specific admin
            if ($adminId) {
                $query->forAdmin($adminId);
            }

            // Date range filters
            if ($request->has('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            // Sorting options
            switch ($sortBy) {
                case 'oldest':
                    $query->oldest();
                    break;
                case 'unread_first':
                    $query->orderByRaw("CASE WHEN status = 'unread' THEN 0 ELSE 1 END")
                          ->latest();
                    break;
                case 'responded_first':
                    $query->orderByRaw("CASE WHEN status = 'responded' THEN 0 ELSE 1 END")
                          ->latest();
                    break;
                default:
                    $query->latest();
                    break;
            }

            // Get paginated results
            $messages = $query->paginate($perPage);

            // Transform the data for admin view
            $transformedMessages = $messages->getCollection()->map(function ($message) {
                return [
                    'id' => $message->id,
                    'subject' => $message->subject,
                    'content' => $message->content,
                    'status' => $message->status,
                    'status_display' => $message->getStatusDisplayText(),
                    'status_color' => $message->getStatusBadgeColor(),
                    'sender' => [
                        'id' => $message->user?->id,
                        'name' => $message->getSenderName(),
                        'email' => $message->user?->email,
                        'avatar' => $message->user?->avatar,
                    ],
                    'admin' => [
                        'id' => $message->admin?->id,
                        'name' => $message->getAdminName(),
                    ],
                    'is_unread' => $message->isUnread(),
                    'is_read' => $message->isRead(),
                    'is_responded' => $message->isResponded(),
                    'created_at' => $message->created_at,
                    'updated_at' => $message->updated_at,
                ];
            });

            // Replace the collection in paginator
            $messages->setCollection($transformedMessages);

            // Get message statistics for admin dashboard
            $stats = [
                'total_messages' => Message::count(),
                'unread_count' => Message::unread()->count(),
                'read_count' => Message::read()->count(),
                'responded_count' => Message::responded()->count(),
                'messages_today' => Message::whereDate('created_at', today())->count(),
                'messages_this_week' => Message::where('created_at', '>=', now()->startOfWeek())->count(),
                'messages_this_month' => Message::where('created_at', '>=', now()->startOfMonth())->count(),
            ];

            // Get top users by message count (for admin insights)
            $topUsers = Message::select('user_id', DB::raw('count(*) as message_count'))
                ->with('user:id,name,email')
                ->groupBy('user_id')
                ->orderBy('message_count', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($item) {
                    return [
                        'user_id' => $item->user_id,
                        'user_name' => $item->user?->name ?? 'Unknown User',
                        'user_email' => $item->user?->email,
                        'message_count' => $item->message_count,
                    ];
                });

            // Create custom meta data that includes pagination, stats, and top users
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
                'top_users' => $topUsers,
            ];

            return ResponseHelper::success(
                $messages->items(),
                'Messages retrieved successfully',
                ResponseHelper::HTTP_OK,
                $meta
            );

        } catch (\Exception $e) {
            Log::error('Error retrieving admin messages', [
                'admin_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return ResponseHelper::serverError('Failed to retrieve messages');
        }
    }

    /**
     * Reply to a user message.
     *
     * @param ReplyMessageRequest $request
     * @param string $id
     * @return JsonResponse
     */
    public function reply(ReplyMessageRequest $request, string $id): JsonResponse
    {
        try {
            $admin = Auth::user();
            
            // Find the original message
            $originalMessage = Message::with(['user:id,name,email'])->findOrFail($id);
            
            // Check if message can be replied to
            if (!$originalMessage->user) {
                return ResponseHelper::error('Cannot reply to message from deleted user', 400);
            }

            DB::beginTransaction();

            try {
                // Mark original message as responded
                $originalMessage->markAsResponded();
                
                // Update the admin who responded
                $originalMessage->to_admin_id = $admin->id;
                $originalMessage->save();

                // Create a new message as the admin's reply
                $replyMessage = Message::create([
                    'user_id' => $admin->id, // Admin is the sender of the reply
                    'to_admin_id' => null, // This is a reply, not a message to admin
                    'subject' => 'Re: ' . $originalMessage->subject,
                    'content' => $request->content,
                    'status' => 'read', // Admin replies are automatically marked as read
                ]);

                // Create notification for the original sender
                NotificationHelper::createNotification(
                    $originalMessage->user_id,
                    'admin_message',
                    [
                        'message_id' => $replyMessage->id,
                        'original_message_id' => $originalMessage->id,
                        'subject' => $replyMessage->subject,
                        'content_preview' => substr($request->content, 0, 100) . (strlen($request->content) > 100 ? '...' : ''),
                        'admin_name' => $admin->name,
                        'replied_at' => now()->toISOString(),
                        'message' => "Admin {$admin->name} has replied to your message: {$originalMessage->subject}",
                    ]
                );

                DB::commit();

                // Load relationships for response
                $originalMessage->load(['user:id,name,email,avatar', 'admin:id,name']);
                $replyMessage->load(['user:id,name']);

                $responseData = [
                    'original_message' => [
                        'id' => $originalMessage->id,
                        'subject' => $originalMessage->subject,
                        'content' => $originalMessage->content,
                        'status' => $originalMessage->status,
                        'status_display' => $originalMessage->getStatusDisplayText(),
                        'sender' => [
                            'id' => $originalMessage->user?->id,
                            'name' => $originalMessage->getSenderName(),
                            'email' => $originalMessage->user?->email,
                            'avatar' => $originalMessage->user?->avatar,
                        ],
                        'admin' => [
                            'id' => $originalMessage->admin?->id,
                            'name' => $originalMessage->getAdminName(),
                        ],
                        'created_at' => $originalMessage->created_at,
                        'updated_at' => $originalMessage->updated_at,
                    ],
                    'reply_message' => [
                        'id' => $replyMessage->id,
                        'subject' => $replyMessage->subject,
                        'content' => $replyMessage->content,
                        'status' => $replyMessage->status,
                        'admin_name' => $admin->name,
                        'created_at' => $replyMessage->created_at,
                    ],
                    'replied_by' => $admin->name,
                    'replied_at' => now(),
                ];

                return ResponseHelper::success(
                    $responseData,
                    'Reply sent successfully. The user has been notified.'
                );

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return ResponseHelper::error('Message not found', 404);
        } catch (\Exception $e) {
            Log::error('Error replying to message', [
                'admin_id' => Auth::id(),
                'message_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return ResponseHelper::serverError('Failed to send reply. Please try again later.');
        }
    }

    /**
     * Get message statistics for admin dashboard.
     *
     * @return JsonResponse
     */
    public function getStats(): JsonResponse
    {
        try {
            // Ensure user is admin
            if (!Auth::check() || Auth::user()->role !== 'admin') {
                return ResponseHelper::error('Unauthorized access', 403);
            }

            $stats = [
                'total_messages' => Message::count(),
                'unread_count' => Message::unread()->count(),
                'read_count' => Message::read()->count(),
                'responded_count' => Message::responded()->count(),
                'messages_today' => Message::whereDate('created_at', today())->count(),
                'messages_this_week' => Message::where('created_at', '>=', now()->startOfWeek())->count(),
                'messages_this_month' => Message::where('created_at', '>=', now()->startOfMonth())->count(),
                'average_response_time_hours' => $this->getAverageResponseTime(),
                'pending_messages' => Message::whereIn('status', ['unread', 'read'])->count(),
            ];

            // Get recent activity
            $recentMessages = Message::with(['user:id,name', 'admin:id,name'])
                ->latest()
                ->limit(5)
                ->get()
                ->map(function ($message) {
                    return [
                        'id' => $message->id,
                        'subject' => $message->subject,
                        'sender_name' => $message->getSenderName(),
                        'admin_name' => $message->getAdminName(),
                        'status' => $message->status,
                        'created_at' => $message->created_at,
                    ];
                });

            return ResponseHelper::success([
                'stats' => $stats,
                'recent_messages' => $recentMessages,
            ], 'Message statistics retrieved successfully');

        } catch (\Exception $e) {
            Log::error('Error retrieving message statistics', [
                'admin_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return ResponseHelper::serverError('Failed to retrieve statistics');
        }
    }

    /**
     * Calculate average response time in hours.
     *
     * @return float
     */
    private function getAverageResponseTime(): float
    {
        $respondedMessages = Message::where('status', 'responded')
            ->where('updated_at', '>', 'created_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_hours')
            ->first();

        return round($respondedMessages->avg_hours ?? 0, 2);
    }

    /**
     * Mark a message as read by admin.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function markAsRead(string $id): JsonResponse
    {
        try {
            // Ensure user is admin
            if (!Auth::check() || Auth::user()->role !== 'admin') {
                return ResponseHelper::error('Unauthorized access', 403);
            }

            $message = Message::findOrFail($id);

            if ($message->markAsRead()) {
                return ResponseHelper::success(
                    ['status' => $message->status],
                    'Message marked as read'
                );
            }

            return ResponseHelper::error('Failed to mark message as read', 500);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return ResponseHelper::error('Message not found', 404);
        } catch (\Exception $e) {
            Log::error('Error marking message as read', [
                'admin_id' => Auth::id(),
                'message_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return ResponseHelper::serverError('Failed to mark message as read');
        }
    }

    /**
     * Get unread messages with pagination.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function unread(Request $request): JsonResponse
    {
        try {
            if (!Auth::check() || Auth::user()->role !== 'admin') {
                return ResponseHelper::error('Unauthorized access', 403);
            }

            $perPage = min($request->get('per_page', 15), 100);
            $messages = Message::with(['user:id,name,email,avatar'])
                ->unread()
                ->latest()
                ->paginate($perPage);

            $messages->getCollection()->transform(function ($message) {
                return [
                    'id' => $message->id,
                    'subject' => $message->subject,
                    'content_preview' => substr($message->content, 0, 150) . (strlen($message->content) > 150 ? '...' : ''),
                    'sender' => [
                        'id' => $message->user?->id,
                        'name' => $message->getSenderName(),
                        'email' => $message->user?->email,
                        'avatar' => $message->user?->avatar,
                    ],
                    'status' => $message->status,
                    'created_at' => $message->created_at,
                ];
            });

            return ResponseHelper::success($messages, 'Unread messages retrieved successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve unread messages', 500, $e->getMessage());
        }
    }

    /**
     * Get read messages with pagination.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function read(Request $request): JsonResponse
    {
        try {
            if (!Auth::check() || Auth::user()->role !== 'admin') {
                return ResponseHelper::error('Unauthorized access', 403);
            }

            $perPage = min($request->get('per_page', 15), 100);
            $messages = Message::with(['user:id,name,email,avatar', 'admin:id,name'])
                ->read()
                ->latest()
                ->paginate($perPage);

            $messages->getCollection()->transform(function ($message) {
                return [
                    'id' => $message->id,
                    'subject' => $message->subject,
                    'content_preview' => substr($message->content, 0, 150) . (strlen($message->content) > 150 ? '...' : ''),
                    'sender' => [
                        'id' => $message->user?->id,
                        'name' => $message->getSenderName(),
                        'email' => $message->user?->email,
                        'avatar' => $message->user?->avatar,
                    ],
                    'admin' => [
                        'id' => $message->admin?->id,
                        'name' => $message->getAdminName(),
                    ],
                    'status' => $message->status,
                    'created_at' => $message->created_at,
                    'updated_at' => $message->updated_at,
                ];
            });

            return ResponseHelper::success($messages, 'Read messages retrieved successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve read messages', 500, $e->getMessage());
        }
    }

    /**
     * Get responded messages with pagination.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function responded(Request $request): JsonResponse
    {
        try {
            if (!Auth::check() || Auth::user()->role !== 'admin') {
                return ResponseHelper::error('Unauthorized access', 403);
            }

            $perPage = min($request->get('per_page', 15), 100);
            $messages = Message::with(['user:id,name,email,avatar', 'admin:id,name'])
                ->responded()
                ->latest()
                ->paginate($perPage);

            $messages->getCollection()->transform(function ($message) {
                return [
                    'id' => $message->id,
                    'subject' => $message->subject,
                    'content_preview' => substr($message->content, 0, 150) . (strlen($message->content) > 150 ? '...' : ''),
                    'sender' => [
                        'id' => $message->user?->id,
                        'name' => $message->getSenderName(),
                        'email' => $message->user?->email,
                        'avatar' => $message->user?->avatar,
                    ],
                    'admin' => [
                        'id' => $message->admin?->id,
                        'name' => $message->getAdminName(),
                    ],
                    'status' => $message->status,
                    'created_at' => $message->created_at,
                    'updated_at' => $message->updated_at,
                ];
            });

            return ResponseHelper::success($messages, 'Responded messages retrieved successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve responded messages', 500, $e->getMessage());
        }
    }

    /**
     * Get single message details.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        try {
            if (!Auth::check() || Auth::user()->role !== 'admin') {
                return ResponseHelper::error('Unauthorized access', 403);
            }

            $message = Message::with(['user:id,name,email,avatar', 'admin:id,name'])
                ->findOrFail($id);

            $messageData = [
                'id' => $message->id,
                'subject' => $message->subject,
                'content' => $message->content,
                'sender' => [
                    'id' => $message->user?->id,
                    'name' => $message->getSenderName(),
                    'email' => $message->user?->email,
                    'avatar' => $message->user?->avatar,
                ],
                'admin' => [
                    'id' => $message->admin?->id,
                    'name' => $message->getAdminName(),
                ],
                'status' => $message->status,
                'status_display' => $message->getStatusDisplayText(),
                'status_badge_color' => $message->getStatusBadgeColor(),
                'created_at' => $message->created_at,
                'updated_at' => $message->updated_at,
            ];

            return ResponseHelper::success($messageData, 'Message details retrieved successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve message details', 500, $e->getMessage());
        }
    }

    /**
     * Update message status.
     *
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        try {
            if (!Auth::check() || Auth::user()->role !== 'admin') {
                return ResponseHelper::error('Unauthorized access', 403);
            }

            $validated = $request->validate([
                'status' => 'required|in:unread,read,responded'
            ]);

            $message = Message::findOrFail($id);
            $message->updateStatus($validated['status']);

            return ResponseHelper::success([
                'id' => $message->id,
                'status' => $message->status,
                'status_display' => $message->getStatusDisplayText(),
                'updated_at' => $message->updated_at
            ], 'Message status updated successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to update message status', 500, $e->getMessage());
        }
    }

    /**
     * Get comprehensive message statistics.
     *
     * @return JsonResponse
     */
    public function statistics(): JsonResponse
    {
        try {
            if (!Auth::check() || Auth::user()->role !== 'admin') {
                return ResponseHelper::error('Unauthorized access', 403);
            }

            $statistics = Message::getMessageStatistics();

            return ResponseHelper::success($statistics, 'Message statistics retrieved successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve message statistics', 500, $e->getMessage());
        }
    }
}

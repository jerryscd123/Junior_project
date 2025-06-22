<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ModerateCommentRequest;
use App\Models\Comment;
use App\Utils\ResponseHelper;
use App\Utils\NotificationHelper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CommentController extends Controller
{
    /**
     * Display a listing of all comments for admin review.
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

            $query = Comment::with(['user:id,name,avatar', 'post:id,title,user_id']);

            // Apply filters
            if ($request->has('status')) {
                $query->byStatus($request->status);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where('content', 'like', "%{$search}%");
            }

            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->has('post_id')) {
                $query->where('post_id', $request->post_id);
            }

            if ($request->has('created_from')) {
                $query->where('created_at', '>=', $request->created_from);
            }

            if ($request->has('created_to')) {
                $query->where('created_at', '<=', $request->created_to);
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            
            switch ($sortBy) {
                case 'status':
                    $query->orderBy('status', $sortOrder);
                    break;
                default:
                    $query->orderBy('created_at', $sortOrder);
                    break;
            }

            // Pagination
            $perPage = min($request->get('per_page', 15), 100);
            $comments = $query->paginate($perPage);

            // Transform the data
            $comments->getCollection()->transform(function ($comment) {
                return [
                    'id' => $comment->id,
                    'content' => $comment->content,
                    'author' => $comment->getAuthorName(),
                    'author_id' => $comment->user_id,
                    'author_avatar' => $comment->is_anonymous ? null : $comment->user?->avatar,
                    'is_anonymous' => $comment->is_anonymous,
                    'status' => $comment->status,
                    'post' => [
                        'id' => $comment->post->id,
                        'title' => $comment->post->title,
                        'author_id' => $comment->post->user_id,
                    ],
                    'created_at' => $comment->created_at,
                    'updated_at' => $comment->updated_at,
                ];
            });

            return ResponseHelper::success($comments, 'Comments retrieved successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve comments', 500, $e->getMessage());
        }
    }

    /**
     * Display a listing of pending comments for admin review.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function pending(Request $request): JsonResponse
    {
        try {
            // Ensure user is admin
            if (!Auth::check() || Auth::user()->role !== 'admin') {
                return ResponseHelper::error('Unauthorized access', 403);
            }

            $query = Comment::with(['user:id,name,avatar', 'post:id,title,user_id'])
                ->pending() // Only show pending comments
                ->latest();

            // Apply filters
            if ($request->has('search')) {
                $search = $request->search;
                $query->where('content', 'like', "%{$search}%");
            }

            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->has('post_id')) {
                $query->where('post_id', $request->post_id);
            }

            // Date range filter
            if ($request->has('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            // Sorting options
            $sortBy = $request->get('sort_by', 'latest');
            switch ($sortBy) {
                case 'oldest':
                    $query->oldest();
                    break;
                default:
                    $query->latest();
                    break;
            }

            // Pagination
            $perPage = min($request->get('per_page', 15), 50); // Max 50 per page
            $comments = $query->paginate($perPage);

            // Transform the data for admin view
            $comments->getCollection()->transform(function ($comment) {
                return [
                    'id' => $comment->id,
                    'content' => $comment->content,
                    'author' => $comment->getAuthorName(),
                    'author_id' => $comment->user_id,
                    'author_avatar' => $comment->is_anonymous ? null : $comment->user?->avatar,
                    'is_anonymous' => $comment->is_anonymous,
                    'status' => $comment->status,
                    'post' => [
                        'id' => $comment->post->id,
                        'title' => $comment->post->title,
                        'author_id' => $comment->post->user_id,
                    ],
                    'created_at' => $comment->created_at,
                    'updated_at' => $comment->updated_at,
                ];
            });

            return ResponseHelper::success($comments, 'Pending comments retrieved successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve pending comments', 500, $e->getMessage());
        }
    }

    /**
     * Approve a pending comment.
     *
     * @param ModerateCommentRequest $request
     * @param string $id
     * @return JsonResponse
     */
    public function approve(ModerateCommentRequest $request, string $id): JsonResponse
    {
        try {
            $comment = Comment::findOrFail($id);

            // Check if comment is in pending status
            if (!$comment->isPending()) {
                return ResponseHelper::error('Only pending comments can be approved', 400);
            }

            // Validate that action is approve
            $validated = $request->validated();
            if ($validated['action'] !== 'approve') {
                return ResponseHelper::error('Invalid action for approve endpoint', 400);
            }

            DB::beginTransaction();

            // Approve the comment
            $comment->approve();

            // Send notification to comment author if not anonymous
            if ($comment->user_id) {
                NotificationHelper::createNotification(
                    $comment->user_id,
                    'comment_approved',
                    [
                        'comment_id' => $comment->id,
                        'post_id' => $comment->post_id,
                        'post_title' => $comment->post->title ?? 'Unknown Post',
                        'admin_note' => $validated['admin_note'] ?? null,
                        'message' => 'Your comment has been approved and is now visible to other users.',
                        'approved_by' => Auth::user()->name,
                        'approved_at' => now()->toISOString(),
                    ]
                );
            }

            // Create notification for post owner if comment is approved and not from post owner
            if ($comment->post && $comment->user_id && $comment->post->user_id !== $comment->user_id) {
                NotificationHelper::createCommentNotification(
                    $comment->post->user_id,
                    $comment->user_id,
                    $comment->post_id,
                    $comment->post->title,
                    $comment->id
                );
            }

            DB::commit();

            // Load relationships for response
            $comment->load(['user:id,name,avatar', 'post:id,title,user_id']);

            $responseData = [
                'id' => $comment->id,
                'content' => $comment->content,
                'author' => $comment->getAuthorName(),
                'author_id' => $comment->user_id,
                'author_avatar' => $comment->is_anonymous ? null : $comment->user?->avatar,
                'is_anonymous' => $comment->is_anonymous,
                'status' => $comment->status,
                'post' => [
                    'id' => $comment->post->id,
                    'title' => $comment->post->title,
                    'author_id' => $comment->post->user_id,
                ],
                'approved_by' => Auth::user()->name,
                'approved_at' => $comment->updated_at,
                'created_at' => $comment->created_at,
                'updated_at' => $comment->updated_at,
            ];

            return ResponseHelper::success($responseData, 'Comment approved successfully');

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return ResponseHelper::error('Comment not found', 404);
        } catch (\Exception $e) {
            DB::rollBack();
            return ResponseHelper::error('Failed to approve comment', 500, $e->getMessage());
        }
    }

    /**
     * Reject a pending comment with a note.
     *
     * @param ModerateCommentRequest $request
     * @param string $id
     * @return JsonResponse
     */
    public function reject(ModerateCommentRequest $request, string $id): JsonResponse
    {
        try {
            $comment = Comment::findOrFail($id);

            // Check if comment is in pending status
            if (!$comment->isPending()) {
                return ResponseHelper::error('Only pending comments can be rejected', 400);
            }

            // Validate that action is reject
            $validated = $request->validated();
            if ($validated['action'] !== 'reject') {
                return ResponseHelper::error('Invalid action for reject endpoint', 400);
            }

            DB::beginTransaction();

            // Reject the comment
            $comment->reject();

            // Send notification to comment author if not anonymous
            if ($comment->user_id) {
                NotificationHelper::createNotification(
                    $comment->user_id,
                    'comment_rejected',
                    [
                        'comment_id' => $comment->id,
                        'post_id' => $comment->post_id,
                        'post_title' => $comment->post->title ?? 'Unknown Post',
                        'admin_note' => $validated['admin_note'],
                        'message' => 'Your comment has been rejected due to inappropriate content.',
                        'rejected_by' => Auth::user()->name,
                        'rejected_at' => now()->toISOString(),
                        'reason' => $validated['admin_note'],
                    ]
                );
            }

            DB::commit();

            // Load relationships for response
            $comment->load(['user:id,name,avatar', 'post:id,title,user_id']);

            $responseData = [
                'id' => $comment->id,
                'content' => $comment->content,
                'author' => $comment->getAuthorName(),
                'author_id' => $comment->user_id,
                'author_avatar' => $comment->is_anonymous ? null : $comment->user?->avatar,
                'is_anonymous' => $comment->is_anonymous,
                'status' => $comment->status,
                'post' => [
                    'id' => $comment->post->id,
                    'title' => $comment->post->title,
                    'author_id' => $comment->post->user_id,
                ],
                'admin_note' => $validated['admin_note'],
                'rejected_by' => Auth::user()->name,
                'rejected_at' => $comment->updated_at,
                'created_at' => $comment->created_at,
                'updated_at' => $comment->updated_at,
            ];

            return ResponseHelper::success($responseData, 'Comment rejected successfully');

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return ResponseHelper::error('Comment not found', 404);
        } catch (\Exception $e) {
            DB::rollBack();
            return ResponseHelper::error('Failed to reject comment', 500, $e->getMessage());
        }
    }
}

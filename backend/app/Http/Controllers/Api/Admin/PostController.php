<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ApprovePostRequest;
use App\Http\Requests\RejectPostRequest;
use App\Models\Post;
use App\Utils\ResponseHelper;
use App\Utils\NotificationHelper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PostController extends Controller
{
    /**
     * Display a listing of pending posts for admin review.
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

            $query = Post::with(['user:id,name,avatar', 'tags:id,name'])
                ->pending() // Only show pending posts
                ->latest();

            // Apply filters
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('content', 'like', "%{$search}%");
                });
            }

            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->has('tag')) {
                $query->whereHas('tags', function ($q) use ($request) {
                    $q->where('name', $request->tag);
                });
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
                case 'most_liked':
                    $query->mostLiked();
                    break;
                default:
                    $query->latest();
                    break;
            }

            // Pagination
            $perPage = min($request->get('per_page', 15), 50); // Max 50 per page
            $posts = $query->paginate($perPage);

            // Get current user ID for like status check
            $userId = Auth::id();

            // Transform the data for admin view
            $posts->getCollection()->transform(function ($post) use ($userId) {
                // Check if the post is liked by the current user directly from the database
                $isLikedByUser = DB::table('likes')
                    ->where('user_id', $userId)
                    ->where('post_id', $post->id)
                    ->exists();
                
                return [
                    'id' => $post->id,
                    'title' => $post->title,
                    'content' => $post->content,
                    'author' => $post->getAuthorName(),
                    'author_id' => $post->user_id,
                    'author_avatar' => $post->is_anonymous ? null : $post->user?->avatar,
                    'is_anonymous' => $post->is_anonymous,
                    'status' => $post->status,
                    'admin_note' => $post->admin_note,
                    'like_count' => $post->like_count,
                    'is_liked_by_user' => $isLikedByUser,
                    'comment_count' => $post->comment_count,
                    'tags' => $post->tags->pluck('name'),
                    'image' => [
                        'url' => $post->getImageUrl(),
                        'thumbnail_url' => $post->getImageThumbnailUrl(),
                        'has_image' => $post->hasImage(),
                        'alt_text' => $post->getImageAlt(),
                        'metadata' => $post->getImageMetadata(),
                    ],
                    'created_at' => $post->created_at,
                    'updated_at' => $post->updated_at,
                ];
            });

            return ResponseHelper::success($posts, 'Pending posts retrieved successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve pending posts', 500, $e->getMessage());
        }
    }

    /**
     * Approve a pending post.
     *
     * @param ApprovePostRequest $request
     * @param string $id
     * @return JsonResponse
     */
    public function approve(ApprovePostRequest $request, string $id): JsonResponse
    {
        try {
            $post = Post::findOrFail($id);

            // Check if post is in pending status
            if (!$post->isPending()) {
                return ResponseHelper::error('Only pending posts can be approved', 400);
            }

            DB::beginTransaction();

            $validated = $request->validated();

            // Approve the post
            $post->status = 'approved';
            
            // Add admin note if provided
            if (isset($validated['admin_note'])) {
                $post->admin_note = $validated['admin_note'];
            } else {
                $post->admin_note = null; // Clear any previous admin note
            }

            $post->save();

            // Send notification to post author if not anonymous
            if ($post->user_id) {
                NotificationHelper::createNotification(
                    $post->user_id,
                    'post_approved',
                    [
                        'post_id' => $post->id,
                        'post_title' => $post->title,
                        'admin_note' => $post->admin_note,
                        'message' => 'Your post has been approved and is now visible to other users.',
                        'approved_by' => Auth::user()->name,
                        'approved_at' => now()->toISOString(),
                    ]
                );
            }

            DB::commit();

            // Load relationships for response
            $post->load(['user:id,name,avatar', 'tags:id,name']);

            // Check if the post is liked by the current user directly from the database
            $isLikedByUser = DB::table('likes')
                ->where('user_id', Auth::id())
                ->where('post_id', $post->id)
                ->exists();

            $responseData = [
                'id' => $post->id,
                'title' => $post->title,
                'content' => $post->content,
                'author' => $post->getAuthorName(),
                'author_id' => $post->user_id,
                'author_avatar' => $post->is_anonymous ? null : $post->user?->avatar,
                'is_anonymous' => $post->is_anonymous,
                'status' => $post->status,
                'admin_note' => $post->admin_note,
                'like_count' => $post->like_count,
                'is_liked_by_user' => $isLikedByUser,
                'comment_count' => $post->comment_count,
                'tags' => $post->tags->pluck('name'),
                'image' => [
                    'url' => $post->getImageUrl(),
                    'thumbnail_url' => $post->getImageThumbnailUrl(),
                    'has_image' => $post->hasImage(),
                    'alt_text' => $post->getImageAlt(),
                    'metadata' => $post->getImageMetadata(),
                ],
                'approved_by' => Auth::user()->name,
                'approved_at' => $post->updated_at,
                'created_at' => $post->created_at,
                'updated_at' => $post->updated_at,
            ];

            return ResponseHelper::success($responseData, 'Post approved successfully');

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return ResponseHelper::error('Post not found', 404);
        } catch (\Exception $e) {
            DB::rollBack();
            return ResponseHelper::error('Failed to approve post', 500, $e->getMessage());
        }
    }

    /**
     * Reject a pending post with a note.
     *
     * @param RejectPostRequest $request
     * @param string $id
     * @return JsonResponse
     */
    public function reject(RejectPostRequest $request, string $id): JsonResponse
    {
        try {
            $post = Post::findOrFail($id);

            // Check if post is in pending status
            if (!$post->isPending()) {
                return ResponseHelper::error('Only pending posts can be rejected', 400);
            }

            DB::beginTransaction();

            $validated = $request->validated();

            // Reject the post
            $post->status = 'rejected';
            $post->admin_note = $validated['admin_note'];
            $post->save();

            // Send notification to post author if not anonymous
            if ($post->user_id) {
                NotificationHelper::createNotification(
                    $post->user_id,
                    'post_rejected',
                    [
                        'post_id' => $post->id,
                        'post_title' => $post->title,
                        'admin_note' => $post->admin_note,
                        'reason' => $post->admin_note,
                        'message' => 'Your post has been rejected. Please review the admin note and consider making changes.',
                        'rejected_by' => Auth::user()->name,
                        'rejected_at' => now()->toISOString(),
                    ]
                );
            }

            DB::commit();

            // Load relationships for response
            $post->load(['user:id,name,avatar', 'tags:id,name']);

            // Check if the post is liked by the current user directly from the database
            $isLikedByUser = DB::table('likes')
                ->where('user_id', Auth::id())
                ->where('post_id', $post->id)
                ->exists();

            $responseData = [
                'id' => $post->id,
                'title' => $post->title,
                'content' => $post->content,
                'author' => $post->getAuthorName(),
                'author_id' => $post->user_id,
                'author_avatar' => $post->is_anonymous ? null : $post->user?->avatar,
                'is_anonymous' => $post->is_anonymous,
                'status' => $post->status,
                'admin_note' => $post->admin_note,
                'like_count' => $post->like_count,
                'is_liked_by_user' => $isLikedByUser,
                'comment_count' => $post->comment_count,
                'tags' => $post->tags->pluck('name'),
                'image' => [
                    'url' => $post->getImageUrl(),
                    'thumbnail_url' => $post->getImageThumbnailUrl(),
                    'has_image' => $post->hasImage(),
                    'alt_text' => $post->getImageAlt(),
                    'metadata' => $post->getImageMetadata(),
                ],
                'rejected_by' => Auth::user()->name,
                'rejected_at' => $post->updated_at,
                'created_at' => $post->created_at,
                'updated_at' => $post->updated_at,
            ];

            return ResponseHelper::success($responseData, 'Post rejected successfully');

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return ResponseHelper::error('Post not found', 404);
        } catch (\Exception $e) {
            DB::rollBack();
            return ResponseHelper::error('Failed to reject post', 500, $e->getMessage());
        }
    }

    /**
     * Display all posts with filters and pagination.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Post::with(['user:id,name,avatar', 'tags:id,name']);

            // Apply filters
            if ($request->has('status')) {
                $query->byStatus($request->status);
            }

            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('content', 'like', "%{$search}%");
                });
            }

            if ($request->has('tag')) {
                $query->whereHas('tags', function ($q) use ($request) {
                    $q->where('name', $request->tag);
                });
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
                case 'like_count':
                    $query->orderBy('like_count', $sortOrder);
                    break;
                case 'comment_count':
                    $query->orderBy('comment_count', $sortOrder);
                    break;
                case 'status':
                    $query->orderBy('status', $sortOrder);
                    break;
                default:
                    $query->orderBy('created_at', $sortOrder);
                    break;
            }

            // Pagination
            $perPage = min($request->get('per_page', 15), 100);
            $posts = $query->paginate($perPage);

            // Transform the data
            $posts->getCollection()->transform(function ($post) {
                return [
                    'id' => $post->id,
                    'title' => $post->title,
                    'content' => $post->content,
                    'author' => $post->getAuthorName(),
                    'author_id' => $post->user_id,
                    'author_avatar' => $post->is_anonymous ? null : $post->user?->avatar,
                    'is_anonymous' => $post->is_anonymous,
                    'status' => $post->status,
                    'admin_note' => $post->admin_note,
                    'like_count' => $post->like_count,
                    'is_liked_by_user' => Auth::check() ? $post->isLikedByUser(Auth::id()) : false,
                    'comment_count' => $post->comment_count,
                    'tags' => $post->tags->pluck('name'),
                    'image' => [
                        'url' => $post->getImageUrl(),
                        'thumbnail_url' => $post->getImageThumbnailUrl(),
                        'has_image' => $post->hasImage(),
                        'alt_text' => $post->getImageAlt(),
                        'metadata' => $post->getImageMetadata(),
                    ],
                    'created_at' => $post->created_at,
                    'updated_at' => $post->updated_at,
                ];
            });

            return ResponseHelper::success($posts, 'Posts retrieved successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve posts', 500, $e->getMessage());
        }
    }

    /**
     * Display approved posts with pagination.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function approved(Request $request): JsonResponse
    {
        try {
            $query = Post::with(['user:id,name,avatar', 'tags:id,name'])
                ->approved();

            // Apply additional filters
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('content', 'like', "%{$search}%");
                });
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            switch ($sortBy) {
                case 'most_liked':
                    $query->mostLiked();
                    break;
                case 'oldest':
                    $query->oldest();
                    break;
                default:
                    $query->latest();
                    break;
            }

            // Pagination
            $perPage = min($request->get('per_page', 15), 100);
            $posts = $query->paginate($perPage);

            // Transform the data
            $posts->getCollection()->transform(function ($post) {
                return [
                    'id' => $post->id,
                    'title' => $post->title,
                    'content' => $post->content,
                    'author' => $post->getAuthorName(),
                    'author_id' => $post->user_id,
                    'is_anonymous' => $post->is_anonymous,
                    'status' => $post->status,
                    'like_count' => $post->like_count,
                    'is_liked_by_user' => Auth::check() ? $post->isLikedByUser(Auth::id()) : false,
                    'comment_count' => $post->comment_count,
                    'tags' => $post->tags->pluck('name'),
                    'image' => [
                        'url' => $post->getImageUrl(),
                        'thumbnail_url' => $post->getImageThumbnailUrl(),
                        'has_image' => $post->hasImage(),
                        'alt_text' => $post->getImageAlt(),
                        'metadata' => $post->getImageMetadata(),
                    ],
                    'created_at' => $post->created_at,
                ];
            });

            return ResponseHelper::success($posts, 'Approved posts retrieved successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve approved posts', 500, $e->getMessage());
        }
    }

    /**
     * Display rejected posts with pagination.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function rejected(Request $request): JsonResponse
    {
        try {
            $query = Post::with(['user:id,name,avatar', 'tags:id,name'])
                ->rejected();

            // Apply additional filters
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('content', 'like', "%{$search}%");
                });
            }

            // Pagination
            $perPage = min($request->get('per_page', 15), 100);
            $posts = $query->latest()->paginate($perPage);

            // Transform the data
            $posts->getCollection()->transform(function ($post) {
                return [
                    'id' => $post->id,
                    'title' => $post->title,
                    'content' => $post->content,
                    'author' => $post->getAuthorName(),
                    'author_id' => $post->user_id,
                    'is_anonymous' => $post->is_anonymous,
                    'status' => $post->status,
                    'admin_note' => $post->admin_note,
                    'like_count' => $post->like_count,
                    'is_liked_by_user' => Auth::check() ? $post->isLikedByUser(Auth::id()) : false,
                    'comment_count' => $post->comment_count,
                    'tags' => $post->tags->pluck('name'),
                    'image' => [
                        'url' => $post->getImageUrl(),
                        'thumbnail_url' => $post->getImageThumbnailUrl(),
                        'has_image' => $post->hasImage(),
                        'alt_text' => $post->getImageAlt(),
                        'metadata' => $post->getImageMetadata(),
                    ],
                    'created_at' => $post->created_at,
                    'updated_at' => $post->updated_at,
                ];
            });

            return ResponseHelper::success($posts, 'Rejected posts retrieved successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve rejected posts', 500, $e->getMessage());
        }
    }

    /**
     * Get post statistics.
     *
     * @return JsonResponse
     */
    public function statistics(): JsonResponse
    {
        try {
            $statistics = Post::getStatusStatistics();

            return ResponseHelper::success($statistics, 'Post statistics retrieved successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve post statistics', 500, $e->getMessage());
        }
    }
}

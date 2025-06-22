<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreatePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Models\Post;
use App\Models\Tag;
use App\Utils\ResponseHelper;
use App\Utils\NotificationHelper;
use App\Utils\AnonymousHelper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PostController extends Controller
{
    /**
     * Display a listing of posts with filters.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Post::with(['user:id,name,avatar', 'tags:id,name'])
                ->approved() // Only show approved posts
                ->latest();

            // Apply filters
            if ($request->has('tag')) {
                $query->whereHas('tags', function ($q) use ($request) {
                    $q->where('name', $request->tag);
                });
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('content', 'like', "%{$search}%");
                });
            }

            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id)
                      ->where('is_anonymous', false); // Don't show anonymous posts when filtering by user
            }

            // Sorting options
            $sortBy = $request->get('sort_by', 'latest');
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
            $perPage = min($request->get('per_page', 15), 50); // Max 50 per page
            $posts = $query->paginate($perPage);

            // Get current user ID for like status check
            // For public routes, we need to manually check for authentication
            $userId = null;
            if ($request->bearerToken()) {
                try {
                    $user = Auth::guard('sanctum')->user();
                    if ($user) {
                        $userId = $user->id;
                    }
                } catch (\Exception $e) {
                    // Token is invalid or expired, continue as guest
                }
            }

            // Transform the data
            $posts->getCollection()->transform(function ($post) use ($userId) {
                return [
                    'id' => $post->id,
                    'title' => $post->title,
                    'content' => $post->content,
                    'emotion' => $post->emotion,
                    'link' => $post->link,
                    'author' => $post->getAuthorName(),
                    'author_avatar' => $post->is_anonymous ? null : $post->user?->avatar,
                    'is_anonymous' => $post->is_anonymous,
                    'like_count' => $post->like_count,
                    'is_liked_by_user' => $post->isLikedByUser($userId),
                    'comment_count' => $post->comment_count,
                    'tags' => $post->tags->pluck('name'),
                    'image' => $post->hasImage() ? [
                        'url' => $post->getImageUrl(),
                        'thumbnail_url' => $post->getImageThumbnailUrl(),
                        'alt' => $post->getImageAlt(),
                    ] : null,
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
     * Store a newly created post.
     *
     * @param CreatePostRequest $request
     * @return JsonResponse
     */
    public function store(CreatePostRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->getValidatedWithAnalysis();
            
            // Prepare post data
            $postData = [
                'title' => $validated['title'],
                'content' => $validated['content'],
                'emotion' => $validated['emotion'] ?? null,
                'link' => $validated['link'] ?? null,
                'is_anonymous' => $validated['is_anonymous'] ?? false,
                'status' => 'pending', // All user posts default to pending status
            ];

            // Set user_id for authenticated users (always store user_id for authenticated users)
            if (Auth::check()) {
                $postData['user_id'] = Auth::id();
            }

            // Handle anonymous posting (anonymous display but user_id is still stored)
            if ($postData['is_anonymous']) {
                // Store anonymous session data if needed for truly anonymous users
                if (!Auth::check() && isset($validated['anonymous_id'])) {
                    AnonymousHelper::setSessionAnonymousId($validated['anonymous_id']);
                }
            }

            // Handle image upload if provided
            if ($request->hasFile('image')) {
                // Ensure we have a valid userId (can be null for anonymous)
                $userId = isset($postData['user_id']) ? $postData['user_id'] : null;
                
                try {
                    $imageResult = \App\Utils\ImageUploader::uploadPostImage($request->file('image'), $userId);
                    
                    if ($imageResult && isset($imageResult['success']) && $imageResult['success']) {
                        $postData['image'] = $imageResult['path'];
                        $imageMetadata = $imageResult['metadata'] ?? [];
                        
                        // Add alt text if provided
                        if ($request->has('image_alt')) {
                            $imageMetadata['alt'] = $request->input('image_alt');
                        }
                        
                        $postData['image_metadata'] = $imageMetadata;
                    } else {
                        $errorMessage = isset($imageResult['error']) ? $imageResult['error'] : 'Image upload failed';
                        throw new \Exception($errorMessage);
                    }
                } catch (\Exception $e) {
                    throw new \Exception('Failed to upload image: ' . $e->getMessage());
                }
            }

            // Create the post
            $post = Post::create($postData);

            // Handle tags if provided
            if (!empty($validated['tags'])) {
                $tagIds = [];
                foreach ($validated['tags'] as $tagName) {
                    $tag = Tag::firstOrCreate(['name' => $tagName]);
                    $tagIds[] = $tag->id;
                }
                $post->tags()->sync($tagIds);
            }

            // Load relationships for response
            $post->load(['tags:id,name']);

            // Send notification if post is auto-approved
            if ($post->status === 'approved' && $post->user_id) {
                NotificationHelper::createNotification(
                    $post->user_id,
                    'post_approved',
                    [
                        'post_id' => $post->id,
                        'post_title' => $post->title,
                        'message' => 'Your post has been approved and is now visible to other users.'
                    ]
                );
            }

            DB::commit();

            // Transform response data
            $responseData = [
                'id' => $post->id,
                'title' => $post->title,
                'content' => $post->content,
                'emotion' => $post->emotion,
                'link' => $post->link,
                'author' => $post->getAuthorName(),
                'author_avatar' => $post->is_anonymous ? null : $post->user?->avatar,
                'is_anonymous' => $post->is_anonymous,
                'status' => $post->status,
                'like_count' => $post->like_count,
                'is_liked_by_user' => Auth::check() ? $post->isLikedByUser(Auth::id()) : false,
                'comment_count' => $post->comment_count,
                'tags' => $post->tags->pluck('name'),
                'image' => $post->hasImage() ? [
                    'url' => $post->getImageUrl(),
                    'thumbnail_url' => $post->getImageThumbnailUrl(),
                    'alt' => $post->getImageAlt(),
                    'metadata' => $post->getImageMetadata(),
                ] : null,
                'created_at' => $post->created_at,
                'updated_at' => $post->updated_at,
            ];

            $message = $post->status === 'pending' 
                ? 'Post created successfully and is pending approval'
                : 'Post created and approved successfully';

            return ResponseHelper::success($responseData, $message, 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return ResponseHelper::error('Failed to create post', 500, $e->getMessage());
        }
    }

    /**
     * Display the specified post.
     *
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function show(Request $request, string $id): JsonResponse
    {
        try {
            $post = Post::with(['user:id,name,avatar', 'tags:id,name', 'approvedComments.user:id,name,avatar'])
                ->approved() // Only show approved posts
                ->findOrFail($id);

            // Transform comments data
            $comments = $post->approvedComments->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'content' => $comment->content,
                    'author' => $comment->is_anonymous ? 'Anonymous User' : $comment->user?->name,
                    'author_avatar' => $comment->is_anonymous ? null : $comment->user?->avatar,
                    'is_anonymous' => $comment->is_anonymous,
                    'created_at' => $comment->created_at,
                ];
            });

            // For public routes, we need to manually check for authentication
            $userId = null;
            if ($request->bearerToken()) {
                try {
                    $user = Auth::guard('sanctum')->user();
                    if ($user) {
                        $userId = $user->id;
                    }
                } catch (\Exception $e) {
                    // Token is invalid or expired, continue as guest
                }
            }

            $responseData = [
                'id' => $post->id,
                'title' => $post->title,
                'content' => $post->content,
                'emotion' => $post->emotion,
                'link' => $post->link,
                'author' => $post->getAuthorName(),
                'author_avatar' => $post->is_anonymous ? null : $post->user?->avatar,
                'is_anonymous' => $post->is_anonymous,
                'like_count' => $post->like_count,
                'is_liked_by_user' => $post->isLikedByUser($userId),
                'comment_count' => $post->comment_count,
                'tags' => $post->tags->pluck('name'),
                'comments' => $comments,
                'image' => $post->hasImage() ? [
                    'url' => $post->getImageUrl(),
                    'thumbnail_url' => $post->getImageThumbnailUrl(),
                    'alt' => $post->getImageAlt(),
                ] : null,
                'created_at' => $post->created_at,
                'updated_at' => $post->updated_at,
            ];

            return ResponseHelper::success($responseData, 'Post retrieved successfully');

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return ResponseHelper::error('Post not found', 404);
        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve post', 500, $e->getMessage());
        }
    }

    /**
     * Update the specified post (only by owner).
     *
     * @param UpdatePostRequest $request
     * @param string $id
     * @return JsonResponse
     */
    public function update(UpdatePostRequest $request, string $id): JsonResponse
    {
        try {
            $post = Post::findOrFail($id);

            // Check if user can edit this post
            if (!$post->canBeEditedBy(Auth::user())) {
                return ResponseHelper::error('You are not authorized to edit this post', 403);
            }

            DB::beginTransaction();

            $validated = $request->validated();

            // Update post fields
            if (isset($validated['title'])) {
                $post->title = $validated['title'];
            }

            if (isset($validated['content'])) {
                $post->content = $validated['content'];
            }

            if (isset($validated['emotion'])) {
                $post->emotion = $validated['emotion'];
            }

            if (isset($validated['link'])) {
                $post->link = $validated['link'];
            }

            // Handle image removal
            if (isset($validated['remove_image']) && $validated['remove_image']) {
                if ($post->image) {
                    // Delete old image files
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($post->image);
                    $metadata = $post->image_metadata;
                    if (isset($metadata['thumbnail'])) {
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($metadata['thumbnail']);
                    }
                    if (isset($metadata['optimized'])) {
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($metadata['optimized']);
                    }
                }
                $post->image = null;
                $post->image_metadata = null;
            }

            // Handle new image upload
            if ($request->hasFile('image')) {
                // Delete old image if exists
                if ($post->image) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($post->image);
                    $metadata = $post->image_metadata;
                    if (isset($metadata['thumbnail'])) {
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($metadata['thumbnail']);
                    }
                    if (isset($metadata['optimized'])) {
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($metadata['optimized']);
                    }
                }

                $userId = $post->user_id;
                $imageResult = \App\Utils\ImageUploader::uploadPostImage($request->file('image'), $userId);
                
                if ($imageResult && $imageResult['success']) {
                    $post->image = $imageResult['path'];
                    $imageMetadata = $imageResult['metadata'];
                    
                    // Add alt text if provided
                    if ($request->has('image_alt')) {
                        $imageMetadata['alt'] = $request->input('image_alt');
                    }
                    
                    $post->image_metadata = $imageMetadata;
                } else {
                    throw new \Exception($imageResult['error'] ?? 'Image upload failed');
                }
            } else if (isset($validated['image_alt']) && $post->hasImage()) {
                // Update just the alt text if provided
                $metadata = $post->image_metadata ?? [];
                $metadata['alt'] = $validated['image_alt'];
                $post->image_metadata = $metadata;
            }

            // Reset status to pending if content was modified (for re-moderation)
            if (isset($validated['title']) || isset($validated['content']) || $request->hasFile('image')) {
                $post->status = 'pending';
                $post->admin_note = null;
            }

            $post->save();

            // Handle tags if provided
            if (isset($validated['tags'])) {
                $tagIds = [];
                foreach ($validated['tags'] as $tagName) {
                    $tag = Tag::firstOrCreate(['name' => $tagName]);
                    $tagIds[] = $tag->id;
                }
                $post->tags()->sync($tagIds);
            }

            // Load relationships for response
            $post->load(['tags:id,name']);

            DB::commit();

            $userId = Auth::check() ? Auth::id() : null;

            $responseData = [
                'id' => $post->id,
                'title' => $post->title,
                'content' => $post->content,
                'emotion' => $post->emotion,
                'link' => $post->link,
                'author' => $post->getAuthorName(),
                'author_avatar' => $post->is_anonymous ? null : $post->user?->avatar,
                'is_anonymous' => $post->is_anonymous,
                'status' => $post->status,
                'like_count' => $post->like_count,
                'is_liked_by_user' => $post->isLikedByUser($userId),
                'comment_count' => $post->comment_count,
                'tags' => $post->tags->pluck('name'),
                'image' => $post->hasImage() ? [
                    'url' => $post->getImageUrl(),
                    'thumbnail_url' => $post->getImageThumbnailUrl(),
                    'alt' => $post->getImageAlt(),
                    'metadata' => $post->getImageMetadata(),
                ] : null,
                'created_at' => $post->created_at,
                'updated_at' => $post->updated_at,
            ];

            return ResponseHelper::success($responseData, 'Post updated successfully');

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return ResponseHelper::error('Post not found', 404);
        } catch (\Exception $e) {
            DB::rollBack();
            return ResponseHelper::error('Failed to update post', 500, $e->getMessage());
        }
    }

    /**
     * Remove the specified post (only by owner).
     *
     * @param string $id
     * @return JsonResponse
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $post = Post::findOrFail($id);

            // Check if user can delete this post
            if (!$post->canBeDeletedBy(Auth::user())) {
                return ResponseHelper::error('You are not authorized to delete this post', 403);
            }

            DB::beginTransaction();

            // Delete image files if they exist
            if ($post->image) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($post->image);
                $metadata = $post->image_metadata;
                if (isset($metadata['thumbnail'])) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($metadata['thumbnail']);
                }
                if (isset($metadata['optimized'])) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($metadata['optimized']);
                }
            }

            // Delete related data
            $post->likes()->delete();
            $post->comments()->delete();
            $post->tags()->detach();
            
            // Delete the post
            $post->delete();

            DB::commit();

            return ResponseHelper::success(null, 'Post deleted successfully');

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return ResponseHelper::error('Post not found', 404);
        } catch (\Exception $e) {
            DB::rollBack();
            return ResponseHelper::error('Failed to delete post', 500, $e->getMessage());
        }
    }

    /**
     * Get posts for the authenticated user with optional status filtering.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getUserPosts(Request $request): JsonResponse
    {
        try {
            // Check auth - First try request->user() which is the preferred way
            $user = $request->user();
            if (!$user) {
                // Fallback to Auth facade
                if (!Auth::check()) {
                    return ResponseHelper::error('You must be logged in to view your posts', 401);
                }
                $user = Auth::user();
            }

            $userId = $user->id;
            
            $perPage = min($request->get('per_page', 15), 50); // Max 50 per page
            
            // Get posts for the authenticated user, including pending and rejected posts
            $query = Post::with(['user:id,name,avatar', 'tags:id,name'])
                ->where('user_id', $userId)
                ->latest();
                
            // Filter by status if provided
            if ($request->has('status') && in_array($request->status, ['approved', 'pending', 'rejected'])) {
                $query->where('status', $request->status);
            }
            
            // Filter by anonymous status if provided
            if ($request->has('anonymous')) {
                $isAnonymous = filter_var($request->anonymous, FILTER_VALIDATE_BOOLEAN);
                $query->where('is_anonymous', $isAnonymous);
            }
            
            $posts = $query->paginate($perPage);
            
            // Transform the data
            $posts->getCollection()->transform(function ($post) use ($userId) {
                return [
                    'id' => $post->id,
                    'title' => $post->title,
                    'content' => $post->content,
                    'emotion' => $post->emotion,
                    'link' => $post->link,
                    'author' => $post->getAuthorName(),
                    'author_avatar' => $post->is_anonymous ? null : $post->user?->avatar,
                    'is_anonymous' => $post->is_anonymous,
                    'status' => $post->status,
                    'admin_note' => $post->admin_note,
                    'like_count' => $post->like_count,
                    'is_liked_by_user' => $post->isLikedByUser($userId),
                    'comment_count' => $post->comment_count,
                    'tags' => $post->tags->pluck('name'),
                    'image' => $post->hasImage() ? [
                        'url' => $post->getImageUrl(),
                        'thumbnail_url' => $post->getImageThumbnailUrl(),
                        'alt' => $post->getImageAlt(),
                    ] : null,
                    'created_at' => $post->created_at,
                    'updated_at' => $post->updated_at,
                ];
            });
            
            return ResponseHelper::success($posts, 'User posts retrieved successfully');
            
        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve user posts', 500, $e->getMessage());
        }
    }

    /**
     * Get all posts for the authenticated user (including all statuses).
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getAllUserPosts(Request $request): JsonResponse
    {
        try {
            // Get authenticated user instead of requiring user_id
            $user = $request->user();
            if (!$user) {
                if (!Auth::check()) {
                    return ResponseHelper::error('You must be logged in to view your posts', 401);
                }
                $user = Auth::user();
            }
            
            $targetUserId = $user->id;
            
            $perPage = min($request->get('per_page', 15), 50); // Max 50 per page
            
            // Get all posts for the target user (not just approved ones)
            $query = Post::with(['user:id,name,avatar', 'tags:id,name'])
                ->where('user_id', $targetUserId)
                ->latest();
            
            // Apply optional anonymous filter
            if ($request->has('is_anonymous')) {
                $isAnonymous = filter_var($request->input('is_anonymous'), FILTER_VALIDATE_BOOLEAN);
                $query->where('is_anonymous', $isAnonymous);
            }
            
            // Apply optional status filter
            if ($request->has('status') && in_array($request->status, ['approved', 'pending', 'rejected'])) {
                $query->where('status', $request->status);
            }
            
            $posts = $query->paginate($perPage);
            
            // Get current user ID for like status check
            $userId = $targetUserId;
            
            // Transform the data
            $posts->getCollection()->transform(function ($post) use ($userId) {
                return [
                    'id' => $post->id,
                    'title' => $post->title,
                    'content' => $post->content,
                    'emotion' => $post->emotion,
                    'link' => $post->link,
                    'author' => $post->is_anonymous ? 'Anonymous User' : ($post->user ? $post->user->name : 'Unknown User'),
                    'author_avatar' => $post->is_anonymous ? null : ($post->user ? $post->user->avatar : null),
                    'is_anonymous' => $post->is_anonymous,
                    'status' => $post->status,
                    'admin_note' => $post->admin_note,
                    'like_count' => $post->like_count,
                    'is_liked_by_user' => $post->isLikedByUser($userId),
                    'comment_count' => $post->comment_count,
                    'tags' => $post->tags->pluck('name'),
                    'image' => $post->hasImage() ? [
                        'url' => $post->getImageUrl(),
                        'thumbnail_url' => $post->getImageThumbnailUrl(),
                        'alt' => $post->getImageAlt(),
                    ] : null,
                    'created_at' => $post->created_at,
                    'updated_at' => $post->updated_at,
                ];
            });
            
            return ResponseHelper::success($posts, 'User posts retrieved successfully');
            
        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve user posts', 500, $e->getMessage());
        }
    }
}

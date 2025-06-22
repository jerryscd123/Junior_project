<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Like;
use App\Models\Post;
use App\Utils\NotificationHelper;
use App\Utils\ResponseHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class LikeController extends Controller
{
    /**
     * Like a post
     *
     * @param Request $request
     * @param int $postId
     * @return JsonResponse
     */
    public function like(Request $request, int $postId): JsonResponse
    {
        try {
            // Check if user is authenticated
            $user = Auth::user();
            if (!$user) {
                return ResponseHelper::unauthorized('You must be logged in to like posts');
            }

            // Check if post exists and is approved
            $post = Post::find($postId);
            if (!$post) {
                return ResponseHelper::notFound('Post not found');
            }

            if (!$post->isApproved()) {
                return ResponseHelper::forbidden('You can only like approved posts');
            }

            // Use database transaction to ensure consistency
            $result = DB::transaction(function () use ($user, $postId, $post) {
                // Check if already liked
                if (Like::hasUserLikedPost($user->id, $postId)) {
                    return ['success' => false, 'message' => 'You have already liked this post'];
                }

                // Like the post
                $likeResult = Like::likePost($user->id, $postId);
                
                if (!$likeResult) {
                    return ['success' => false, 'message' => 'Failed to like the post'];
                }

                // Create notification for post owner (if not liking own post)
                if ($post->user_id && $post->user_id !== $user->id) {
                    NotificationHelper::createLikeNotification(
                        $post->user_id,
                        $user->id,
                        $postId,
                        $post->title
                    );
                }

                return ['success' => true, 'message' => 'Post liked successfully'];
            });

            if (!$result['success']) {
                \Log::warning('Like operation failed', ['user_id' => $user->id, 'post_id' => $postId, 'message' => $result['message']]);
                if ($result['message'] === 'You have already liked this post') {
                    return ResponseHelper::conflict($result['message']);
                }
                return ResponseHelper::error($result['message']);
            }
            
            \Log::info('Like operation successful', ['user_id' => $user->id, 'post_id' => $postId]);

            // Get updated post data
            $post->refresh();
            $post->load(['user:id,name,avatar', 'tags:id,name']);
            
            // Check final like status
            $isLikedByUser = $post->isLikedByUser($user->id);
            
            // Return full post data with like status
            $responseData = [
                'liked' => $isLikedByUser,
                'is_liked_by_user' => $isLikedByUser,
                'like_count' => $post->like_count,
                'post_id' => $postId,
                'post' => [
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
                    'is_liked_by_user' => $isLikedByUser,
                    'comment_count' => $post->comment_count,
                    'tags' => $post->tags->pluck('name'),
                    'image' => $post->hasImage() ? [
                        'url' => $post->getImageUrl(),
                        'thumbnail_url' => $post->getImageThumbnailUrl(),
                        'alt' => $post->getImageAlt(),
                    ] : null,
                    'created_at' => $post->created_at,
                    'updated_at' => $post->updated_at,
                ]
            ];
            
            return ResponseHelper::success($responseData, $result['message']);

        } catch (\Exception $e) {
            \Log::error('Exception in like method', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return ResponseHelper::serverError('An error occurred while liking the post');
        }
    }

    /**
     * Unlike a post
     *
     * @param Request $request
     * @param int $postId
     * @return JsonResponse
     */
    public function unlike(Request $request, int $postId): JsonResponse
    {
        try {
            // Log the request
            \Log::info('Unlike request received', ['post_id' => $postId, 'method' => $request->method()]);
            
            // Check if user is authenticated
            $user = Auth::user();
            if (!$user) {
                \Log::warning('Unauthenticated unlike request', ['post_id' => $postId]);
                return ResponseHelper::unauthorized('You must be logged in to unlike posts');
            }
            
            \Log::info('User authenticated for unlike', ['user_id' => $user->id, 'post_id' => $postId]);

            // Check if post exists
            $post = Post::find($postId);
            if (!$post) {
                return ResponseHelper::notFound('Post not found');
            }

            // Use database transaction to ensure consistency
            $result = DB::transaction(function () use ($user, $postId) {
                // Check if user has liked the post
                if (!Like::hasUserLikedPost($user->id, $postId)) {
                    return ['success' => false, 'message' => 'You have not liked this post'];
                }

                // Unlike the post
                $unlikeResult = Like::unlikePost($user->id, $postId);

                if (!$unlikeResult) {
                    return ['success' => false, 'message' => 'Failed to unlike the post'];
                }

                return ['success' => true, 'message' => 'Post unliked successfully'];
            });

            if (!$result['success']) {
                if ($result['message'] === 'You have not liked this post') {
                    return ResponseHelper::conflict($result['message']);
                }
                return ResponseHelper::error($result['message']);
            }

            // Get updated post data
            $post->refresh();
            $post->load(['user:id,name,avatar', 'tags:id,name']);
            
            // Check final like status
            $isLikedByUser = $post->isLikedByUser($user->id);
            
            // Return full post data with like status
            $responseData = [
                'liked' => $isLikedByUser,
                'is_liked_by_user' => $isLikedByUser,
                'like_count' => $post->like_count,
                'post_id' => $postId,
                'post' => [
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
                    'is_liked_by_user' => $isLikedByUser,
                    'comment_count' => $post->comment_count,
                    'tags' => $post->tags->pluck('name'),
                    'image' => $post->hasImage() ? [
                        'url' => $post->getImageUrl(),
                        'thumbnail_url' => $post->getImageThumbnailUrl(),
                        'alt' => $post->getImageAlt(),
                    ] : null,
                    'created_at' => $post->created_at,
                    'updated_at' => $post->updated_at,
                ]
            ];
            
            return ResponseHelper::success($responseData, $result['message']);

        } catch (\Exception $e) {
            return ResponseHelper::serverError('An error occurred while unliking the post');
        }
    }

    /**
     * Get users who liked a post
     *
     * @param Request $request
     * @param int $postId
     * @return JsonResponse
     */
    public function getLikes(Request $request, int $postId): JsonResponse
    {
        try {
            // Check if post exists
            $post = Post::find($postId);
            if (!$post) {
                return ResponseHelper::notFound('Post not found');
            }

            // Get users who liked the post
            $likes = Like::where('post_id', $postId)
                ->with(['user' => function ($query) {
                    $query->select('id', 'name', 'avatar', 'is_anonymous');
                }])
                ->orderBy('created_at', 'desc')
                ->get();

            // Format the response data
            $likesData = $likes->map(function ($like) {
                $user = $like->user;
                
                // Handle anonymous users or deleted users
                if (!$user || $user->is_anonymous) {
                    return [
                        'id' => null,
                        'name' => 'Anonymous User',
                        'avatar' => null,
                        'liked_at' => $like->created_at->toISOString()
                    ];
                }

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'avatar' => $user->avatar,
                    'liked_at' => $like->created_at->toISOString()
                ];
            });

            return ResponseHelper::success([
                'likes' => $likesData,
                'total_likes' => $likes->count(),
                'post_id' => $postId
            ], 'Likes retrieved successfully');

        } catch (\Exception $e) {
            return ResponseHelper::serverError('An error occurred while retrieving likes');
        }
    }

    /**
     * Toggle like status for a post
     *
     * @param Request $request
     * @param int $postId
     * @return JsonResponse
     */
    public function toggle(Request $request, int $postId): JsonResponse
    {
        try {
            // Check if user is authenticated
            $user = Auth::user();
            if (!$user) {
                return ResponseHelper::unauthorized('You must be logged in to like/unlike posts');
            }

            // Check if post exists and is approved
            $post = Post::find($postId);
            if (!$post) {
                return ResponseHelper::notFound('Post not found');
            }

            if (!$post->isApproved()) {
                return ResponseHelper::forbidden('You can only like approved posts');
            }

            // Use database transaction to ensure consistency
            $result = DB::transaction(function () use ($user, $postId, $post) {
                // Check current like status
                $isCurrentlyLiked = Like::hasUserLikedPost($user->id, $postId);

                if ($isCurrentlyLiked) {
                    // Unlike
                    $toggleResult = Like::unlikePost($user->id, $postId);
                    return [
                        'success' => $toggleResult,
                        'liked' => false,
                        'message' => $toggleResult ? 'Post unliked successfully' : 'Failed to unlike post'
                    ];
                } else {
                    // Like
                    $toggleResult = Like::likePost($user->id, $postId);
                    
                    // Create notification for post owner (only when liking, not unliking)
                    if ($toggleResult && $post->user_id && $post->user_id !== $user->id) {
                        NotificationHelper::createLikeNotification(
                            $post->user_id,
                            $user->id,
                            $postId,
                            $post->title
                        );
                    }
                    
                    return [
                        'success' => $toggleResult,
                        'liked' => true,
                        'message' => $toggleResult ? 'Post liked successfully' : 'Failed to like post'
                    ];
                }
            });
            
            if (!$result['success']) {
                return ResponseHelper::error($result['message']);
            }

            // Get updated post data
            $post->refresh();
            $post->load(['user:id,name,avatar', 'tags:id,name']);
            
            // Check final like status
            $finalLikeStatus = $post->isLikedByUser($user->id);
            
            // Return full post data with like status
            $responseData = [
                'liked' => $finalLikeStatus,
                'is_liked_by_user' => $finalLikeStatus,
                'like_count' => $post->like_count,
                'post_id' => $postId,
                'post' => [
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
                    'is_liked_by_user' => $finalLikeStatus,
                    'comment_count' => $post->comment_count,
                    'tags' => $post->tags->pluck('name'),
                    'image' => $post->hasImage() ? [
                        'url' => $post->getImageUrl(),
                        'thumbnail_url' => $post->getImageThumbnailUrl(),
                        'alt' => $post->getImageAlt(),
                    ] : null,
                    'created_at' => $post->created_at,
                    'updated_at' => $post->updated_at,
                ]
            ];
            
            return ResponseHelper::success($responseData, $result['message']);

        } catch (\Exception $e) {
            return ResponseHelper::serverError('An error occurred while toggling like status');
        }
    }
}

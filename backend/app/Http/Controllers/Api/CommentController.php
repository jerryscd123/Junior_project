<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateCommentRequest;
use App\Http\Requests\UpdateCommentRequest;
use App\Models\Comment;
use App\Models\Post;
use App\Utils\ResponseHelper;
use App\Utils\NotificationHelper;
use App\Utils\AnonymousHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    /**
     * Display a listing of comments for a specific post.
     */
    public function index(Request $request, string $postId): JsonResponse
    {
        $request->validate([
            'per_page' => 'sometimes|integer|min:1|max:100',
            'page' => 'sometimes|integer|min:1',
            'sort' => 'sometimes|string|in:latest,oldest',
        ]);

        $perPage = $request->input('per_page', 15);
        $sort = $request->input('sort', 'latest');

        // Check if post exists and is approved
        $post = Post::find($postId);
        if (!$post || !$post->isApproved()) {
            return ResponseHelper::notFound('Post not found or not available');
        }

        // Build query for approved comments only
        $query = Comment::where('post_id', $postId)
            ->approved()
            ->with(['user:id,name,avatar']);

        // Apply sorting
        if ($sort === 'oldest') {
            $query->oldest();
        } else {
            $query->latest();
        }

        $comments = $query->paginate($perPage);

        // Transform comments data
        $transformedComments = $comments->getCollection()->map(function ($comment) {
            return [
                'id' => $comment->id,
                'content' => $comment->content,
                'author_name' => $comment->getAuthorName(),
                'author_avatar' => $comment->is_anonymous ? null : $comment->user?->avatar,
                'is_anonymous' => $comment->is_anonymous,
                'created_at' => $comment->created_at->toISOString(),
                'updated_at' => $comment->updated_at->toISOString(),
                'can_edit' => auth()->check() && $comment->canBeEditedBy(auth()->user()),
                'can_delete' => auth()->check() && $comment->canBeDeletedBy(auth()->user()),
            ];
        });

        $comments->setCollection($transformedComments);

        return ResponseHelper::paginated($comments, 'Comments retrieved successfully');
    }

    /**
     * Store a newly created comment in storage.
     */
    public function store(CreateCommentRequest $request, string $postId): JsonResponse
    {
        $validatedData = $request->getValidatedWithAnalysis();
        
        // Set the post_id from the route parameter
        $validatedData['post_id'] = $postId;
        
        // Handle anonymous commenting
        if ($validatedData['is_anonymous']) {
            $validatedData['user_id'] = null;
            
            // Store anonymous identifier in session if needed
            if (isset($validatedData['anonymous_id'])) {
                AnonymousHelper::setSessionAnonymousId($validatedData['anonymous_id']);
            }
        } else {
            $validatedData['user_id'] = auth()->id();
        }

        // Remove analysis data before saving
        $contentAnalysis = $validatedData['content_analysis'] ?? [];
        unset($validatedData['content_analysis'], $validatedData['anonymous_id']);

        // Create the comment
        $comment = Comment::create($validatedData);

        // Load relationships
        $comment->load(['user:id,name,avatar', 'post:id,title,user_id']);

        // Create notification for post owner if comment is approved and not anonymous
        if ($comment->isApproved() && $comment->post && $comment->user_id) {
            $postOwnerId = $comment->post->user_id;
            if ($postOwnerId && $postOwnerId !== $comment->user_id) {
                NotificationHelper::createCommentNotification(
                    $postOwnerId,
                    $comment->user_id,
                    $comment->post_id,
                    $comment->post->title,
                    $comment->id
                );
            }
        }

        // Prepare response data
        $responseData = [
            'id' => $comment->id,
            'content' => $comment->content,
            'author_name' => $comment->getAuthorName(),
            'author_avatar' => $comment->is_anonymous ? null : $comment->user?->avatar,
            'is_anonymous' => $comment->is_anonymous,
            'status' => $comment->status,
            'created_at' => $comment->created_at->toISOString(),
            'updated_at' => $comment->updated_at->toISOString(),
            'can_edit' => auth()->check() && $comment->canBeEditedBy(auth()->user()),
            'can_delete' => auth()->check() && $comment->canBeDeletedBy(auth()->user()),
        ];

        // Add moderation info if needed
        if ($comment->isPending()) {
            $responseData['moderation_note'] = 'Your comment is pending approval and will be visible once reviewed.';
        } elseif ($comment->isRejected()) {
            $responseData['moderation_note'] = 'Your comment was rejected due to inappropriate content.';
        }

        $message = $comment->isApproved() 
            ? 'Comment created successfully' 
            : 'Comment submitted for review';

        return ResponseHelper::created($responseData, $message);
    }

    /**
     * Display the specified comment.
     * Note: This method is not used in the API routes but included for completeness
     */
    public function show(string $id): JsonResponse
    {
        $comment = Comment::with(['user:id,name,avatar', 'post:id,title'])
            ->find($id);

        if (!$comment || !$comment->isApproved()) {
            return ResponseHelper::notFound('Comment not found');
        }

        $responseData = [
            'id' => $comment->id,
            'content' => $comment->content,
            'author_name' => $comment->getAuthorName(),
            'author_avatar' => $comment->is_anonymous ? null : $comment->user?->avatar,
            'is_anonymous' => $comment->is_anonymous,
            'status' => $comment->status,
            'post' => [
                'id' => $comment->post->id,
                'title' => $comment->post->title,
            ],
            'created_at' => $comment->created_at->toISOString(),
            'updated_at' => $comment->updated_at->toISOString(),
            'can_edit' => auth()->check() && $comment->canBeEditedBy(auth()->user()),
            'can_delete' => auth()->check() && $comment->canBeDeletedBy(auth()->user()),
        ];

        return ResponseHelper::success($responseData, 'Comment retrieved successfully');
    }

    /**
     * Update the specified comment in storage.
     */
    public function update(UpdateCommentRequest $request, string $id): JsonResponse
    {
        $comment = Comment::find($id);

        if (!$comment) {
            return ResponseHelper::notFound('Comment not found');
        }

        // Check authorization
        if (!$comment->canBeEditedBy(auth()->user())) {
            return ResponseHelper::forbidden('You are not authorized to edit this comment');
        }

        // Validate the content and update
        $validatedData = $request->validated();
        
        // Re-analyze content for moderation
        $contentAnalysis = \App\Utils\ContentFilter::analyzeContent($validatedData['content']);
        
        if ($contentAnalysis['auto_reject']) {
            $comment->status = 'rejected';
        } elseif ($contentAnalysis['requires_moderation']) {
            $comment->status = 'pending';
        } else {
            $comment->status = 'approved';
        }

        $comment->content = $validatedData['content'];
        $comment->save();

        // Load relationships
        $comment->load(['user:id,name,avatar']);

        $responseData = [
            'id' => $comment->id,
            'content' => $comment->content,
            'author_name' => $comment->getAuthorName(),
            'author_avatar' => $comment->is_anonymous ? null : $comment->user?->avatar,
            'is_anonymous' => $comment->is_anonymous,
            'status' => $comment->status,
            'created_at' => $comment->created_at->toISOString(),
            'updated_at' => $comment->updated_at->toISOString(),
            'can_edit' => $comment->canBeEditedBy(auth()->user()),
            'can_delete' => $comment->canBeDeletedBy(auth()->user()),
        ];

        // Add moderation info if needed
        if ($comment->isPending()) {
            $responseData['moderation_note'] = 'Your updated comment is pending approval.';
        } elseif ($comment->isRejected()) {
            $responseData['moderation_note'] = 'Your comment was rejected due to inappropriate content.';
        }

        $message = $comment->isApproved() 
            ? 'Comment updated successfully' 
            : 'Comment updated and submitted for review';

        return ResponseHelper::updated($responseData, $message);
    }

    /**
     * Remove the specified comment from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $comment = Comment::find($id);

        if (!$comment) {
            return ResponseHelper::notFound('Comment not found');
        }

        // Check authorization
        if (!$comment->canBeDeletedBy(auth()->user())) {
            return ResponseHelper::forbidden('You are not authorized to delete this comment');
        }

        // Store comment info before deletion for cleanup
        $commentId = $comment->id;
        $wasApproved = $comment->isApproved();

        // Delete the comment
        $comment->delete();

        // Clean up related notifications
        NotificationHelper::deleteCommentNotifications($commentId);

        return ResponseHelper::deleted('Comment deleted successfully');
    }

    /**
     * Create method is not needed for API (handled by store)
     */
    public function create()
    {
        // Not used in API
    }

    /**
     * Edit method is not needed for API (handled by update)
     */
    public function edit(string $id)
    {
        // Not used in API
    }
}

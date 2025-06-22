<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Like extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'post_id',
    ];

    /**
     * Get the user that owns the like.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the post that owns the like.
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    /**
     * Like a post by a user.
     */
    public static function likePost(int $userId, int $postId): bool
    {
        // Check if already liked
        if (static::where('user_id', $userId)->where('post_id', $postId)->exists()) {
            return false; // Already liked
        }

        // Create the like
        $like = static::create([
            'user_id' => $userId,
            'post_id' => $postId,
        ]);

        // Update post like count
        if ($like) {
            $post = Post::find($postId);
            if ($post) {
                $post->incrementLikeCount();
            }
        }

        return (bool) $like;
    }

    /**
     * Unlike a post by a user.
     */
    public static function unlikePost(int $userId, int $postId): bool
    {
        $like = static::where('user_id', $userId)->where('post_id', $postId)->first();
        
        if (!$like) {
            return false; // Not liked
        }

        $result = $like->delete();

        // Update post like count
        if ($result) {
            $post = Post::find($postId);
            if ($post) {
                $post->decrementLikeCount();
            }
        }

        return $result;
    }

    /**
     * Toggle like status for a post by a user.
     */
    public static function toggleLike(int $userId, int $postId): array
    {
        $like = static::where('user_id', $userId)->where('post_id', $postId)->first();
        
        if ($like) {
            // Unlike
            $result = static::unlikePost($userId, $postId);
            return [
                'liked' => false,
                'success' => $result,
                'message' => $result ? 'Post unliked successfully' : 'Failed to unlike post'
            ];
        } else {
            // Like
            $result = static::likePost($userId, $postId);
            return [
                'liked' => true,
                'success' => $result,
                'message' => $result ? 'Post liked successfully' : 'Failed to like post'
            ];
        }
    }

    /**
     * Check if a user has liked a post.
     */
    public static function hasUserLikedPost(int $userId, int $postId): bool
    {
        return static::where('user_id', $userId)->where('post_id', $postId)->exists();
    }

    /**
     * Get users who liked a post.
     */
    public static function getUsersWhoLikedPost(int $postId)
    {
        return static::where('post_id', $postId)
            ->with('user')
            ->get()
            ->pluck('user');
    }

    /**
     * Get posts liked by a user.
     */
    public static function getPostsLikedByUser(int $userId)
    {
        return static::where('user_id', $userId)
            ->with('post')
            ->get()
            ->pluck('post');
    }
}

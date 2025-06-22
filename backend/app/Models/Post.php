<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class Post extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'is_anonymous',
        'title',
        'content',
        'emotion',
        'link',
        'image',
        'image_metadata',
        'status',
        'admin_note',
        'like_count',
        'comment_count',
    ];

    /**
     * The model's default values for attributes.
     *
     * @var array
     */
    protected $attributes = [
        'status' => 'pending',
        'is_anonymous' => false,
        'like_count' => 0,
        'comment_count' => 0,
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_anonymous' => 'boolean',
        'like_count' => 'integer',
        'comment_count' => 'integer',
        'image_metadata' => 'array',
    ];

    /**
     * Get the user that owns the post.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the comments for the post.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Get the approved comments for the post.
     */
    public function approvedComments(): HasMany
    {
        return $this->hasMany(Comment::class)->where('status', 'approved');
    }

    /**
     * Get the likes for the post.
     */
    public function likes(): HasMany
    {
        return $this->hasMany(Like::class);
    }

    /**
     * Get the tags for the post.
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'post_tag');
    }

    /**
     * Scope a query to only include approved posts.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope a query to only include pending posts.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope a query to only include rejected posts.
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Scope a query to filter by status.
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope a query to order by latest.
     */
    public function scopeLatest($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    /**
     * Scope a query to order by most liked.
     */
    public function scopeMostLiked($query)
    {
        return $query->orderBy('like_count', 'desc');
    }

    /**
     * Get the author display name.
     */
    public function getAuthorName(): string
    {
        if ($this->is_anonymous || !$this->user) {
            return 'Anonymous User';
        }
        
        return $this->user->getDisplayName();
    }

    /**
     * Check if the post is approved.
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Check if the post is pending.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if the post is rejected.
     */
    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    /**
     * Approve the post.
     */
    public function approve(): bool
    {
        $this->status = 'approved';
        $this->admin_note = null;
        return $this->save();
    }

    /**
     * Reject the post with a note.
     */
    public function reject(string $note = null): bool
    {
        $this->status = 'rejected';
        if ($note) {
            $this->admin_note = $note;
        }
        return $this->save();
    }

    /**
     * Increment the like count.
     */
    public function incrementLikeCount(): void
    {
        $this->increment('like_count');
    }

    /**
     * Decrement the like count.
     */
    public function decrementLikeCount(): void
    {
        $this->decrement('like_count');
    }

    /**
     * Increment the comment count.
     */
    public function incrementCommentCount(): void
    {
        $this->increment('comment_count');
    }

    /**
     * Decrement the comment count.
     */
    public function decrementCommentCount(): void
    {
        $this->decrement('comment_count');
    }

    /**
     * Update like count based on actual likes.
     */
    public function updateLikeCount(): void
    {
        $this->like_count = $this->likes()->count();
        $this->save();
    }

    /**
     * Update comment count based on approved comments.
     */
    public function updateCommentCount(): void
    {
        $this->comment_count = $this->approvedComments()->count();
        $this->save();
    }

    /**
     * Check if user can edit this post.
     */
    public function canBeEditedBy(User $user): bool
    {
        // Admin and moderators can edit any post
        if ($user->hasModeratorPrivileges()) {
            return true;
        }
        
        // Users can only edit their own posts
        return $this->user_id === $user->id;
    }

    /**
     * Check if user can delete this post.
     */
    public function canBeDeletedBy(User $user): bool
    {
        // Admins can delete any post
        if ($user->isAdmin()) {
            return true;
        }

        // Users can only delete their own posts
        return $this->user_id === $user->id;
    }

    /**
     * Get the image URL.
     */
    public function getImageUrl(): ?string
    {
        if (!$this->image) {
            return null;
        }

        // If the image path starts with 'http', return as is (external URL)
        if (str_starts_with($this->image, 'http')) {
            return $this->image;
        }

        // Return the full URL for local storage
        return asset('storage/' . $this->image);
    }

    /**
     * Get the image thumbnail URL.
     */
    public function getImageThumbnailUrl(): ?string
    {
        if (!$this->image) {
            return null;
        }

        $metadata = $this->image_metadata;
        if (isset($metadata['thumbnail'])) {
            return asset('storage/' . $metadata['thumbnail']);
        }

        // Fallback to original image
        return $this->getImageUrl();
    }

    /**
     * Check if the post has an image.
     */
    public function hasImage(): bool
    {
        return !empty($this->image);
    }

    /**
     * Get image alt text from metadata or generate default.
     */
    public function getImageAlt(): string
    {
        $metadata = $this->image_metadata;
        
        if (isset($metadata['alt'])) {
            return $metadata['alt'];
        }

        return 'Image for post: ' . $this->title;
    }

    /**
     * Get image metadata with defaults.
     */
    public function getImageMetadata(): array
    {
        $metadata = $this->image_metadata ?? [];

        return array_merge([
            'alt' => $this->getImageAlt(),
            'size' => null,
            'width' => null,
            'height' => null,
            'mime_type' => null,
            'thumbnail' => null,
        ], $metadata);
    }

    /**
     * Scope to get posts from a specific week.
     */
    public function scopeWeeklyCount($query, $week)
    {
        $startOfWeek = Carbon::parse($week)->startOfWeek();
        $endOfWeek = Carbon::parse($week)->endOfWeek();
        
        return $query->whereBetween('created_at', [$startOfWeek, $endOfWeek]);
    }

    /**
     * Scope to include engagement counts.
     */
    public function scopeWithEngagementCounts($query)
    {
        return $query->withCount(['likes', 'comments']);
    }

    /**
     * Get weekly statistics for the last 8 weeks.
     */
    public static function getWeeklyStatistics()
    {
        $weeks = [];
        for ($i = 7; $i >= 0; $i--) {
            $date = Carbon::now()->subWeeks($i)->startOfWeek();
            $weeks[] = [
                'week' => $date->format('Y-m-d'),
                'count' => static::weeklyCount($date->format('Y-m-d'))->count()
            ];
        }
        return $weeks;
    }

    /**
     * Get post statistics by status.
     */
    public static function getStatusStatistics()
    {
        return [
            'total' => static::count(),
            'pending' => static::pending()->count(),
            'approved' => static::approved()->count(),
            'rejected' => static::rejected()->count(),
        ];
    }

    /**
     * Get total engagement count (likes + comments).
     */
    public static function getTotalEngagementCount()
    {
        $totalLikes = static::sum('like_count');
        $totalComments = static::sum('comment_count');
        
        return $totalLikes + $totalComments;
    }

    /**
     * Check if the post is liked by a specific user.
     *
     * @param int|null $userId
     * @return bool
     */
    public function isLikedByUser(?int $userId): bool
    {
        if (!$userId) {
            return false;
        }
        
        // Direct database check instead of using the Like model method
        return DB::table('likes')
            ->where('user_id', $userId)
            ->where('post_id', $this->id)
            ->exists();
    }
}

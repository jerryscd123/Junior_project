<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'type',
        'data',
        'is_read',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
    ];

    /**
     * Valid notification types.
     */
    const TYPES = [
        'like',
        'comment',
        'admin_message',
        'post_approved',
        'post_rejected',
        'comment_approved',
        'comment_rejected',
    ];

    /**
     * Get the user that owns the notification.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to only include unread notifications.
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope a query to only include read notifications.
     */
    public function scopeRead($query)
    {
        return $query->where('is_read', true);
    }

    /**
     * Scope a query to filter by type.
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope a query to order by latest.
     */
    public function scopeLatest($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    /**
     * Mark the notification as read.
     */
    public function markAsRead(): bool
    {
        $this->is_read = true;
        return $this->save();
    }

    /**
     * Mark the notification as unread.
     */
    public function markAsUnread(): bool
    {
        $this->is_read = false;
        return $this->save();
    }

    /**
     * Get the notification title based on type.
     */
    public function getTitle(): string
    {
        return match($this->type) {
            'like' => 'New Like',
            'comment' => 'New Comment',
            'admin_message' => 'Admin Message',
            'post_approved' => 'Post Approved',
            'post_rejected' => 'Post Rejected',
            'comment_approved' => 'Comment Approved',
            'comment_rejected' => 'Comment Rejected',
            default => 'Notification',
        };
    }

    /**
     * Get the notification message.
     */
    public function getMessage(): string
    {
        $data = $this->data ?? [];
        
        return match($this->type) {
            'like' => "Someone liked your post: " . ($data['post_title'] ?? 'Unknown Post'),
            'comment' => "Someone commented on your post: " . ($data['post_title'] ?? 'Unknown Post'),
            'admin_message' => $data['message'] ?? 'You have a new admin message',
            'post_approved' => "Your post has been approved: " . ($data['post_title'] ?? 'Unknown Post'),
            'post_rejected' => "Your post has been rejected: " . ($data['post_title'] ?? 'Unknown Post'),
            'comment_approved' => "Your comment has been approved on: " . ($data['post_title'] ?? 'Unknown Post'),
            'comment_rejected' => "Your comment has been rejected on: " . ($data['post_title'] ?? 'Unknown Post'),
            default => 'You have a new notification',
        };
    }

    /**
     * Get the notification URL.
     */
    public function getUrl(): ?string
    {
        $data = $this->data ?? [];
        
        return match($this->type) {
            'like', 'comment', 'post_approved', 'post_rejected' => 
                isset($data['post_id']) ? "/posts/{$data['post_id']}" : null,
            'comment_approved', 'comment_rejected' => 
                isset($data['post_id']) ? "/posts/{$data['post_id']}" : null,
            'admin_message' => '/messages',
            default => null,
        };
    }

    /**
     * Create a like notification.
     */
    public static function createLikeNotification(int $userId, int $postId, string $postTitle): self
    {
        return static::create([
            'user_id' => $userId,
            'type' => 'like',
            'data' => [
                'post_id' => $postId,
                'post_title' => $postTitle,
            ],
        ]);
    }

    /**
     * Create a comment notification.
     */
    public static function createCommentNotification(int $userId, int $postId, string $postTitle, int $commentId): self
    {
        return static::create([
            'user_id' => $userId,
            'type' => 'comment',
            'data' => [
                'post_id' => $postId,
                'post_title' => $postTitle,
                'comment_id' => $commentId,
            ],
        ]);
    }

    /**
     * Create an admin message notification.
     */
    public static function createAdminMessageNotification(int $userId, string $message): self
    {
        return static::create([
            'user_id' => $userId,
            'type' => 'admin_message',
            'data' => [
                'message' => $message,
            ],
        ]);
    }

    /**
     * Create a post approved notification.
     */
    public static function createPostApprovedNotification(int $userId, int $postId, string $postTitle): self
    {
        return static::create([
            'user_id' => $userId,
            'type' => 'post_approved',
            'data' => [
                'post_id' => $postId,
                'post_title' => $postTitle,
            ],
        ]);
    }

    /**
     * Create a post rejected notification.
     */
    public static function createPostRejectedNotification(int $userId, int $postId, string $postTitle, string $reason = null): self
    {
        $data = [
            'post_id' => $postId,
            'post_title' => $postTitle,
        ];
        
        if ($reason) {
            $data['reason'] = $reason;
        }

        return static::create([
            'user_id' => $userId,
            'type' => 'post_rejected',
            'data' => $data,
        ]);
    }

    /**
     * Create a comment approved notification.
     */
    public static function createCommentApprovedNotification(int $userId, int $postId, string $postTitle, int $commentId): self
    {
        return static::create([
            'user_id' => $userId,
            'type' => 'comment_approved',
            'data' => [
                'post_id' => $postId,
                'post_title' => $postTitle,
                'comment_id' => $commentId,
            ],
        ]);
    }

    /**
     * Create a comment rejected notification.
     */
    public static function createCommentRejectedNotification(int $userId, int $postId, string $postTitle, int $commentId, string $reason = null): self
    {
        $data = [
            'post_id' => $postId,
            'post_title' => $postTitle,
            'comment_id' => $commentId,
        ];
        
        if ($reason) {
            $data['reason'] = $reason;
        }

        return static::create([
            'user_id' => $userId,
            'type' => 'comment_rejected',
            'data' => $data,
        ]);
    }

    /**
     * Mark multiple notifications as read.
     */
    public static function markMultipleAsRead(array $notificationIds): int
    {
        return static::whereIn('id', $notificationIds)->update(['is_read' => true]);
    }

    /**
     * Mark all notifications as read for a user.
     */
    public static function markAllAsReadForUser(int $userId): int
    {
        return static::where('user_id', $userId)->update(['is_read' => true]);
    }

    /**
     * Get unread count for a user.
     */
    public static function getUnreadCountForUser(int $userId): int
    {
        return static::where('user_id', $userId)->unread()->count();
    }

    /**
     * Validate notification type.
     */
    public static function isValidType(string $type): bool
    {
        return in_array($type, static::TYPES);
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        // Validate type before saving
        static::saving(function ($notification) {
            if (!static::isValidType($notification->type)) {
                throw new \InvalidArgumentException("Invalid notification type: {$notification->type}");
            }
        });
    }
}

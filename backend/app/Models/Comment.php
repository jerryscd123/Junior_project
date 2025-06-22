<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'post_id',
        'user_id',
        'is_anonymous',
        'content',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_anonymous' => 'boolean',
    ];

    /**
     * Get the post that owns the comment.
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    /**
     * Get the user that owns the comment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to only include approved comments.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope a query to only include pending comments.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope a query to only include rejected comments.
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
     * Scope a query to order by oldest.
     */
    public function scopeOldest($query)
    {
        return $query->orderBy('created_at', 'asc');
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
     * Check if the comment is approved.
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Check if the comment is pending.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if the comment is rejected.
     */
    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    /**
     * Approve the comment.
     */
    public function approve(): bool
    {
        $this->status = 'approved';
        $result = $this->save();
        
        // Update post comment count
        if ($result && $this->post) {
            $this->post->updateCommentCount();
        }
        
        return $result;
    }

    /**
     * Reject the comment.
     */
    public function reject(): bool
    {
        $this->status = 'rejected';
        $result = $this->save();
        
        // Update post comment count
        if ($result && $this->post) {
            $this->post->updateCommentCount();
        }
        
        return $result;
    }

    /**
     * Check if user can edit this comment.
     */
    public function canBeEditedBy(User $user): bool
    {
        // Admin and moderators can edit any comment
        if ($user->hasModeratorPrivileges()) {
            return true;
        }
        
        // Users can only edit their own comments
        return $this->user_id === $user->id;
    }

    /**
     * Check if user can delete this comment.
     */
    public function canBeDeletedBy(User $user): bool
    {
        // Admin and moderators can delete any comment
        if ($user->hasModeratorPrivileges()) {
            return true;
        }
        
        // Users can only delete their own comments
        return $this->user_id === $user->id;
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        // When a comment is deleted, update the post comment count
        static::deleted(function ($comment) {
            if ($comment->post && $comment->isApproved()) {
                $comment->post->decrementCommentCount();
            }
        });
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'to_admin_id',
        'subject',
        'content',
        'status',
    ];

    /**
     * Valid message statuses.
     */
    const STATUSES = [
        'unread',
        'read',
        'responded',
    ];

    /**
     * Get the user that sent the message.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the admin that received the message.
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_admin_id');
    }

    /**
     * Scope a query to only include unread messages.
     */
    public function scopeUnread($query)
    {
        return $query->where('status', 'unread');
    }

    /**
     * Scope a query to only include read messages.
     */
    public function scopeRead($query)
    {
        return $query->where('status', 'read');
    }

    /**
     * Scope a query to only include responded messages.
     */
    public function scopeResponded($query)
    {
        return $query->where('status', 'responded');
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
     * Scope a query to get messages for a specific user.
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope a query to get messages for a specific admin.
     */
    public function scopeForAdmin($query, $adminId)
    {
        return $query->where('to_admin_id', $adminId);
    }

    /**
     * Check if the message is unread.
     */
    public function isUnread(): bool
    {
        return $this->status === 'unread';
    }

    /**
     * Check if the message is read.
     */
    public function isRead(): bool
    {
        return $this->status === 'read';
    }

    /**
     * Check if the message is responded.
     */
    public function isResponded(): bool
    {
        return $this->status === 'responded';
    }

    /**
     * Mark the message as read.
     */
    public function markAsRead(): bool
    {
        if ($this->status === 'unread') {
            $this->status = 'read';
            return $this->save();
        }
        return true;
    }

    /**
     * Mark the message as responded.
     */
    public function markAsResponded(): bool
    {
        $this->status = 'responded';
        return $this->save();
    }

    /**
     * Get the sender display name.
     */
    public function getSenderName(): string
    {
        if (!$this->user) {
            return 'Unknown User';
        }
        
        return $this->user->getDisplayName();
    }

    /**
     * Get the admin display name.
     */
    public function getAdminName(): ?string
    {
        if (!$this->admin) {
            return null;
        }
        
        return $this->admin->name;
    }

    /**
     * Send a message to admin.
     */
    public static function sendToAdmin(int $userId, string $subject, string $content, int $adminId = null): self
    {
        return static::create([
            'user_id' => $userId,
            'to_admin_id' => $adminId,
            'subject' => $subject,
            'content' => $content,
            'status' => 'unread',
        ]);
    }

    /**
     * Reply to a message (admin functionality).
     */
    public function reply(string $replyContent, int $adminId): bool
    {
        // Mark original message as responded
        $this->markAsResponded();
        
        // Create notification for the user
        Notification::createAdminMessageNotification(
            $this->user_id,
            "Admin replied to your message: {$this->subject}"
        );
        
        return true;
    }

    /**
     * Get unread count for admin.
     */
    public static function getUnreadCountForAdmin(int $adminId = null): int
    {
        $query = static::unread();
        
        if ($adminId) {
            $query->where('to_admin_id', $adminId);
        }
        
        return $query->count();
    }

    /**
     * Get total unread count.
     */
    public static function getTotalUnreadCount(): int
    {
        return static::unread()->count();
    }

    /**
     * Get messages for admin dashboard.
     */
    public static function getForAdminDashboard(int $limit = 10)
    {
        return static::with(['user'])
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Get user's message history.
     */
    public static function getUserMessageHistory(int $userId, int $limit = 20)
    {
        return static::forUser($userId)
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * Search messages by subject or content.
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('subject', 'like', '%' . $search . '%')
              ->orWhere('content', 'like', '%' . $search . '%');
        });
    }

    /**
     * Get status badge color.
     */
    public function getStatusBadgeColor(): string
    {
        return match($this->status) {
            'unread' => 'red',
            'read' => 'yellow',
            'responded' => 'green',
            default => 'gray',
        };
    }

    /**
     * Get status display text.
     */
    public function getStatusDisplayText(): string
    {
        return match($this->status) {
            'unread' => 'Unread',
            'read' => 'Read',
            'responded' => 'Responded',
            default => 'Unknown',
        };
    }

    /**
     * Validate message status.
     */
    public static function isValidStatus(string $status): bool
    {
        return in_array($status, static::STATUSES);
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        // Validate status before saving
        static::saving(function ($message) {
            if (!static::isValidStatus($message->status)) {
                throw new \InvalidArgumentException("Invalid message status: {$message->status}");
            }
        });
    }

    /**
     * Update message status.
     */
    public function updateStatus(string $status): bool
    {
        if (!static::isValidStatus($status)) {
            throw new \InvalidArgumentException("Invalid message status: {$status}");
        }
        
        $this->status = $status;
        return $this->save();
    }

    /**
     * Get message statistics by status.
     */
    public static function getMessageStatistics(): array
    {
        return [
            'total' => static::count(),
            'unread' => static::unread()->count(),
            'read' => static::read()->count(),
            'responded' => static::responded()->count(),
        ];
    }

    /**
     * Get messages with pagination and filters.
     */
    public static function getWithFilters(array $filters = [], int $perPage = 15)
    {
        $query = static::with(['user:id,name,email', 'admin:id,name']);

        if (isset($filters['status'])) {
            $query->byStatus($filters['status']);
        }

        if (isset($filters['user_id'])) {
            $query->forUser($filters['user_id']);
        }

        if (isset($filters['admin_id'])) {
            $query->forAdmin($filters['admin_id']);
        }

        if (isset($filters['search'])) {
            $query->search($filters['search']);
        }

        return $query->latest()->paginate($perPage);
    }
}

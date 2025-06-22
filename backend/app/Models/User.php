<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'bio',
        'is_anonymous',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_anonymous' => 'boolean',
    ];

    /**
     * Get the posts for the user.
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    /**
     * Get the comments for the user.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Get the likes for the user.
     */
    public function likes(): HasMany
    {
        return $this->hasMany(Like::class);
    }

    /**
     * Get the notifications for the user.
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * Get the messages sent by the user.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Get the messages received by the admin user.
     */
    public function receivedMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'to_admin_id');
    }

    /**
     * Check if user is admin.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is moderator.
     */
    public function isModerator(): bool
    {
        return $this->role === 'moderator';
    }

    /**
     * Check if user has admin or moderator privileges.
     */
    public function hasModeratorPrivileges(): bool
    {
        return in_array($this->role, ['admin', 'moderator']);
    }

    /**
     * Get display name for anonymous users.
     */
    public function getDisplayName(): string
    {
        if ($this->is_anonymous) {
            return 'Anonymous User';
        }
        
        return $this->name;
    }

    /**
     * Get avatar URL with fallback.
     */
    public function getAvatarUrl(): string
    {
        if ($this->avatar) {
            return asset('storage/' . $this->avatar);
        }
        
        // Return default avatar or gravatar
        return 'https://www.gravatar.com/avatar/' . md5(strtolower(trim($this->email))) . '?d=identicon&s=150';
    }

    /**
     * Scope to get only admin users.
     */
    public function scopeAdmins($query)
    {
        return $query->where('role', 'admin');
    }

    /**
     * Scope to get only moderator users.
     */
    public function scopeModerators($query)
    {
        return $query->where('role', 'moderator');
    }

    /**
     * Scope to get users with moderation privileges.
     */
    public function scopeWithModerationPrivileges($query)
    {
        return $query->whereIn('role', ['admin', 'moderator']);
    }

    /**
     * Scope to get users registered in the last week.
     */
    public function scopeNewUsersLastWeek($query)
    {
        $oneWeekAgo = Carbon::now()->subWeek();
        return $query->where('created_at', '>=', $oneWeekAgo);
    }

    /**
     * Scope to get users with their statistics.
     */
    public function scopeWithStatistics($query)
    {
        return $query->withCount(['posts', 'comments', 'likes']);
    }

    /**
     * Get total likes given by this user.
     */
    public function getTotalLikesGivenAttribute(): int
    {
        return $this->likes()->count();
    }

    /**
     * Get total likes received by this user on their posts.
     */
    public function getTotalLikesReceivedAttribute(): int
    {
        return $this->posts()->sum('like_count');
    }

    /**
     * Get total comments made by this user.
     */
    public function getTotalCommentsAttribute(): int
    {
        return $this->comments()->count();
    }

    /**
     * Get total posts/confessions made by this user.
     */
    public function getTotalPostsAttribute(): int
    {
        return $this->posts()->count();
    }

    /**
     * Get weekly user registration statistics for the last 8 weeks.
     */
    public static function getWeeklyRegistrationStatistics()
    {
        $weeks = [];
        for ($i = 7; $i >= 0; $i--) {
            $startOfWeek = Carbon::now()->subWeeks($i)->startOfWeek();
            $endOfWeek = Carbon::now()->subWeeks($i)->endOfWeek();
            
            $weeks[] = [
                'week' => $startOfWeek->format('Y-m-d'),
                'count' => static::whereBetween('created_at', [$startOfWeek, $endOfWeek])->count()
            ];
        }
        return $weeks;
    }

    /**
     * Get user statistics summary.
     */
    public static function getUserStatistics()
    {
        return [
            'total_users' => static::count(),
            'new_users_last_week' => static::newUsersLastWeek()->count(),
            'admins' => static::admins()->count(),
            'moderators' => static::moderators()->count(),
        ];
    }
}

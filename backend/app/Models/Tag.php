<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tag extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
    ];

    /**
     * Get the posts for the tag.
     */
    public function posts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'post_tag');
    }

    /**
     * Get the approved posts for the tag.
     */
    public function approvedPosts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'post_tag')
            ->where('posts.status', 'approved');
    }

    /**
     * Scope a query to search tags by name.
     */
    public function scopeSearch($query, $search)
    {
        return $query->where('name', 'like', '%' . $search . '%');
    }

    /**
     * Scope a query to order tags by name.
     */
    public function scopeOrderByName($query, $direction = 'asc')
    {
        return $query->orderBy('name', $direction);
    }

    /**
     * Scope a query to order tags by post count.
     */
    public function scopeOrderByPostCount($query, $direction = 'desc')
    {
        return $query->withCount('posts')->orderBy('posts_count', $direction);
    }

    /**
     * Scope a query to get popular tags (with most posts).
     */
    public function scopePopular($query, $limit = 10)
    {
        return $query->withCount('approvedPosts')
            ->orderBy('approved_posts_count', 'desc')
            ->limit($limit);
    }

    /**
     * Find or create a tag by name.
     */
    public static function findOrCreateByName(string $name): self
    {
        $name = trim(strtolower($name));
        
        return static::firstOrCreate(['name' => $name]);
    }

    /**
     * Find or create multiple tags by names.
     */
    public static function findOrCreateByNames(array $names): \Illuminate\Database\Eloquent\Collection
    {
        $tags = collect();
        
        foreach ($names as $name) {
            $name = trim(strtolower($name));
            if (!empty($name)) {
                $tags->push(static::findOrCreateByName($name));
            }
        }
        
        return $tags;
    }

    /**
     * Get tags with post counts.
     */
    public static function withPostCounts()
    {
        return static::withCount('approvedPosts')
            ->orderBy('approved_posts_count', 'desc');
    }

    /**
     * Search tags by name with post counts.
     */
    public static function searchWithPostCounts(string $search)
    {
        return static::search($search)
            ->withCount('approvedPosts')
            ->orderBy('approved_posts_count', 'desc');
    }

    /**
     * Get the most used tags.
     */
    public static function getMostUsed(int $limit = 20)
    {
        return static::withCount('approvedPosts')
            ->having('approved_posts_count', '>', 0)
            ->orderBy('approved_posts_count', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get unused tags.
     */
    public static function getUnused()
    {
        return static::withCount('posts')
            ->having('posts_count', '=', 0)
            ->get();
    }

    /**
     * Clean up unused tags.
     */
    public static function cleanupUnused(): int
    {
        $unusedTags = static::getUnused();
        $count = $unusedTags->count();
        
        foreach ($unusedTags as $tag) {
            $tag->delete();
        }
        
        return $count;
    }

    /**
     * Validate tag name.
     */
    public static function isValidName(string $name): bool
    {
        $name = trim($name);
        
        // Check length (1-50 characters)
        if (strlen($name) < 1 || strlen($name) > 50) {
            return false;
        }
        
        // Check for valid characters (letters, numbers, spaces, hyphens, underscores)
        if (!preg_match('/^[a-zA-Z0-9\s\-_]+$/', $name)) {
            return false;
        }
        
        return true;
    }

    /**
     * Normalize tag name.
     */
    public static function normalizeName(string $name): string
    {
        return trim(strtolower($name));
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        // Normalize name before saving
        static::saving(function ($tag) {
            $tag->name = static::normalizeName($tag->name);
        });
    }
}

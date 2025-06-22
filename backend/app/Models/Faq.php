<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Faq extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'question',
        'answer',
    ];

    /**
     * Scope a query to search FAQs by question or answer.
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('question', 'like', '%' . $search . '%')
              ->orWhere('answer', 'like', '%' . $search . '%');
        });
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
     * Scope a query to order by question alphabetically.
     */
    public function scopeOrderByQuestion($query, $direction = 'asc')
    {
        return $query->orderBy('question', $direction);
    }

    /**
     * Get all FAQs ordered by creation date.
     */
    public static function getAllOrdered()
    {
        return static::latest()->get();
    }

    /**
     * Search FAQs by keyword.
     */
    public static function searchByKeyword(string $keyword)
    {
        return static::search($keyword)->latest()->get();
    }

    /**
     * Get popular FAQs (this could be extended with view counts).
     */
    public static function getPopular(int $limit = 10)
    {
        return static::latest()->limit($limit)->get();
    }

    /**
     * Create a new FAQ.
     */
    public static function createFaq(string $question, string $answer): self
    {
        return static::create([
            'question' => trim($question),
            'answer' => trim($answer),
        ]);
    }

    /**
     * Update an existing FAQ.
     */
    public function updateFaq(string $question, string $answer): bool
    {
        return $this->update([
            'question' => trim($question),
            'answer' => trim($answer),
        ]);
    }

    /**
     * Get FAQ by ID with error handling.
     */
    public static function findFaq(string $id): ?self
    {
        return static::find($id);
    }

    /**
     * Delete FAQ by ID.
     */
    public static function deleteFaq(string $id): bool
    {
        $faq = static::find($id);
        
        if (!$faq) {
            return false;
        }
        
        return $faq->delete();
    }

    /**
     * Get FAQ count.
     */
    public static function getCount(): int
    {
        return static::count();
    }

    /**
     * Get recent FAQs.
     */
    public static function getRecent(int $limit = 5)
    {
        return static::latest()->limit($limit)->get();
    }

    /**
     * Check if question already exists.
     */
    public static function questionExists(string $question, string|int $excludeId = null): bool
    {
        $query = static::where('question', 'like', '%' . trim($question) . '%');
        
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        
        return $query->exists();
    }

    /**
     * Get similar FAQs based on question.
     */
    public static function getSimilar(string $question, int $limit = 3, string|int $excludeId = null)
    {
        $query = static::search($question);
        
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        
        return $query->limit($limit)->get();
    }

    /**
     * Validate FAQ data.
     */
    public static function validateData(array $data): array
    {
        $errors = [];
        
        if (empty(trim($data['question'] ?? ''))) {
            $errors['question'] = 'Question is required';
        } elseif (strlen(trim($data['question'])) < 10) {
            $errors['question'] = 'Question must be at least 10 characters long';
        }
        
        if (empty(trim($data['answer'] ?? ''))) {
            $errors['answer'] = 'Answer is required';
        } elseif (strlen(trim($data['answer'])) < 20) {
            $errors['answer'] = 'Answer must be at least 20 characters long';
        }
        
        return $errors;
    }

    /**
     * Get formatted question (truncated if needed).
     */
    public function getFormattedQuestion(int $maxLength = 100): string
    {
        if (strlen($this->question) <= $maxLength) {
            return $this->question;
        }
        
        return substr($this->question, 0, $maxLength) . '...';
    }

    /**
     * Get formatted answer (truncated if needed).
     */
    public function getFormattedAnswer(int $maxLength = 200): string
    {
        if (strlen($this->answer) <= $maxLength) {
            return $this->answer;
        }
        
        return substr($this->answer, 0, $maxLength) . '...';
    }

    /**
     * Get FAQ statistics.
     */
    public static function getStatistics(): array
    {
        return [
            'total_faqs' => static::count(),
            'recent_faqs' => static::where('created_at', '>=', now()->subDays(30))->count(),
            'latest_faq' => static::latest()->first(),
        ];
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        // Trim whitespace before saving
        static::saving(function ($faq) {
            $faq->question = trim($faq->question);
            $faq->answer = trim($faq->answer);
        });
    }
}

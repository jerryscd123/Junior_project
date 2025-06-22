<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Utils\ContentFilter;
use App\Utils\AnonymousHelper;

class CreatePostRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Allow both authenticated users and anonymous users (if enabled)
        return auth()->check() || AnonymousHelper::isAnonymousPostingAllowed();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => [
                'required',
                'string',
                'min:5',
                'max:200',
                function ($attribute, $value, $fail) {
                    if (ContentFilter::shouldAutoReject($value)) {
                        $fail('The title contains inappropriate content.');
                    }
                },
            ],
            'content' => [
                'required',
                'string',
                'min:10',
                'max:10000',
                function ($attribute, $value, $fail) {
                    if (ContentFilter::shouldAutoReject($value)) {
                        $fail('The content contains inappropriate content.');
                    }
                },
            ],
            'emotion' => [
                'sometimes',
                'string',
                'max:50',
            ],
            'link' => [
                'sometimes',
                'url',
                'max:2048',
            ],
            'image' => [
                'sometimes',
                'image',
                'mimes:jpeg,jpg,png,gif,webp',
                'max:5120', // 5MB max file size
                'dimensions:min_width=100,min_height=100,max_width=2048,max_height=2048',
            ],
            'image_alt' => [
                'sometimes',
                'string',
                'max:255',
            ],
            'tags' => [
                'sometimes',
                'array',
                'max:10', // Maximum 10 tags
            ],
            'tags.*' => [
                'string',
                'min:2',
                'max:50',
                'regex:/^[a-zA-Z0-9\s\-_]+$/', // Only alphanumeric, spaces, hyphens, and underscores
                function ($attribute, $value, $fail) {
                    if (ContentFilter::containsBannedWords($value)) {
                        $fail('One or more tags contain inappropriate content.');
                    }
                },
            ],
            'is_anonymous' => [
                'sometimes',
                'boolean',
            ],
            'anonymous_id' => [
                'required_if:is_anonymous,true',
                'nullable',
                'string',
                function ($attribute, $value, $fail) {
                    if ($value && !AnonymousHelper::isValidAnonymousId($value)) {
                        $fail('Invalid anonymous identifier format.');
                    }
                },
            ],
            'status' => [
                'sometimes',
                'string',
                'in:pending,approved,rejected',
            ],
        ];
    }

    /**
     * Get custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'A title is required.',
            'title.min' => 'Title must be at least 5 characters long.',
            'title.max' => 'Title cannot exceed 200 characters.',
            'content.required' => 'Content is required.',
            'content.min' => 'Content must be at least 10 characters long.',
            'content.max' => 'Content cannot exceed 10,000 characters.',
            'emotion.max' => 'The emotion text cannot exceed 50 characters.',
            'link.url' => 'The link must be a valid URL.',
            'link.max' => 'The link cannot exceed 2048 characters.',
            'image.image' => 'The image must be a valid image file.',
            'image.mimes' => 'The image must be one of the following formats: jpeg, jpg, png, gif, webp.',
            'image.max' => 'The image file size cannot exceed 5MB.',
            'image.dimensions' => 'The image dimensions must be between 100x100 and 2048x2048 pixels.',
            'image_alt.max' => 'The image alt text cannot exceed 255 characters.',
            'tags.array' => 'Tags must be provided as an array.',
            'tags.max' => 'You cannot add more than 10 tags.',
            'tags.*.string' => 'Each tag must be a string.',
            'tags.*.min' => 'Each tag must be at least 2 characters long.',
            'tags.*.max' => 'Each tag cannot exceed 50 characters.',
            'tags.*.regex' => 'Tags can only contain letters, numbers, spaces, hyphens, and underscores.',
            'is_anonymous.boolean' => 'Anonymous status must be true or false.',
            'anonymous_id.required_if' => 'Anonymous ID is required for anonymous posts.',
            'status.in' => 'Status must be pending, approved, or rejected.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'title' => 'title',
            'content' => 'content',
            'emotion' => 'emotion',
            'link' => 'link',
            'image' => 'image',
            'image_alt' => 'image alt text',
            'tags' => 'tags',
            'tags.*' => 'tag',
            'is_anonymous' => 'anonymous status',
            'anonymous_id' => 'anonymous ID',
            'status' => 'status',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Trim whitespace from string fields only if they exist and are not empty
        $title = $this->input('title') ? trim($this->input('title')) : $this->input('title');
        $content = $this->input('content') ? trim($this->input('content')) : $this->input('content');
        
        $mergeData = [];
        
        if ($title !== null) {
            $mergeData['title'] = $title;
        }
        
        if ($content !== null) {
            $mergeData['content'] = $content;
        }
        
        $this->merge($mergeData);

        // Process tags
        if ($this->has('tags') && is_array($this->input('tags'))) {
            $tags = array_map(function ($tag) {
                return trim(strtolower($tag));
            }, $this->input('tags'));
            
            // Remove duplicates and empty tags
            $tags = array_filter(array_unique($tags), function ($tag) {
                return !empty($tag);
            });
            
            $this->merge(['tags' => array_values($tags)]);
        }

        // Set default values
        if (!$this->has('is_anonymous')) {
            $this->merge(['is_anonymous' => false]);
        }

        // Generate anonymous ID if needed
        if ($this->input('is_anonymous') && !$this->has('anonymous_id')) {
            $this->merge(['anonymous_id' => AnonymousHelper::getSessionAnonymousId()]);
        }

        // Set default status
        if (!$this->has('status')) {
            $this->merge(['status' => 'pending']);
        }
    }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(\Illuminate\Contracts\Validation\Validator $validator): void
    {
        throw new \Illuminate\Http\Exceptions\HttpResponseException(
            response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422)
        );
    }

    /**
     * Get the validated data with content analysis.
     *
     * @return array
     */
    public function getValidatedWithAnalysis(): array
    {
        $validated = $this->validated();
        
        // Analyze content for moderation
        $titleAnalysis = ContentFilter::analyzeContent($validated['title']);
        $contentAnalysis = ContentFilter::analyzeContent($validated['content']);
        
        // Determine if post requires moderation
        $requiresModeration = $titleAnalysis['requires_moderation'] || $contentAnalysis['requires_moderation'];
        $autoReject = $titleAnalysis['auto_reject'] || $contentAnalysis['auto_reject'];
        
        // Set status based on content analysis
        if ($autoReject) {
            $validated['status'] = 'rejected';
        } elseif ($requiresModeration) {
            $validated['status'] = 'pending';
        } else {
            $validated['status'] = 'approved';
        }
        
        // Add analysis data
        $validated['content_analysis'] = [
            'title' => $titleAnalysis,
            'content' => $contentAnalysis,
            'requires_moderation' => $requiresModeration,
            'auto_reject' => $autoReject,
        ];
        
        return $validated;
    }
}

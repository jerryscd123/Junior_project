<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Utils\ContentFilter;

class UpdatePostRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check(); // Only authenticated users can update posts
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
                'sometimes',
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
                'sometimes',
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
            'remove_image' => [
                'sometimes',
                'boolean',
            ],
            'tags' => [
                'sometimes',
                'array',
                'max:10',
            ],
            'tags.*' => [
                'string',
                'min:2',
                'max:50',
                'regex:/^[a-zA-Z0-9\s\-_]+$/',
                function ($attribute, $value, $fail) {
                    if (ContentFilter::containsBannedWords($value)) {
                        $fail('One or more tags contain inappropriate content.');
                    }
                },
            ],
        ];
    }

    /**
     * Get custom error messages for validation rules.
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
            'remove_image.boolean' => 'The remove image field must be a boolean.',
            'tags.array' => 'Tags must be provided as an array.',
            'tags.max' => 'You cannot add more than 10 tags.',
            'tags.*.min' => 'Each tag must be at least 2 characters long.',
            'tags.*.max' => 'Each tag cannot exceed 50 characters.',
            'tags.*.regex' => 'Tags can only contain letters, numbers, spaces, hyphens, and underscores.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $data = [];
        
        if ($this->has('title')) {
            $data['title'] = trim($this->title);
        }
        
        if ($this->has('content')) {
            $data['content'] = trim($this->content);
        }

        if ($this->has('tags') && is_array($this->tags)) {
            $tags = array_map(function ($tag) {
                return trim(strtolower($tag));
            }, $this->tags);
            
            $tags = array_filter(array_unique($tags), function ($tag) {
                return !empty($tag);
            });
            
            $data['tags'] = array_values($tags);
        }

        if (!empty($data)) {
            $this->merge($data);
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
}

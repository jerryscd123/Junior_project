<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Utils\ContentFilter;
use App\Utils\AnonymousHelper;

class CreateCommentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check() || AnonymousHelper::isAnonymousPostingAllowed();
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'content' => [
                'required',
                'string',
                'min:3',
                'max:2000',
                function ($attribute, $value, $fail) {
                    if (ContentFilter::shouldAutoReject($value)) {
                        $fail('The comment contains inappropriate content.');
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
        ];
    }

    /**
     * Get custom error messages for validation rules.
     */
    public function messages(): array
    {
        return [
            'content.required' => 'Comment content is required.',
            'content.min' => 'Comment must be at least 3 characters long.',
            'content.max' => 'Comment cannot exceed 2,000 characters.',
            'is_anonymous.boolean' => 'Anonymous status must be true or false.',
            'anonymous_id.required_if' => 'Anonymous ID is required for anonymous comments.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'content' => $this->input('content') ? trim($this->input('content')) : null,
        ]);

        if (!$this->has('is_anonymous')) {
            $this->merge(['is_anonymous' => false]);
        }

        if ($this->is_anonymous && !$this->has('anonymous_id')) {
            $this->merge(['anonymous_id' => AnonymousHelper::getSessionAnonymousId()]);
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
     */
    public function getValidatedWithAnalysis(): array
    {
        $validated = $this->validated();
        
        $contentAnalysis = ContentFilter::analyzeContent($validated['content']);
        
        $requiresModeration = $contentAnalysis['requires_moderation'];
        $autoReject = $contentAnalysis['auto_reject'];
        
        if ($autoReject) {
            $validated['status'] = 'rejected';
        } elseif ($requiresModeration) {
            $validated['status'] = 'pending';
        } else {
            $validated['status'] = 'approved';
        }
        
        $validated['content_analysis'] = $contentAnalysis;
        
        return $validated;
    }
}

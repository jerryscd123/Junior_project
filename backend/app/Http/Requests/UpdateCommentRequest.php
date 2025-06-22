<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Utils\ContentFilter;

class UpdateCommentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
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
        ];
    }

    public function messages(): array
    {
        return [
            'content.required' => 'Comment content is required.',
            'content.min' => 'Comment must be at least 3 characters long.',
            'content.max' => 'Comment cannot exceed 2,000 characters.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'content' => $this->content ? trim($this->content) : null,
        ]);
    }

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

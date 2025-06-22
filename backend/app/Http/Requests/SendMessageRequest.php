<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Utils\ContentFilter;

class SendMessageRequest extends FormRequest
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
            'subject' => [
                'required',
                'string',
                'min:5',
                'max:150',
                function ($attribute, $value, $fail) {
                    if (ContentFilter::containsBannedWords($value)) {
                        $fail('The subject contains inappropriate content.');
                    }
                },
            ],
            'content' => [
                'required',
                'string',
                'min:10',
                'max:5000',
                function ($attribute, $value, $fail) {
                    if (ContentFilter::shouldAutoReject($value)) {
                        $fail('The message contains inappropriate content.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'subject.required' => 'Subject is required.',
            'subject.min' => 'Subject must be at least 5 characters long.',
            'subject.max' => 'Subject cannot exceed 150 characters.',
            'content.required' => 'Message content is required.',
            'content.min' => 'Message must be at least 10 characters long.',
            'content.max' => 'Message cannot exceed 5,000 characters.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'subject' => $this->subject ? trim($this->subject) : null,
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

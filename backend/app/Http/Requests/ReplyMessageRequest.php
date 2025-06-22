<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Utils\ContentFilter;

class ReplyMessageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->role === 'admin';
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
                'min:10',
                'max:5000',
                function ($attribute, $value, $fail) {
                    if (ContentFilter::shouldAutoReject($value)) {
                        $fail('The reply contains inappropriate content.');
                    }
                },
            ],
            'message_id' => [
                'required',
                'integer',
                'exists:messages,id',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'content.required' => 'Reply content is required.',
            'content.min' => 'Reply must be at least 10 characters long.',
            'content.max' => 'Reply cannot exceed 5,000 characters.',
            'message_id.required' => 'Message ID is required.',
            'message_id.exists' => 'The specified message does not exist.',
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

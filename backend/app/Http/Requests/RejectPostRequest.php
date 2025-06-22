<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RejectPostRequest extends FormRequest
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
     */
    public function rules(): array
    {
        return [
            'admin_note' => [
                'required',
                'string',
                'min:10',
                'max:1000',
            ],
            'reason' => [
                'sometimes',
                'string',
                'in:inappropriate_content,spam,off_topic,violation,other',
            ],
        ];
    }

    /**
     * Get custom error messages for validation rules.
     */
    public function messages(): array
    {
        return [
            'admin_note.required' => 'A reason for rejection is required.',
            'admin_note.min' => 'Rejection reason must be at least 10 characters long.',
            'admin_note.max' => 'Rejection reason cannot exceed 1,000 characters.',
            'reason.in' => 'Invalid rejection reason category.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'admin_note' => $this->admin_note ? trim($this->admin_note) : null,
        ]);

        if (!$this->has('reason')) {
            $this->merge(['reason' => 'other']);
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

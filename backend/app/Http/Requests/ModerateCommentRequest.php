<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ModerateCommentRequest extends FormRequest
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
            'action' => [
                'required',
                'string',
                'in:approve,reject',
            ],
            'admin_note' => [
                'required_if:action,reject',
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'action.required' => 'Moderation action is required.',
            'action.in' => 'Action must be either approve or reject.',
            'admin_note.required_if' => 'Admin note is required when rejecting a comment.',
            'admin_note.max' => 'Admin note cannot exceed 1,000 characters.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('admin_note')) {
            $this->merge([
                'admin_note' => $this->admin_note ? trim($this->admin_note) : null,
            ]);
        }
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

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Login is open to everyone
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => [
                'required',
                'string',
                'max:150',
                // Accept either email format or username
                function ($attribute, $value, $fail) {
                    if (!filter_var($value, FILTER_VALIDATE_EMAIL) && !preg_match('/^[a-zA-Z0-9_\-\.]+$/', $value)) {
                        $fail('The email field must be a valid email address or username.');
                    }
                },
            ],
            'password' => [
                'required',
                'string',
                'min:1', // Allow any password length for login
                'max:255',
            ],
            'remember' => [
                'sometimes',
                'boolean',
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
            'email.required' => 'Email or username is required.',
            'email.max' => 'Email or username cannot exceed 150 characters.',
            'password.required' => 'Password is required.',
            'password.min' => 'Password is required.',
            'password.max' => 'Password cannot exceed 255 characters.',
            'remember.boolean' => 'Remember me must be true or false.',
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
            'email' => 'email or username',
            'password' => 'password',
            'remember' => 'remember me',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Trim whitespace and normalize email
        $this->merge([
            'email' => $this->email ? trim(strtolower($this->email)) : null,
            'password' => $this->password,
        ]);

        // Set default value for remember
        if (!$this->has('remember')) {
            $this->merge(['remember' => false]);
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

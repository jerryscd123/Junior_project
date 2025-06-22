<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Utils\ContentFilter;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Registration is open to everyone
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'min:2',
                'max:100',
                'regex:/^[a-zA-Z\s\-\'\.]+$/', // Only letters, spaces, hyphens, apostrophes, and dots
                function ($attribute, $value, $fail) {
                    if (ContentFilter::containsBannedWords($value)) {
                        $fail('The name contains inappropriate content.');
                    }
                },
            ],
            'email' => [
                'nullable',
                'string',
                'email:rfc',
                'max:150',
                'unique:users,email',
            ],
            'password' => [
                'required',
                'string',
                'min:8',
                'max:255',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/', // At least one lowercase, uppercase, digit, and special character
            ],
            'password_confirmation' => [
                'required',
                'same:password',
            ],
            'bio' => [
                'nullable',
                'string',
                'max:500',
                function ($attribute, $value, $fail) {
                    if ($value && ContentFilter::shouldAutoReject($value)) {
                        $fail('The bio contains inappropriate content.');
                    }
                },
            ],
            'avatar' => [
                'nullable',
                'image',
                'mimes:jpeg,jpg,png,gif,webp',
                'max:5120', // 5MB in kilobytes
                'dimensions:min_width=50,min_height=50,max_width=2000,max_height=2000',
            ],
            'is_anonymous' => [
                'sometimes',
                'boolean',
            ],
            'role' => [
                'sometimes',
                'string',
                'in:user,admin',
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
            'name.required' => 'A name is required.',
            'name.min' => 'Name must be at least 2 characters long.',
            'name.max' => 'Name cannot exceed 100 characters.',
            'name.regex' => 'Name can only contain letters, spaces, hyphens, apostrophes, and dots.',
            'email.email' => 'Please provide a valid email address.',
            'email.unique' => 'This email address is already registered.',
            'email.max' => 'Email cannot exceed 150 characters.',
            'password.required' => 'A password is required.',
            'password.min' => 'Password must be at least 8 characters long.',
            'password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.',
            'password_confirmation.required' => 'Password confirmation is required.',
            'password_confirmation.same' => 'Password confirmation does not match.',
            'bio.max' => 'Bio cannot exceed 500 characters.',
            'avatar.image' => 'Avatar must be an image file.',
            'avatar.mimes' => 'Avatar must be a JPEG, JPG, PNG, GIF, or WebP file.',
            'avatar.max' => 'Avatar file size cannot exceed 5MB.',
            'avatar.dimensions' => 'Avatar dimensions must be between 50x50 and 2000x2000 pixels.',
            'role.in' => 'Role must be either user or admin.',
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
            'name' => 'name',
            'email' => 'email address',
            'password' => 'password',
            'password_confirmation' => 'password confirmation',
            'bio' => 'bio',
            'avatar' => 'avatar',
            'is_anonymous' => 'anonymous status',
            'role' => 'role',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Trim whitespace from string fields
        $this->merge([
            'name' => $this->name ? trim($this->name) : null,
            'email' => $this->email ? trim(strtolower($this->email)) : null,
            'bio' => $this->bio ? trim($this->bio) : null,
        ]);

        // Set default values
        if (!$this->has('is_anonymous')) {
            $this->merge(['is_anonymous' => false]);
        }

        if (!$this->has('role')) {
            $this->merge(['role' => 'user']);
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

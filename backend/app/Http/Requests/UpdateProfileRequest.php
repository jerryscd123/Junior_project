<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Utils\ContentFilter;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check(); // Only authenticated users can update profile
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = auth()->id();

        return [
            'name' => [
                'sometimes',
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
                'sometimes',
                'nullable',
                'string',
                'email:rfc,dns',
                'max:150',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'bio' => [
                'sometimes',
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
                'sometimes',
                'nullable',
                'image',
                'mimes:jpeg,jpg,png,gif,webp',
                'max:5120', // 5MB in kilobytes
                'dimensions:min_width=50,min_height=50,max_width=2000,max_height=2000',
            ],
            'current_password' => [
                'required_with:password',
                'string',
                'current_password',
            ],
            'password' => [
                'sometimes',
                'nullable',
                'string',
                'min:8',
                'max:255',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/', // At least one lowercase, uppercase, digit, and special character
                'confirmed',
            ],
            'password_confirmation' => [
                'required_with:password',
                'same:password',
            ],
            'is_anonymous' => [
                'sometimes',
                'boolean',
            ],
            'remove_avatar' => [
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
            'name.required' => 'A name is required.',
            'name.min' => 'Name must be at least 2 characters long.',
            'name.max' => 'Name cannot exceed 100 characters.',
            'name.regex' => 'Name can only contain letters, spaces, hyphens, apostrophes, and dots.',
            'email.email' => 'Please provide a valid email address.',
            'email.unique' => 'This email address is already taken.',
            'email.max' => 'Email cannot exceed 150 characters.',
            'bio.max' => 'Bio cannot exceed 500 characters.',
            'avatar.image' => 'Avatar must be an image file.',
            'avatar.mimes' => 'Avatar must be a JPEG, JPG, PNG, GIF, or WebP file.',
            'avatar.max' => 'Avatar file size cannot exceed 5MB.',
            'avatar.dimensions' => 'Avatar dimensions must be between 50x50 and 2000x2000 pixels.',
            'current_password.required_with' => 'Current password is required when changing password.',
            'current_password.current_password' => 'The current password is incorrect.',
            'password.min' => 'New password must be at least 8 characters long.',
            'password.regex' => 'New password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.',
            'password.confirmed' => 'Password confirmation does not match.',
            'password_confirmation.required_with' => 'Password confirmation is required when changing password.',
            'password_confirmation.same' => 'Password confirmation does not match.',
            'remove_avatar.boolean' => 'Remove avatar must be true or false.',
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
            'bio' => 'bio',
            'avatar' => 'avatar',
            'current_password' => 'current password',
            'password' => 'new password',
            'password_confirmation' => 'password confirmation',
            'is_anonymous' => 'anonymous status',
            'remove_avatar' => 'remove avatar',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Trim whitespace from string fields
        $data = [];
        
        if ($this->has('name')) {
            $data['name'] = $this->name ? trim($this->name) : null;
        }
        
        if ($this->has('email')) {
            $data['email'] = $this->email ? trim(strtolower($this->email)) : null;
        }
        
        if ($this->has('bio')) {
            $data['bio'] = $this->bio ? trim($this->bio) : null;
        }

        if (!empty($data)) {
            $this->merge($data);
        }

        // Set default values
        if ($this->has('remove_avatar') && !is_bool($this->remove_avatar)) {
            $this->merge(['remove_avatar' => filter_var($this->remove_avatar, FILTER_VALIDATE_BOOLEAN)]);
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

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Utils\ContentFilter;

class CreateTagRequest extends FormRequest
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
            'name' => [
                'required',
                'string',
                'min:2',
                'max:50',
                'unique:tags,name',
                'regex:/^[a-zA-Z0-9\s\-_]+$/',
                function ($attribute, $value, $fail) {
                    if (ContentFilter::containsBannedWords($value)) {
                        $fail('The tag name contains inappropriate content.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Tag name is required.',
            'name.min' => 'Tag name must be at least 2 characters long.',
            'name.max' => 'Tag name cannot exceed 50 characters.',
            'name.unique' => 'This tag already exists.',
            'name.regex' => 'Tag name can only contain letters, numbers, spaces, hyphens, and underscores.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => $this->name ? trim(strtolower($this->name)) : null,
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

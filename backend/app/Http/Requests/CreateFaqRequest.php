<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Utils\ContentFilter;

class CreateFaqRequest extends FormRequest
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
            'question' => [
                'required',
                'string',
                'min:10',
                'max:500',
                function ($attribute, $value, $fail) {
                    if (ContentFilter::containsBannedWords($value)) {
                        $fail('The question contains inappropriate content.');
                    }
                },
            ],
            'answer' => [
                'required',
                'string',
                'min:20',
                'max:5000',
                function ($attribute, $value, $fail) {
                    if (ContentFilter::containsBannedWords($value)) {
                        $fail('The answer contains inappropriate content.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'question.required' => 'Question is required.',
            'question.min' => 'Question must be at least 10 characters long.',
            'question.max' => 'Question cannot exceed 500 characters.',
            'answer.required' => 'Answer is required.',
            'answer.min' => 'Answer must be at least 20 characters long.',
            'answer.max' => 'Answer cannot exceed 5,000 characters.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'question' => $this->question ? trim($this->question) : null,
            'answer' => $this->answer ? trim($this->answer) : null,
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

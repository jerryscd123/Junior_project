<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\User;
use App\Utils\ResponseHelper;
use App\Utils\ImageUploader;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user
     *
     * @param RegisterRequest $request
     * @return JsonResponse
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $validatedData = $request->validated();
            
            // Handle avatar upload if provided
            if ($request->hasFile('avatar')) {
                $avatarResult = ImageUploader::uploadAvatar($request->file('avatar'));
                if ($avatarResult && $avatarResult['success']) {
                    // Store the path to the original image in the database
                    $validatedData['avatar'] = $avatarResult['path'] . '/original_' . $avatarResult['filename'];
                } else {
                    throw new \Exception($avatarResult['error'] ?? 'Avatar upload failed');
                }
            }

            // Hash the password
            $validatedData['password'] = Hash::make($validatedData['password']);

            // Create the user
            $user = User::create($validatedData);

            // Create API token
            $token = $user->createToken('auth_token')->plainTextToken;

            // Prepare user data for response
            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->getAvatarUrl(),
                'bio' => $user->bio,
                'is_anonymous' => $user->is_anonymous,
                'role' => $user->role,
                'created_at' => $user->created_at,
            ];

            return ResponseHelper::authSuccess($userData, $token, 'User registered successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Registration failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Login user
     *
     * @param LoginRequest $request
     * @return JsonResponse
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $credentials = $request->validated();
            
            // Attempt to find user by email
            $user = User::where('email', $credentials['email'])->first();

            // Check if user exists and password is correct
            if (!$user || !Hash::check($credentials['password'], $user->password)) {
                throw ValidationException::withMessages([
                    'email' => ['The provided credentials are incorrect.'],
                ]);
            }

            // Create API token
            $token = $user->createToken('auth_token')->plainTextToken;

            // Prepare user data for response
            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->getAvatarUrl(),
                'bio' => $user->bio,
                'is_anonymous' => $user->is_anonymous,
                'role' => $user->role,
                'created_at' => $user->created_at,
            ];

            return ResponseHelper::authSuccess($userData, $token, 'Login successful');

        } catch (ValidationException $e) {
            return ResponseHelper::validationError($e->errors(), 'Login failed');
        } catch (\Exception $e) {
            return ResponseHelper::error('Login failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Logout user
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            // Delete current access token
            $request->user()->currentAccessToken()->delete();

            return ResponseHelper::logoutSuccess('Logged out successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Logout failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get user profile
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function profile(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->getAvatarUrl(),
                'bio' => $user->bio,
                'is_anonymous' => $user->is_anonymous,
                'role' => $user->role,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'posts_count' => $user->posts()->count(),
                'comments_count' => $user->comments()->count(),
                'likes_count' => $user->likes()->count(),
            ];

            return ResponseHelper::success($userData, 'Profile retrieved successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve profile: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update user profile
     *
     * @param UpdateProfileRequest $request
     * @return JsonResponse
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        try {
            $user = $request->user();
            $validatedData = $request->validated();

            // Handle avatar upload
            if ($request->hasFile('avatar')) {
                // Delete old avatar if exists
                if ($user->avatar) {
                    Storage::disk('public')->delete($user->avatar);
                }
                
                $avatarResult = ImageUploader::uploadAvatar($request->file('avatar'));
                if ($avatarResult && $avatarResult['success']) {
                    // Store the path to the original image in the database
                    $validatedData['avatar'] = $avatarResult['path'] . '/original_' . $avatarResult['filename'];
                } else {
                    throw new \Exception($avatarResult['error'] ?? 'Avatar upload failed');
                }
            }

            // Handle avatar removal
            if ($request->has('remove_avatar') && $request->remove_avatar) {
                if ($user->avatar) {
                    Storage::disk('public')->delete($user->avatar);
                }
                $validatedData['avatar'] = null;
            }

            // Handle password update
            if ($request->has('password') && $request->password) {
                $validatedData['password'] = Hash::make($validatedData['password']);
            } else {
                // Remove password fields if not updating password
                unset($validatedData['password'], $validatedData['current_password'], $validatedData['password_confirmation']);
            }

            // Remove fields that shouldn't be updated directly
            unset($validatedData['remove_avatar']);

            // Update user
            $user->update($validatedData);

            // Refresh user data
            $user->refresh();

            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->getAvatarUrl(),
                'bio' => $user->bio,
                'is_anonymous' => $user->is_anonymous,
                'role' => $user->role,
                'updated_at' => $user->updated_at,
            ];

            return ResponseHelper::updated($userData, 'Profile updated successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to update profile: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get user settings
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function settings(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            $settings = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_anonymous' => $user->is_anonymous,
                'role' => $user->role,
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                // Add any additional settings here
                'preferences' => [
                    'notifications_enabled' => true, // This could be stored in a separate settings table
                    'email_notifications' => true,
                    'privacy_mode' => $user->is_anonymous,
                ],
            ];

            return ResponseHelper::success($settings, 'Settings retrieved successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve settings: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update user settings
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function updateSettings(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // Validate the request
            $validatedData = $request->validate([
                'is_anonymous' => 'sometimes|boolean',
                'preferences' => 'sometimes|array',
                'preferences.notifications_enabled' => 'sometimes|boolean',
                'preferences.email_notifications' => 'sometimes|boolean',
                'preferences.privacy_mode' => 'sometimes|boolean',
            ]);

            // Update basic settings
            if (isset($validatedData['is_anonymous'])) {
                $user->is_anonymous = $validatedData['is_anonymous'];
            }

            // Handle preferences (in a real app, you might store these in a separate settings table)
            if (isset($validatedData['preferences'])) {
                // For now, we'll just sync privacy_mode with is_anonymous
                if (isset($validatedData['preferences']['privacy_mode'])) {
                    $user->is_anonymous = $validatedData['preferences']['privacy_mode'];
                }
            }

            $user->save();

            $settings = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_anonymous' => $user->is_anonymous,
                'role' => $user->role,
                'updated_at' => $user->updated_at,
                'preferences' => [
                    'notifications_enabled' => $validatedData['preferences']['notifications_enabled'] ?? true,
                    'email_notifications' => $validatedData['preferences']['email_notifications'] ?? true,
                    'privacy_mode' => $user->is_anonymous,
                ],
            ];

            return ResponseHelper::updated($settings, 'Settings updated successfully');

        } catch (\Illuminate\Validation\ValidationException $e) {
            return ResponseHelper::validationError($e->errors(), 'Validation failed');
        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to update settings: ' . $e->getMessage(), 500);
        }
    }
}

<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Utils\ResponseHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a listing of users with statistics.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = User::withStatistics()
                ->withCount(['posts', 'comments', 'likes']);

            // Apply filters
            if ($request->has('role')) {
                $query->where('role', $request->role);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($request->has('created_from')) {
                $query->where('created_at', '>=', $request->created_from);
            }

            if ($request->has('created_to')) {
                $query->where('created_at', '<=', $request->created_to);
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            
            if (in_array($sortBy, ['name', 'email', 'created_at', 'posts_count', 'comments_count', 'likes_count'])) {
                $query->orderBy($sortBy, $sortOrder);
            } else {
                $query->latest();
            }

            // Pagination
            $perPage = min($request->get('per_page', 15), 100);
            $users = $query->paginate($perPage);

            // Transform the data
            $users->getCollection()->transform(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->is_anonymous ? "Anonymous #{$user->id}" : $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'avatar' => $user->avatar ? asset('storage/' . $user->avatar) : null,
                    'bio' => $user->bio,
                    'is_anonymous' => $user->is_anonymous,
                    'created_at' => $user->created_at,
                    'statistics' => [
                        'total_posts' => $user->posts_count,
                        'total_comments' => $user->comments_count,
                        'total_likes_given' => $user->likes_count,
                        'total_likes_received' => $user->total_likes_received,
                    ]
                ];
            });

            return ResponseHelper::success($users, 'Users retrieved successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve users', 500, $e->getMessage());
        }
    }

    /**
     * Display the specified user with detailed statistics.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        try {
            $user = User::withStatistics()
                ->withCount(['posts', 'comments', 'likes'])
                ->findOrFail($id);

            $userData = [
                'id' => $user->id,
                'name' => $user->is_anonymous ? "Anonymous #{$user->id}" : $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar ? asset('storage/' . $user->avatar) : null,
                'bio' => $user->bio,
                'is_anonymous' => $user->is_anonymous,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'statistics' => [
                    'total_posts' => $user->posts_count,
                    'total_comments' => $user->comments_count,
                    'total_likes_given' => $user->likes_count,
                    'total_likes_received' => $user->total_likes_received,
                ],
                'recent_posts' => $user->posts()
                    ->latest()
                    ->limit(5)
                    ->get(['id', 'title', 'status', 'created_at']),
                'recent_comments' => $user->comments()
                    ->with('post:id,title')
                    ->latest()
                    ->limit(5)
                    ->get(['id', 'content', 'post_id', 'status', 'created_at'])
            ];

            return ResponseHelper::success($userData, 'User details retrieved successfully');

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return ResponseHelper::error('User not found', 404, ['id' => 'The specified user does not exist']);
        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve user details', 500, [
                'error' => $e->getMessage(),
                'user_id' => $id
            ]);
        }
    }

    /**
     * Store a newly created user.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:100',
                'email' => 'required|string|email|max:150|unique:users',
                'password' => 'required|string|min:8',
                'role' => ['required', Rule::in(['user', 'admin', 'moderator'])],
                'bio' => 'nullable|string|max:500',
                'is_anonymous' => 'boolean'
            ]);

            $validated['password'] = Hash::make($validated['password']);

            $user = User::create($validated);

            return ResponseHelper::success([
                'id' => $user->id,
                'name' => $user->is_anonymous ? "Anonymous #{$user->id}" : $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'created_at' => $user->created_at
            ], 'User created successfully', 201);

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to create user', 500, $e->getMessage());
        }
    }

    /**
     * Update the specified user.
     *
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:100',
                'email' => ['sometimes', 'required', 'string', 'email', 'max:150', Rule::unique('users')->ignore($user->id)],
                'password' => 'sometimes|required|string|min:8',
                'role' => ['sometimes', 'required', Rule::in(['user', 'admin', 'moderator'])],
                'bio' => 'nullable|string|max:500',
                'is_anonymous' => 'boolean'
            ]);

            if (isset($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            }

            $user->update($validated);

            return ResponseHelper::success([
                'id' => $user->id,
                'name' => $user->is_anonymous ? "Anonymous #{$user->id}" : $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'updated_at' => $user->updated_at
            ], 'User updated successfully');

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return ResponseHelper::error('User not found', 404, ['id' => 'The specified user does not exist']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return ResponseHelper::validationError($e->errors(), 'Validation failed');
        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to update user', 500, [
                'error' => $e->getMessage(),
                'user_id' => $id
            ]);
        }
    }

    /**
     * Remove the specified user.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            // Prevent deletion of the last admin user
            if ($user->isAdmin() && User::admins()->count() <= 1) {
                return ResponseHelper::error('Cannot delete the last admin user', 400);
            }

            // Store user info for logging before deletion
            $userInfo = [
                'id' => $user->id,
                'name' => $user->is_anonymous ? "Anonymous #{$user->id}" : $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ];

            $user->delete();

            return ResponseHelper::success($userInfo, 'User deleted successfully');

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return ResponseHelper::error('User not found', 404, ['id' => 'The specified user does not exist']);
        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to delete user', 500, [
                'error' => $e->getMessage(),
                'user_id' => $id
            ]);
        }
    }

    /**
     * Get detailed statistics for a specific user.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function statistics(string $id): JsonResponse
    {
        try {
            $user = User::withStatistics()
                ->withCount(['posts', 'comments', 'likes'])
                ->findOrFail($id);

            $statistics = [
                'user_id' => $user->id,
                'user_name' => $user->is_anonymous ? "Anonymous #{$user->id}" : $user->name,
                'total_posts' => $user->posts_count,
                'total_comments' => $user->comments_count,
                'total_likes_given' => $user->likes_count,
                'total_likes_received' => $user->total_likes_received,
                'posts_by_status' => [
                    'pending' => $user->posts()->pending()->count(),
                    'approved' => $user->posts()->approved()->count(),
                    'rejected' => $user->posts()->rejected()->count(),
                ],
                'engagement_rate' => $user->posts_count > 0 
                    ? round(($user->total_likes_received + $user->comments_count) / $user->posts_count, 2) 
                    : 0,
                'account_age_days' => $user->created_at->diffInDays(now()),
                'average_posts_per_month' => $user->created_at->diffInMonths(now()) > 0 
                    ? round($user->posts_count / $user->created_at->diffInMonths(now()), 2) 
                    : $user->posts_count
            ];

            return ResponseHelper::success($statistics, 'User statistics retrieved successfully');

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return ResponseHelper::error('User not found', 404, ['id' => 'The specified user does not exist']);
        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve user statistics', 500, [
                'error' => $e->getMessage(),
                'user_id' => $id
            ]);
        }
    }

    /**
     * Perform bulk actions on users.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function bulkAction(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'action' => 'required|in:delete,change_role',
                'user_ids' => 'required|array',
                'user_ids.*' => 'exists:users,id',
                'role' => 'required_if:action,change_role|in:user,admin,moderator'
            ]);

            $users = User::whereIn('id', $validated['user_ids'])->get();

            if ($validated['action'] === 'delete') {
                // Check if trying to delete all admin users
                $adminCount = User::admins()->count();
                $deletingAdminCount = $users->where('role', 'admin')->count();
                
                if ($adminCount - $deletingAdminCount < 1) {
                    return ResponseHelper::error('Cannot delete all admin users', 400);
                }

                User::whereIn('id', $validated['user_ids'])->delete();
                $message = 'Users deleted successfully';
            } else {
                User::whereIn('id', $validated['user_ids'])->update(['role' => $validated['role']]);
                $message = "User roles updated to {$validated['role']} successfully";
            }

            return ResponseHelper::success([
                'affected_count' => count($validated['user_ids']),
                'action' => $validated['action']
            ], $message);

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to perform bulk action', 500, $e->getMessage());
        }
    }
} 
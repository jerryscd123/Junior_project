<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateTagRequest;
use App\Models\Tag;
use App\Utils\ResponseHelper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TagController extends Controller
{
    /**
     * Display a listing of tags.
     * Public endpoint - no authentication required
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 20);
            $search = $request->get('search');
            $orderBy = $request->get('order_by', 'post_count'); // name, post_count, created_at
            $orderDirection = $request->get('order_direction', 'desc');
            $showUnused = $request->get('show_unused', false);

            // Validate per_page
            if ($perPage > 100) {
                $perPage = 100;
            }

            $query = Tag::query();

            // Apply search filter
            if ($search) {
                $query->search($search);
            }

            // Filter out unused tags unless specifically requested
            if (!$showUnused) {
                $query->withCount('approvedPosts')
                    ->having('approved_posts_count', '>', 0);
            } else {
                $query->withCount('approvedPosts');
            }

            // Apply ordering
            switch ($orderBy) {
                case 'name':
                    $query->orderByName($orderDirection);
                    break;
                case 'post_count':
                    $query->orderBy('approved_posts_count', $orderDirection);
                    break;
                case 'created_at':
                    $query->orderBy('created_at', $orderDirection);
                    break;
                default:
                    $query->orderBy('approved_posts_count', 'desc');
            }

            $tags = $query->paginate($perPage);

            return ResponseHelper::success([
                'tags' => $tags->items(),
                'pagination' => [
                    'current_page' => $tags->currentPage(),
                    'last_page' => $tags->lastPage(),
                    'per_page' => $tags->perPage(),
                    'total' => $tags->total(),
                    'from' => $tags->firstItem(),
                    'to' => $tags->lastItem(),
                ]
            ], 'Tags retrieved successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error(
                'Failed to retrieve tags',
                500,
                ['error' => $e->getMessage()]
            );
        }
    }

    /**
     * Store a newly created tag in storage.
     * Admin only endpoint
     */
    public function store(CreateTagRequest $request): JsonResponse
    {
        try {
            $validatedData = $request->validated();

            // Check if tag already exists (case-insensitive)
            $existingTag = Tag::where('name', Tag::normalizeName($validatedData['name']))->first();
            
            if ($existingTag) {
                return ResponseHelper::error(
                    'Tag already exists',
                    409,
                    ['tag' => $existingTag]
                );
            }

            // Create the tag
            $tag = Tag::create([
                'name' => $validatedData['name']
            ]);

            // Load post count for response
            $tag->loadCount('approvedPosts');

            return ResponseHelper::success(
                ['tag' => $tag],
                'Tag created successfully',
                201
            );

        } catch (\Exception $e) {
            return ResponseHelper::error(
                'Failed to create tag',
                500,
                ['error' => $e->getMessage()]
            );
        }
    }

    /**
     * Display the specified tag with its posts.
     */
    public function show(Request $request, Tag $tag): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 10);
            $page = $request->get('page', 1);

            // Validate per_page
            if ($perPage > 50) {
                $perPage = 50;
            }

            // Load tag with approved posts count
            $tag->loadCount('approvedPosts');

            // Get approved posts for this tag with pagination
            $posts = $tag->approvedPosts()
                ->with(['user:id,name,avatar', 'tags:id,name'])
                ->withCount(['likes', 'comments' => function ($query) {
                    $query->where('status', 'approved');
                }])
                ->orderBy('created_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            return ResponseHelper::success([
                'tag' => $tag,
                'posts' => $posts->items(),
                'pagination' => [
                    'current_page' => $posts->currentPage(),
                    'last_page' => $posts->lastPage(),
                    'per_page' => $posts->perPage(),
                    'total' => $posts->total(),
                    'from' => $posts->firstItem(),
                    'to' => $posts->lastItem(),
                ]
            ], 'Tag details retrieved successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error(
                'Failed to retrieve tag details',
                500,
                ['error' => $e->getMessage()]
            );
        }
    }

    /**
     * Update the specified tag in storage.
     * Admin only endpoint
     */
    public function update(Request $request, Tag $tag): JsonResponse
    {
        try {
            // Check if user is admin
            if (!auth()->check() || auth()->user()->role !== 'admin') {
                return ResponseHelper::error('Unauthorized', 403);
            }

            $request->validate([
                'name' => [
                    'required',
                    'string',
                    'min:2',
                    'max:50',
                    'unique:tags,name,' . $tag->id,
                    'regex:/^[a-zA-Z0-9\s\-_]+$/',
                ],
            ]);

            $normalizedName = Tag::normalizeName($request->name);

            // Check if another tag with this name exists
            $existingTag = Tag::where('name', $normalizedName)
                ->where('id', '!=', $tag->id)
                ->first();

            if ($existingTag) {
                return ResponseHelper::error(
                    'A tag with this name already exists',
                    409
                );
            }

            $tag->update(['name' => $normalizedName]);
            $tag->loadCount('approvedPosts');

            return ResponseHelper::success(
                ['tag' => $tag],
                'Tag updated successfully'
            );

        } catch (\Illuminate\Validation\ValidationException $e) {
            return ResponseHelper::error(
                'Validation failed',
                422,
                ['errors' => $e->errors()]
            );
        } catch (\Exception $e) {
            return ResponseHelper::error(
                'Failed to update tag',
                500,
                ['error' => $e->getMessage()]
            );
        }
    }

    /**
     * Remove the specified tag from storage.
     * Admin only endpoint
     */
    public function destroy(Tag $tag): JsonResponse
    {
        try {
            // Check if user is admin
            if (!auth()->check() || auth()->user()->role !== 'admin') {
                return ResponseHelper::error('Unauthorized', 403);
            }

            // Check if tag has any posts
            $postCount = $tag->posts()->count();
            
            if ($postCount > 0) {
                return ResponseHelper::error(
                    'Cannot delete tag that is associated with posts',
                    409,
                    ['post_count' => $postCount]
                );
            }

            $tagName = $tag->name;
            $tag->delete();

            return ResponseHelper::success(
                ['deleted_tag' => $tagName],
                'Tag deleted successfully'
            );

        } catch (\Exception $e) {
            return ResponseHelper::error(
                'Failed to delete tag',
                500,
                ['error' => $e->getMessage()]
            );
        }
    }

    /**
     * Get popular tags.
     * Public endpoint
     */
    public function popular(Request $request): JsonResponse
    {
        try {
            $limit = $request->get('limit', 10);
            
            // Validate limit
            if ($limit > 50) {
                $limit = 50;
            }

            $tags = Tag::popular($limit)->get();

            return ResponseHelper::success(
                ['tags' => $tags],
                'Popular tags retrieved successfully'
            );

        } catch (\Exception $e) {
            return ResponseHelper::error(
                'Failed to retrieve popular tags',
                500,
                ['error' => $e->getMessage()]
            );
        }
    }

    /**
     * Clean up unused tags.
     * Admin only endpoint
     */
    public function cleanup(): JsonResponse
    {
        try {
            // Check if user is admin
            if (!auth()->check() || auth()->user()->role !== 'admin') {
                return ResponseHelper::error('Unauthorized', 403);
            }

            $deletedCount = Tag::cleanupUnused();

            return ResponseHelper::success(
                ['deleted_count' => $deletedCount],
                "Successfully cleaned up {$deletedCount} unused tags"
            );

        } catch (\Exception $e) {
            return ResponseHelper::error(
                'Failed to cleanup unused tags',
                500,
                ['error' => $e->getMessage()]
            );
        }
    }
}

<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\LikeController;
use App\Http\Controllers\Api\TagController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\FaqController;
use App\Http\Controllers\Api\Admin\PostController as AdminPostController;
use App\Http\Controllers\Api\Admin\CommentController as AdminCommentController;
use App\Http\Controllers\Api\Admin\MessageController as AdminMessageController;
use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

// Authentication Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public Post Routes
Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/{id}', [PostController::class, 'show']);
Route::get('/posts/{id}/comments', [CommentController::class, 'index']);
Route::post('/posts/{id}/comments', [CommentController::class, 'store']);
Route::get('/posts/{id}/likes', [LikeController::class, 'getLikes']);

// Public Tag Routes
Route::get('/tags', [TagController::class, 'index']);

// Public FAQ Routes
Route::get('/faqs', [FaqController::class, 'index']);
Route::get('/faqs/search', [FaqController::class, 'search']);
Route::get('/faqs/{id}', [FaqController::class, 'show']);

// ============================================================================
// AUTHENTICATED ROUTES (Require authentication)
// ============================================================================

Route::middleware('auth:sanctum')->group(function () {
    
    // Authentication & User Management
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user/profile', [AuthController::class, 'profile']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::get('/user/settings', [AuthController::class, 'settings']);
    Route::put('/user/settings', [AuthController::class, 'updateSettings']);
    
    // Legacy user route for compatibility
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    // Post Management (User's own posts)
    Route::post('/posts', [PostController::class, 'store']);
    Route::put('/posts/{id}', [PostController::class, 'update']);
    Route::delete('/posts/{id}', [PostController::class, 'destroy']);
    
    // User Post Endpoints
    Route::get('/user/posts', [PostController::class, 'getUserPosts']);
    Route::get('/user/posts/all', [PostController::class, 'getAllUserPosts']);
    
    // Comment Management (User's own comments)
    Route::put('/comments/{id}', [CommentController::class, 'update']);
    Route::delete('/comments/{id}', [CommentController::class, 'destroy']);
    
    // Like/Unlike Posts
    Route::post('/posts/{id}/like', [LikeController::class, 'like']);
    Route::match(['post', 'delete'], '/posts/{id}/unlike', [LikeController::class, 'unlike']);
    Route::post('/posts/{id}/toggle-like', [LikeController::class, 'toggle']);
    
    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read', [NotificationController::class, 'markAsRead']);
    
    // Messages (User to Admin)
    Route::get('/messages', [MessageController::class, 'index']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::get('/messages/stats', [MessageController::class, 'getStats']);
    Route::get('/messages/{id}', [MessageController::class, 'show']);
    Route::patch('/messages/{id}/read', [MessageController::class, 'markAsRead']);
});

// ============================================================================
// ADMIN ROUTES (Require authentication + admin role)
// ============================================================================

Route::middleware(['auth:sanctum', 'auth.admin'])->group(function () {
    
    // ===== DASHBOARD & ANALYTICS =====
    Route::get('/admin/dashboard/overview', [AdminDashboardController::class, 'overview']);
    Route::get('/admin/dashboard/weekly-stats', [AdminDashboardController::class, 'weeklyStats']);
    Route::get('/admin/dashboard/engagement-stats', [AdminDashboardController::class, 'engagementStats']);

    // ===== USER MANAGEMENT =====
    Route::get('/admin/users', [AdminUserController::class, 'index']);
    Route::get('/admin/users/{id}', [AdminUserController::class, 'show']);
    Route::post('/admin/users', [AdminUserController::class, 'store']);
    Route::put('/admin/users/{id}', [AdminUserController::class, 'update']);
    Route::delete('/admin/users/{id}', [AdminUserController::class, 'destroy']);
    Route::get('/admin/users/{id}/statistics', [AdminUserController::class, 'statistics']);
    Route::post('/admin/users/bulk-action', [AdminUserController::class, 'bulkAction']);

    // ===== POST MANAGEMENT =====
    Route::get('/admin/posts', [AdminPostController::class, 'index']);
    Route::get('/admin/posts/pending', [AdminPostController::class, 'pending']);
    Route::get('/admin/posts/approved', [AdminPostController::class, 'approved']);
    Route::get('/admin/posts/rejected', [AdminPostController::class, 'rejected']);
    Route::put('/admin/posts/{id}/approve', [AdminPostController::class, 'approve']);
    Route::put('/admin/posts/{id}/reject', [AdminPostController::class, 'reject']);
    Route::get('/admin/posts/statistics', [AdminPostController::class, 'statistics']);

    // ===== COMMENT MANAGEMENT =====
    Route::get('/admin/comments', [AdminCommentController::class, 'index']);
    Route::get('/admin/comments/pending', [AdminCommentController::class, 'pending']);
    Route::put('/admin/comments/{id}/approve', [AdminCommentController::class, 'approve']);
    Route::put('/admin/comments/{id}/reject', [AdminCommentController::class, 'reject']);

    // ===== MESSAGE MANAGEMENT =====
    Route::get('/admin/messages', [AdminMessageController::class, 'index']);
    Route::get('/admin/messages/statistics', [AdminMessageController::class, 'statistics']);
    Route::get('/admin/messages/stats', [AdminMessageController::class, 'getStats']);
    Route::get('/admin/messages/unread', [AdminMessageController::class, 'unread']);
    Route::get('/admin/messages/read', [AdminMessageController::class, 'read']);
    Route::get('/admin/messages/responded', [AdminMessageController::class, 'responded']);
    Route::get('/admin/messages/{id}', [AdminMessageController::class, 'show']);
    Route::post('/admin/messages/{id}/reply', [AdminMessageController::class, 'reply']);
    Route::put('/admin/messages/{id}/status', [AdminMessageController::class, 'updateStatus']);
    Route::patch('/admin/messages/{id}/read', [AdminMessageController::class, 'markAsRead']);

    // ===== TAG & CONTENT MANAGEMENT =====
    Route::post('/tags', [TagController::class, 'store']);
    Route::delete('/tags/{id}', [TagController::class, 'destroy']);
    
    // ===== FAQ MANAGEMENT =====
    Route::post('/faqs', [FaqController::class, 'store']);
    Route::get('/faqs/stats', [FaqController::class, 'stats']);
    Route::put('/faqs/{id}', [FaqController::class, 'update']);
    Route::delete('/faqs/{id}', [FaqController::class, 'destroy']);
});

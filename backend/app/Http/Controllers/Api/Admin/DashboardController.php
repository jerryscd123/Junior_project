<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Post;
use App\Models\Comment;
use App\Models\Like;
use App\Models\Message;
use App\Utils\ResponseHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Get dashboard overview statistics.
     *
     * @return JsonResponse
     */
    public function overview(): JsonResponse
    {
        try {
            $userStats = User::getUserStatistics();
            $postStats = Post::getStatusStatistics();
            $messageStats = Message::getMessageStatistics();
            
            // Calculate total engagement (likes + comments)
            $totalLikes = Like::count();
            $totalComments = Comment::count();
            $totalShares = 0; // Placeholder for future shares feature
            
            $overview = [
                'total_users' => $userStats['total_users'],
                'new_users_last_week' => $userStats['new_users_last_week'],
                'total_confessions' => $postStats['total'],
                'total_engagement' => [
                    'likes' => $totalLikes,
                    'comments' => $totalComments,
                    'shares' => $totalShares,
                    'total' => $totalLikes + $totalComments + $totalShares
                ],
                'posts_by_status' => [
                    'pending' => $postStats['pending'],
                    'approved' => $postStats['approved'],
                    'rejected' => $postStats['rejected']
                ],
                'messages_by_status' => [
                    'unread' => $messageStats['unread'],
                    'read' => $messageStats['read'],
                    'responded' => $messageStats['responded'],
                    'total' => $messageStats['total']
                ]
            ];

            return ResponseHelper::success($overview, 'Dashboard overview retrieved successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve dashboard overview', 500, $e->getMessage());
        }
    }

    /**
     * Get weekly statistics for graphs.
     *
     * @return JsonResponse
     */
    public function weeklyStats(): JsonResponse
    {
        try {
            $weeklyPosts = Post::getWeeklyStatistics();
            $weeklyUsers = User::getWeeklyRegistrationStatistics();
            
            // Calculate weekly engagement (likes + comments)
            $weeklyEngagement = [];
            for ($i = 7; $i >= 0; $i--) {
                $startOfWeek = Carbon::now()->subWeeks($i)->startOfWeek();
                $endOfWeek = Carbon::now()->subWeeks($i)->endOfWeek();
                
                $likesCount = Like::whereBetween('created_at', [$startOfWeek, $endOfWeek])->count();
                $commentsCount = Comment::whereBetween('created_at', [$startOfWeek, $endOfWeek])->count();
                
                $weeklyEngagement[] = [
                    'week' => $startOfWeek->format('Y-m-d'),
                    'likes' => $likesCount,
                    'comments' => $commentsCount,
                    'total' => $likesCount + $commentsCount
                ];
            }

            $weeklyStats = [
                'weekly_confessions' => $weeklyPosts,
                'weekly_new_users' => $weeklyUsers,
                'weekly_engagement' => $weeklyEngagement
            ];

            return ResponseHelper::success($weeklyStats, 'Weekly statistics retrieved successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve weekly statistics', 500, $e->getMessage());
        }
    }

    /**
     * Get detailed engagement metrics.
     *
     * @return JsonResponse
     */
    public function engagementStats(): JsonResponse
    {
        try {
            $totalPosts = Post::count();
            $totalLikes = Like::count();
            $totalComments = Comment::count();
            
            // Calculate engagement rates
            $avgLikesPerPost = $totalPosts > 0 ? round($totalLikes / $totalPosts, 2) : 0;
            $avgCommentsPerPost = $totalPosts > 0 ? round($totalComments / $totalPosts, 2) : 0;
            
            // Get top engaged posts
            $topPosts = Post::approved()
                ->withEngagementCounts()
                ->orderByDesc('like_count')
                ->orderByDesc('comment_count')
                ->limit(5)
                ->get()
                ->map(function ($post) {
                    return [
                        'id' => $post->id,
                        'title' => $post->title,
                        'like_count' => $post->like_count,
                        'comment_count' => $post->comment_count,
                        'total_engagement' => $post->like_count + $post->comment_count,
                        'created_at' => $post->created_at
                    ];
                });

            // Get most active users
            $activeUsers = User::withStatistics()
                ->withCount(['posts', 'comments', 'likes'])
                ->orderByDesc('posts_count')
                ->orderByDesc('comments_count')
                ->limit(5)
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'posts_count' => $user->posts_count,
                        'comments_count' => $user->comments_count,
                        'likes_count' => $user->likes_count,
                        'total_activity' => $user->posts_count + $user->comments_count + $user->likes_count
                    ];
                });

            $engagementStats = [
                'total_posts' => $totalPosts,
                'total_likes' => $totalLikes,
                'total_comments' => $totalComments,
                'avg_likes_per_post' => $avgLikesPerPost,
                'avg_comments_per_post' => $avgCommentsPerPost,
                'top_engaged_posts' => $topPosts,
                'most_active_users' => $activeUsers
            ];

            return ResponseHelper::success($engagementStats, 'Engagement statistics retrieved successfully');

        } catch (\Exception $e) {
            return ResponseHelper::error('Failed to retrieve engagement statistics', 500, $e->getMessage());
        }
    }
} 
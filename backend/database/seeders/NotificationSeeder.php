<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Notification;
use App\Models\User;
use App\Models\Post;

class NotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::where('role', 'user')->get();
        $posts = Post::where('status', 'approved')->get();

        // Like notifications
        $anxietyPost = $posts->where('title', 'My Journey with Anxiety: Finding Light in Dark Moments')->first();
        if ($anxietyPost) {
            Notification::create([
                'user_id' => $users->where('email', 'alice@example.com')->first()->id,
                'type' => 'like',
                'data' => [
                    'post_id' => $anxietyPost->id,
                    'post_title' => $anxietyPost->title,
                ],
                'is_read' => false,
            ]);

            Notification::create([
                'user_id' => $users->where('email', 'alice@example.com')->first()->id,
                'type' => 'like',
                'data' => [
                    'post_id' => $anxietyPost->id,
                    'post_title' => $anxietyPost->title,
                ],
                'is_read' => true,
            ]);
        }

        // Comment notifications
        $depressionPost = $posts->where('title', 'Professional Perspective: Understanding Depression')->first();
        if ($depressionPost) {
            Notification::create([
                'user_id' => $users->where('email', 'david@example.com')->first()->id,
                'type' => 'comment',
                'data' => [
                    'post_id' => $depressionPost->id,
                    'post_title' => $depressionPost->title,
                    'comment_id' => 1,
                ],
                'is_read' => false,
            ]);
        }

        // Post approved notifications
        Notification::create([
            'user_id' => $users->where('email', 'alice@example.com')->first()->id,
            'type' => 'post_approved',
            'data' => [
                'post_id' => $anxietyPost->id,
                'post_title' => $anxietyPost->title,
            ],
            'is_read' => true,
        ]);

        Notification::create([
            'user_id' => $users->where('email', 'david@example.com')->first()->id,
            'type' => 'post_approved',
            'data' => [
                'post_id' => $depressionPost->id,
                'post_title' => $depressionPost->title,
            ],
            'is_read' => true,
        ]);

        // Post rejected notification
        Notification::create([
            'user_id' => $users->where('email', 'anon1@example.com')->first()->id,
            'type' => 'post_rejected',
            'data' => [
                'post_id' => 999, // Fake ID for rejected post
                'post_title' => 'Inappropriate Content Example',
                'reason' => 'Post rejected due to inappropriate content that violates community guidelines.',
            ],
            'is_read' => false,
        ]);

        // Comment approved notifications
        Notification::create([
            'user_id' => $users->where('email', 'david@example.com')->first()->id,
            'type' => 'comment_approved',
            'data' => [
                'post_id' => $anxietyPost->id,
                'post_title' => $anxietyPost->title,
                'comment_id' => 1,
            ],
            'is_read' => true,
        ]);

        Notification::create([
            'user_id' => $users->where('email', 'emma@example.com')->first()->id,
            'type' => 'comment_approved',
            'data' => [
                'post_id' => $anxietyPost->id,
                'post_title' => $anxietyPost->title,
                'comment_id' => 2,
            ],
            'is_read' => true,
        ]);

        // Comment rejected notification
        Notification::create([
            'user_id' => $users->where('email', 'anon2@example.com')->first()->id,
            'type' => 'comment_rejected',
            'data' => [
                'post_id' => $posts->where('title', 'Struggling with Work Burnout')->first()->id,
                'post_title' => 'Struggling with Work Burnout',
                'comment_id' => 999, // Fake ID for rejected comment
                'reason' => 'Comment rejected due to inappropriate content.',
            ],
            'is_read' => false,
        ]);

        // Admin message notifications
        Notification::create([
            'user_id' => $users->where('email', 'alice@example.com')->first()->id,
            'type' => 'admin_message',
            'data' => [
                'message' => 'Thank you for your question about community guidelines. Discussing personal medication experiences is allowed, but please avoid giving specific medical advice to others.',
            ],
            'is_read' => false,
        ]);

        Notification::create([
            'user_id' => $users->where('email', 'emma@example.com')->first()->id,
            'type' => 'admin_message',
            'data' => [
                'message' => 'Thank you for reporting inappropriate behavior. We have investigated and taken appropriate action. The user has been warned and their messages have been removed.',
            ],
            'is_read' => true,
        ]);

        Notification::create([
            'user_id' => $users->where('email', 'david@example.com')->first()->id,
            'type' => 'admin_message',
            'data' => [
                'message' => 'Thank you for your interest in professional verification. Please send us your license information through our secure contact form and we will review your application.',
            ],
            'is_read' => false,
        ]);

        // Additional like notifications for other users
        $griefPost = $posts->where('title', 'Coping with Grief: One Year Later')->first();
        if ($griefPost) {
            Notification::create([
                'user_id' => $users->where('email', 'james@example.com')->first()->id,
                'type' => 'like',
                'data' => [
                    'post_id' => $griefPost->id,
                    'post_title' => $griefPost->title,
                ],
                'is_read' => false,
            ]);
        }

        $mindfulnessPost = $posts->where('title', 'Simple Mindfulness Exercises for Daily Life')->first();
        if ($mindfulnessPost) {
            Notification::create([
                'user_id' => $users->where('email', 'lisa@example.com')->first()->id,
                'type' => 'comment',
                'data' => [
                    'post_id' => $mindfulnessPost->id,
                    'post_title' => $mindfulnessPost->title,
                    'comment_id' => 5,
                ],
                'is_read' => true,
            ]);
        }
    }
} 
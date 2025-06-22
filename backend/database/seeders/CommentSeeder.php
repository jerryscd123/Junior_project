<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Comment;
use App\Models\Post;
use App\Models\User;

class CommentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $posts = Post::where('status', 'approved')->get();
        $users = User::where('role', 'user')->get();

        // Comments for the anxiety post
        $anxietyPost = $posts->where('title', 'My Journey with Anxiety: Finding Light in Dark Moments')->first();
        if ($anxietyPost) {
            Comment::create([
                'post_id' => $anxietyPost->id,
                'user_id' => $users->where('email', 'david@example.com')->first()->id,
                'is_anonymous' => false,
                'content' => 'Thank you for sharing your experience. Breathing exercises are indeed very effective for managing anxiety. Have you tried progressive muscle relaxation as well?',
                'status' => 'approved',
            ]);

            Comment::create([
                'post_id' => $anxietyPost->id,
                'user_id' => $users->where('email', 'emma@example.com')->first()->id,
                'is_anonymous' => false,
                'content' => 'This resonates with me so much. I\'ve been practicing mindfulness for a few months now and it\'s made a huge difference in how I handle anxious thoughts.',
                'status' => 'approved',
            ]);

            Comment::create([
                'post_id' => $anxietyPost->id,
                'user_id' => $users->where('email', 'anon1@example.com')->first()->id,
                'is_anonymous' => true,
                'content' => 'I\'m just starting my journey with anxiety management. Your post gives me hope that things can get better.',
                'status' => 'approved',
            ]);
        }

        // Comments for the depression post
        $depressionPost = $posts->where('title', 'Professional Perspective: Understanding Depression')->first();
        if ($depressionPost) {
            Comment::create([
                'post_id' => $depressionPost->id,
                'user_id' => $users->where('email', 'alice@example.com')->first()->id,
                'is_anonymous' => false,
                'content' => 'Thank you for this professional insight. It\'s so important to reduce the stigma around depression and help people understand it\'s a real medical condition.',
                'status' => 'approved',
            ]);

            Comment::create([
                'post_id' => $depressionPost->id,
                'user_id' => $users->where('email', 'james@example.com')->first()->id,
                'is_anonymous' => false,
                'content' => 'As someone who has struggled with depression, I appreciate professionals like you who take the time to educate and support the community.',
                'status' => 'approved',
            ]);

            Comment::create([
                'post_id' => $depressionPost->id,
                'user_id' => $users->where('email', 'anon2@example.com')->first()->id,
                'is_anonymous' => true,
                'content' => 'This helped me understand my own experience better. I\'ve been hesitant to seek help, but your post is encouraging me to take that step.',
                'status' => 'approved',
            ]);
        }

        // Comments for the burnout post
        $burnoutPost = $posts->where('title', 'Struggling with Work Burnout')->first();
        if ($burnoutPost) {
            Comment::create([
                'post_id' => $burnoutPost->id,
                'user_id' => $users->where('email', 'lisa@example.com')->first()->id,
                'is_anonymous' => false,
                'content' => 'I went through something similar last year. Talking to my manager actually helped - they were more understanding than I expected. Setting boundaries was key for me.',
                'status' => 'approved',
            ]);

            Comment::create([
                'post_id' => $burnoutPost->id,
                'user_id' => $users->where('email', 'emma@example.com')->first()->id,
                'is_anonymous' => false,
                'content' => 'Have you considered speaking with HR or an employee assistance program if your company has one? They might be able to provide additional support.',
                'status' => 'approved',
            ]);

            Comment::create([
                'post_id' => $burnoutPost->id,
                'user_id' => $users->where('email', 'david@example.com')->first()->id,
                'is_anonymous' => false,
                'content' => 'Burnout is very real and can have serious health consequences. Don\'t hesitate to prioritize your well-being - your health is more important than any job.',
                'status' => 'approved',
            ]);
        }

        // Comments for the mindfulness post
        $mindfulnessPost = $posts->where('title', 'Simple Mindfulness Exercises for Daily Life')->first();
        if ($mindfulnessPost) {
            Comment::create([
                'post_id' => $mindfulnessPost->id,
                'user_id' => $users->where('email', 'alice@example.com')->first()->id,
                'is_anonymous' => false,
                'content' => 'These are great suggestions! I especially love the mindful eating practice. It\'s amazing how much we miss when we eat while distracted.',
                'status' => 'approved',
            ]);

            Comment::create([
                'post_id' => $mindfulnessPost->id,
                'user_id' => $users->where('email', 'james@example.com')->first()->id,
                'is_anonymous' => false,
                'content' => 'The body scan technique has been a game-changer for me. I do it whenever I feel stress building up throughout the day.',
                'status' => 'approved',
            ]);
        }

        // Comments for the grief post
        $griefPost = $posts->where('title', 'Coping with Grief: One Year Later')->first();
        if ($griefPost) {
            Comment::create([
                'post_id' => $griefPost->id,
                'user_id' => $users->where('email', 'alice@example.com')->first()->id,
                'is_anonymous' => false,
                'content' => 'Thank you for sharing something so personal. I lost my mother two years ago and your words really resonate with me. The grief never fully goes away, but it does change.',
                'status' => 'approved',
            ]);

            Comment::create([
                'post_id' => $griefPost->id,
                'user_id' => $users->where('email', 'david@example.com')->first()->id,
                'is_anonymous' => false,
                'content' => 'Grief is indeed a very personal journey. Thank you for reminding us that there\'s no "right" way to grieve and that seeking support is important.',
                'status' => 'approved',
            ]);

            Comment::create([
                'post_id' => $griefPost->id,
                'user_id' => $users->where('email', 'anon1@example.com')->first()->id,
                'is_anonymous' => true,
                'content' => 'I\'m currently going through a loss and your post gives me hope that the pain will become more manageable with time.',
                'status' => 'approved',
            ]);
        }

        // Some pending comments
        Comment::create([
            'post_id' => $anxietyPost->id,
            'user_id' => $users->where('email', 'james@example.com')->first()->id,
            'is_anonymous' => false,
            'content' => 'This is a new comment that is still pending moderation.',
            'status' => 'pending',
        ]);

        Comment::create([
            'post_id' => $depressionPost->id,
            'user_id' => $users->where('email', 'lisa@example.com')->first()->id,
            'is_anonymous' => true,
            'content' => 'Another pending comment from an anonymous user.',
            'status' => 'pending',
        ]);

        // A rejected comment
        Comment::create([
            'post_id' => $burnoutPost->id,
            'user_id' => $users->where('email', 'anon1@example.com')->first()->id,
            'is_anonymous' => false,
            'content' => 'This comment was rejected due to inappropriate content.',
            'status' => 'rejected',
        ]);
    }
} 
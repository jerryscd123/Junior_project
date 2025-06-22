<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Post;
use App\Models\User;
use App\Models\Tag;

class PostSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();
        $tags = Tag::all();

        // Approved posts
        $approvedPosts = [
            [
                'user_id' => $users->where('email', 'alice@example.com')->first()->id,
                'is_anonymous' => false,
                'title' => 'My Journey with Anxiety: Finding Light in Dark Moments',
                'content' => 'I wanted to share my experience with anxiety and how I\'ve learned to manage it over the years. It hasn\'t been easy, but I\'ve discovered some strategies that really help. Breathing exercises, mindfulness meditation, and having a strong support system have been game-changers for me. I hope this helps someone who might be struggling with similar challenges.',
                'status' => 'approved',
                'like_count' => 15,
                'comment_count' => 8,
                'image' => 'posts/sample/anxiety-breathing.jpg',
                'image_metadata' => [
                    'alt' => 'Person practicing breathing exercises in nature',
                    'width' => 800,
                    'height' => 600,
                    'size' => 150000,
                    'mime_type' => 'image/jpeg',
                    'thumbnail' => 'posts/sample/anxiety-breathing-thumb.jpg',
                ],
                'tags' => ['anxiety', 'mindfulness', 'coping strategies', 'support']
            ],
            [
                'user_id' => $users->where('email', 'david@example.com')->first()->id,
                'is_anonymous' => false,
                'title' => 'Professional Perspective: Understanding Depression',
                'content' => 'As a therapist, I often see clients struggling with depression. It\'s important to understand that depression is a real medical condition, not a choice or weakness. There are many effective treatments available, including therapy, medication, and lifestyle changes. If you\'re struggling, please know that help is available and recovery is possible.',
                'status' => 'approved',
                'like_count' => 23,
                'comment_count' => 12,
                'tags' => ['depression', 'therapy', 'professional help', 'recovery']
            ],
            [
                'user_id' => $users->where('email', 'anon1@example.com')->first()->id,
                'is_anonymous' => true,
                'title' => 'Struggling with Work Burnout',
                'content' => 'I\'ve been feeling completely overwhelmed at work lately. The constant pressure and long hours are taking a toll on my mental health. I\'m considering talking to my manager about my workload, but I\'m worried about how it might affect my career. Has anyone else dealt with workplace burnout? How did you handle it?',
                'status' => 'approved',
                'like_count' => 18,
                'comment_count' => 15,
                'image' => 'posts/sample/burnout-workspace.jpg',
                'image_metadata' => [
                    'alt' => 'Stressed person at messy desk with overtime papers',
                    'width' => 1024,
                    'height' => 768,
                    'size' => 200000,
                    'mime_type' => 'image/jpeg',
                    'thumbnail' => 'posts/sample/burnout-workspace-thumb.jpg',
                ],
                'tags' => ['burnout', 'work stress', 'mental health', 'support']
            ],
            [
                'user_id' => $users->where('email', 'emma@example.com')->first()->id,
                'is_anonymous' => false,
                'title' => 'The Power of Peer Support Groups',
                'content' => 'I recently joined a peer support group for people dealing with mental health challenges, and it\'s been incredibly helpful. There\'s something powerful about connecting with others who truly understand what you\'re going through. If you\'re on the fence about joining a support group, I highly recommend giving it a try.',
                'status' => 'approved',
                'like_count' => 12,
                'comment_count' => 6,
                'tags' => ['peer support', 'community', 'mental health', 'healing']
            ],
            [
                'user_id' => $users->where('email', 'james@example.com')->first()->id,
                'is_anonymous' => false,
                'title' => 'Coping with Grief: One Year Later',
                'content' => 'It\'s been a year since I lost my father, and I wanted to share some thoughts on the grieving process. Everyone grieves differently, and there\'s no "right" timeline. Some days are harder than others, but I\'ve learned to be patient with myself and seek support when I need it. Therapy and connecting with others who have experienced loss have been invaluable.',
                'status' => 'approved',
                'like_count' => 25,
                'comment_count' => 18,
                'tags' => ['grief', 'loss', 'therapy', 'healing', 'support']
            ],
            [
                'user_id' => $users->where('email', 'lisa@example.com')->first()->id,
                'is_anonymous' => false,
                'title' => 'Simple Mindfulness Exercises for Daily Life',
                'content' => 'Mindfulness doesn\'t have to be complicated or time-consuming. Here are some simple exercises you can do throughout your day: 1) Take three deep breaths before starting any task, 2) Practice mindful eating by focusing on the taste and texture of your food, 3) Do a quick body scan when you feel stressed. These small practices can make a big difference in your overall well-being.',
                'status' => 'approved',
                'like_count' => 30,
                'comment_count' => 10,
                'image' => 'posts/sample/mindfulness-meditation.jpg',
                'image_metadata' => [
                    'alt' => 'Person meditating peacefully in a zen garden',
                    'width' => 900,
                    'height' => 600,
                    'size' => 180000,
                    'mime_type' => 'image/jpeg',
                    'thumbnail' => 'posts/sample/mindfulness-meditation-thumb.jpg',
                ],
                'tags' => ['mindfulness', 'meditation', 'stress management', 'wellness']
            ],
            [
                'user_id' => $users->where('email', 'anon2@example.com')->first()->id,
                'is_anonymous' => true,
                'title' => 'Finding Hope After a Difficult Diagnosis',
                'content' => 'I was recently diagnosed with bipolar disorder, and I\'m still processing everything. The initial shock and fear were overwhelming, but I\'m starting to feel more hopeful. My doctor has been great in explaining treatment options, and I\'m beginning therapy next week. If anyone else has been through this, I\'d love to hear about your experience.',
                'status' => 'approved',
                'like_count' => 20,
                'comment_count' => 14,
                'tags' => ['bipolar', 'diagnosis', 'hope', 'therapy', 'support']
            ]
        ];

        // Pending posts
        $pendingPosts = [
            [
                'user_id' => $users->where('email', 'anon1@example.com')->first()->id,
                'is_anonymous' => false,
                'title' => 'New to This Community',
                'content' => 'Hi everyone, I\'m new here and feeling a bit nervous about sharing. I\'ve been dealing with anxiety for a while now and finally decided to seek support. Looking forward to connecting with others who understand.',
                'status' => 'pending',
                'like_count' => 0,
                'comment_count' => 0,
                'tags' => ['anxiety', 'community', 'support']
            ],
            [
                'user_id' => $users->where('email', 'anon2@example.com')->first()->id,
                'is_anonymous' => true,
                'title' => 'Struggling with Sleep Issues',
                'content' => 'I\'ve been having trouble sleeping for months now. My mind races when I try to go to bed, and I end up staying awake until very late. This is affecting my work and relationships. Any suggestions for better sleep hygiene?',
                'status' => 'pending',
                'like_count' => 0,
                'comment_count' => 0,
                'tags' => ['sleep', 'anxiety', 'wellness']
            ]
        ];

        // Rejected posts
        $rejectedPosts = [
            [
                'user_id' => $users->where('role', 'user')->first()->id,
                'is_anonymous' => false,
                'title' => 'Inappropriate Content Example',
                'content' => 'This post contains content that violates community guidelines and was rejected by moderators.',
                'status' => 'rejected',
                'admin_note' => 'Post rejected due to inappropriate content that violates community guidelines.',
                'like_count' => 0,
                'comment_count' => 0,
                'tags' => []
            ]
        ];

        // Create approved posts
        foreach ($approvedPosts as $postData) {
            $tagNames = $postData['tags'];
            unset($postData['tags']);
            
            $post = Post::create($postData);
            
            // Attach tags
            $postTags = $tags->whereIn('name', $tagNames);
            $post->tags()->attach($postTags->pluck('id'));
        }

        // Create pending posts
        foreach ($pendingPosts as $postData) {
            $tagNames = $postData['tags'];
            unset($postData['tags']);
            
            $post = Post::create($postData);
            
            // Attach tags
            $postTags = $tags->whereIn('name', $tagNames);
            $post->tags()->attach($postTags->pluck('id'));
        }

        // Create rejected posts
        foreach ($rejectedPosts as $postData) {
            $tagNames = $postData['tags'];
            unset($postData['tags']);
            
            $post = Post::create($postData);
            
            // Attach tags if any
            if (!empty($tagNames)) {
                $postTags = $tags->whereIn('name', $tagNames);
                $post->tags()->attach($postTags->pluck('id'));
            }
        }
    }
} 
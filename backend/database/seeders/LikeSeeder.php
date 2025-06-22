<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Like;
use App\Models\Post;
use App\Models\User;

class LikeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $posts = Post::where('status', 'approved')->get();
        $users = User::where('role', 'user')->get();

        // Add likes to posts to match the like_count in PostSeeder
        foreach ($posts as $post) {
            $likeCount = $post->like_count;
            
            // Get random users to like this post
            $likingUsers = $users->random(min($likeCount, $users->count()));
            
            foreach ($likingUsers as $user) {
                Like::create([
                    'user_id' => $user->id,
                    'post_id' => $post->id,
                ]);
            }
        }
    }
} 
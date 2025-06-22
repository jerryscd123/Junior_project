<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@mindspeak.com',
            'password' => Hash::make('password123'),
            'avatar' => null,
            'bio' => 'System administrator with full access to manage the platform.',
            'is_anonymous' => false,
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        // Create moderator users
        User::create([
            'name' => 'Sarah Johnson',
            'email' => 'moderator1@mindspeak.com',
            'password' => Hash::make('password123'),
            'avatar' => null,
            'bio' => 'Community moderator helping to maintain a safe and welcoming environment.',
            'is_anonymous' => false,
            'role' => 'moderator',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Mike Chen',
            'email' => 'moderator2@mindspeak.com',
            'password' => Hash::make('password123'),
            'avatar' => null,
            'bio' => 'Experienced moderator focused on content quality and community guidelines.',
            'is_anonymous' => false,
            'role' => 'moderator',
            'email_verified_at' => now(),
        ]);

        // Create regular users
        User::create([
            'name' => 'Alice Thompson',
            'email' => 'alice@example.com',
            'password' => Hash::make('password123'),
            'avatar' => null,
            'bio' => 'Mental health advocate sharing experiences and supporting others on their journey.',
            'is_anonymous' => false,
            'role' => 'user',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'David Rodriguez',
            'email' => 'david@example.com',
            'password' => Hash::make('password123'),
            'avatar' => null,
            'bio' => 'Therapist and counselor providing insights and professional perspective.',
            'is_anonymous' => false,
            'role' => 'user',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Emma Wilson',
            'email' => 'emma@example.com',
            'password' => Hash::make('password123'),
            'avatar' => null,
            'bio' => 'Student studying psychology, interested in mental health awareness.',
            'is_anonymous' => false,
            'role' => 'user',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Anonymous User 1',
            'email' => 'anon1@example.com',
            'password' => Hash::make('password123'),
            'avatar' => null,
            'bio' => 'Prefers to share thoughts and experiences anonymously.',
            'is_anonymous' => true,
            'role' => 'user',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Anonymous User 2',
            'email' => 'anon2@example.com',
            'password' => Hash::make('password123'),
            'avatar' => null,
            'bio' => 'Values privacy while seeking support and connection.',
            'is_anonymous' => true,
            'role' => 'user',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'James Miller',
            'email' => 'james@example.com',
            'password' => Hash::make('password123'),
            'avatar' => null,
            'bio' => 'Anxiety and depression survivor, sharing coping strategies and hope.',
            'is_anonymous' => false,
            'role' => 'user',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Lisa Anderson',
            'email' => 'lisa@example.com',
            'password' => Hash::make('password123'),
            'avatar' => null,
            'bio' => 'Mindfulness practitioner and meditation teacher.',
            'is_anonymous' => false,
            'role' => 'user',
            'email_verified_at' => now(),
        ]);
    }
} 
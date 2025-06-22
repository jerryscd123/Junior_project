<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Message;
use App\Models\User;

class MessageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::where('role', 'user')->get();
        $admins = User::whereIn('role', ['admin', 'moderator'])->get();

        $messages = [
            [
                'user_id' => $users->where('email', 'alice@example.com')->first()->id,
                'to_admin_id' => $admins->where('role', 'admin')->first()->id,
                'subject' => 'Question about Community Guidelines',
                'content' => 'Hi, I have a question about the community guidelines. I want to share my experience with medication, but I\'m not sure if discussing specific medications is allowed. Could you please clarify what\'s appropriate to share?',
                'status' => 'read',
            ],
            [
                'user_id' => $users->where('email', 'emma@example.com')->first()->id,
                'to_admin_id' => $admins->where('role', 'moderator')->first()->id,
                'subject' => 'Reporting Inappropriate Behavior',
                'content' => 'I wanted to report a user who has been sending me inappropriate private messages. I have screenshots if needed. The behavior is making me uncomfortable and I think it violates the community guidelines.',
                'status' => 'responded',
            ],
            [
                'user_id' => $users->where('email', 'james@example.com')->first()->id,
                'to_admin_id' => $admins->where('role', 'admin')->first()->id,
                'subject' => 'Account Deletion Request',
                'content' => 'I need to delete my account due to personal reasons. I understand this action is permanent. Could you please guide me through the process or delete it for me? I want to make sure all my data is completely removed.',
                'status' => 'unread',
            ],
            [
                'user_id' => $users->where('email', 'david@example.com')->first()->id,
                'to_admin_id' => $admins->where('role', 'admin')->first()->id,
                'subject' => 'Professional Verification Request',
                'content' => 'Hello, I\'m a licensed therapist and would like to have my professional status verified on the platform. I can provide my license information and credentials. I believe this would help users identify professional perspectives in discussions. Please let me know what documentation you need.',
                'status' => 'read',
            ],
            [
                'user_id' => $users->where('email', 'anon1@example.com')->first()->id,
                'to_admin_id' => $admins->where('role', 'moderator')->first()->id,
                'subject' => 'Technical Issue with Anonymous Posting',
                'content' => 'I\'ve been having trouble with the anonymous posting feature. Sometimes my posts show my username even when I select anonymous mode. Could you please look into this issue? Privacy is very important to me.',
                'status' => 'unread',
            ],
            [
                'user_id' => $users->where('email', 'lisa@example.com')->first()->id,
                'to_admin_id' => $admins->where('role', 'moderator')->first()->id,
                'subject' => 'Post Rejection Inquiry',
                'content' => 'My recent post was rejected and I\'m not sure why. I thought I followed all the guidelines. Could you please explain what was wrong with it so I can avoid making the same mistake in the future?',
                'status' => 'responded',
            ]
        ];

        foreach ($messages as $messageData) {
            Message::create($messageData);
        }
    }
} 
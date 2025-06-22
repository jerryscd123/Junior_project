<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Post;
use App\Models\Comment;
use App\Models\Notification;
use Illuminate\Support\Facades\Hash;

class NotificationTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;
    protected $otherUser;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create([
            'role' => 'user',
            'password' => Hash::make('password123'),
        ]);
        
        $this->otherUser = User::factory()->create([
            'role' => 'user',
            'password' => Hash::make('password123'),
        ]);
    }

    /**
     * Test user can get their notifications
     */
    public function test_user_can_get_notifications(): void
    {
        // Create notifications for the user
        Notification::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'type' => 'like',
            'is_read' => false
        ]);
        
        // Create notifications for other user (should not be visible)
        Notification::factory()->count(2)->create([
            'user_id' => $this->otherUser->id,
            'type' => 'comment',
            'is_read' => false
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/notifications');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'notifications' => [
                            '*' => [
                                'id',
                                'type',
                                'data',
                                'is_read',
                                'created_at'
                            ]
                        ],
                        'pagination',
                        'unread_count'
                    ]
                ]);

        $notifications = $response->json('data.notifications');
        $this->assertCount(3, $notifications);
        
        // Check that all notifications belong to the authenticated user
        foreach ($notifications as $notification) {
            $this->assertEquals('like', $notification['type']);
            $this->assertFalse($notification['is_read']);
        }
    }

    /**
     * Test user can mark notifications as read
     */
    public function test_user_can_mark_notifications_as_read(): void
    {
        $notifications = Notification::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'is_read' => false
        ]);

        $notificationIds = $notifications->pluck('id')->toArray();

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/notifications/read', [
                             'notification_ids' => $notificationIds
                         ]);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Notifications marked as read',
                    'data' => [
                        'marked_count' => 3
                    ]
                ]);

        // Check that notifications are marked as read in database
        foreach ($notificationIds as $id) {
            $this->assertDatabaseHas('notifications', [
                'id' => $id,
                'is_read' => true,
            ]);
        }
    }

    /**
     * Test user can mark all notifications as read
     */
    public function test_user_can_mark_all_notifications_as_read(): void
    {
        Notification::factory()->count(5)->create([
            'user_id' => $this->user->id,
            'is_read' => false
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/notifications/read', [
                             'mark_all' => true
                         ]);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'All notifications marked as read',
                    'data' => [
                        'marked_count' => 5
                    ]
                ]);

        // Check that all user's notifications are marked as read
        $this->assertEquals(0, Notification::where('user_id', $this->user->id)
                                          ->where('is_read', false)
                                          ->count());
    }

    /**
     * Test user cannot mark other user's notifications as read
     */
    public function test_user_cannot_mark_other_users_notifications_as_read(): void
    {
        $otherNotification = Notification::factory()->create([
            'user_id' => $this->otherUser->id,
            'is_read' => false
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/notifications/read', [
                             'notification_ids' => [$otherNotification->id]
                         ]);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'marked_count' => 0 // Should not mark any notifications
                    ]
                ]);

        // Check that other user's notification is still unread
        $this->assertDatabaseHas('notifications', [
            'id' => $otherNotification->id,
            'is_read' => false,
        ]);
    }

    /**
     * Test notifications are filtered by read status
     */
    public function test_notifications_filtered_by_read_status(): void
    {
        Notification::factory()->count(2)->create([
            'user_id' => $this->user->id,
            'is_read' => false
        ]);
        
        Notification::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'is_read' => true
        ]);

        // Get unread notifications
        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/notifications?unread_only=true');

        $response->assertStatus(200);
        $notifications = $response->json('data.notifications');
        $this->assertCount(2, $notifications);
        
        foreach ($notifications as $notification) {
            $this->assertFalse($notification['is_read']);
        }
    }

    /**
     * Test notifications are filtered by type
     */
    public function test_notifications_filtered_by_type(): void
    {
        Notification::factory()->count(2)->create([
            'user_id' => $this->user->id,
            'type' => 'like'
        ]);
        
        Notification::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'type' => 'comment'
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/notifications?type=like');

        $response->assertStatus(200);
        $notifications = $response->json('data.notifications');
        $this->assertCount(2, $notifications);
        
        foreach ($notifications as $notification) {
            $this->assertEquals('like', $notification['type']);
        }
    }

    /**
     * Test notification types are valid
     */
    public function test_notification_types_are_valid(): void
    {
        $validTypes = [
            'like',
            'comment',
            'admin_message',
            'post_approved',
            'post_rejected',
            'comment_approved',
            'comment_rejected'
        ];

        foreach ($validTypes as $type) {
            $notification = Notification::factory()->create([
                'user_id' => $this->user->id,
                'type' => $type
            ]);

            $this->assertDatabaseHas('notifications', [
                'id' => $notification->id,
                'type' => $type,
            ]);
        }
    }

    /**
     * Test like notification data structure
     */
    public function test_like_notification_data_structure(): void
    {
        $post = Post::factory()->create(['user_id' => $this->user->id]);
        
        $notification = Notification::factory()->create([
            'user_id' => $this->user->id,
            'type' => 'like',
            'data' => [
                'post_id' => $post->id,
                'post_title' => $post->title,
                'liker_name' => $this->otherUser->name,
                'liker_id' => $this->otherUser->id
            ]
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/notifications');

        $response->assertStatus(200);
        $notifications = $response->json('data.notifications');
        
        $likeNotification = collect($notifications)->firstWhere('id', $notification->id);
        $this->assertEquals('like', $likeNotification['type']);
        $this->assertArrayHasKey('post_id', $likeNotification['data']);
        $this->assertArrayHasKey('post_title', $likeNotification['data']);
        $this->assertArrayHasKey('liker_name', $likeNotification['data']);
    }

    /**
     * Test comment notification data structure
     */
    public function test_comment_notification_data_structure(): void
    {
        $post = Post::factory()->create(['user_id' => $this->user->id]);
        $comment = Comment::factory()->create(['post_id' => $post->id]);
        
        $notification = Notification::factory()->create([
            'user_id' => $this->user->id,
            'type' => 'comment',
            'data' => [
                'post_id' => $post->id,
                'post_title' => $post->title,
                'comment_id' => $comment->id,
                'comment_content' => substr($comment->content, 0, 100),
                'commenter_name' => $this->otherUser->name,
                'commenter_id' => $this->otherUser->id
            ]
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/notifications');

        $response->assertStatus(200);
        $notifications = $response->json('data.notifications');
        
        $commentNotification = collect($notifications)->firstWhere('id', $notification->id);
        $this->assertEquals('comment', $commentNotification['type']);
        $this->assertArrayHasKey('post_id', $commentNotification['data']);
        $this->assertArrayHasKey('comment_id', $commentNotification['data']);
        $this->assertArrayHasKey('commenter_name', $commentNotification['data']);
    }

    /**
     * Test admin message notification data structure
     */
    public function test_admin_message_notification_data_structure(): void
    {
        $notification = Notification::factory()->create([
            'user_id' => $this->user->id,
            'type' => 'admin_message',
            'data' => [
                'message' => 'Welcome to Mindspeak! Please read our community guidelines.',
                'admin_name' => 'Admin',
                'action_required' => false
            ]
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/notifications');

        $response->assertStatus(200);
        $notifications = $response->json('data.notifications');
        
        $adminNotification = collect($notifications)->firstWhere('id', $notification->id);
        $this->assertEquals('admin_message', $adminNotification['type']);
        $this->assertArrayHasKey('message', $adminNotification['data']);
        $this->assertArrayHasKey('admin_name', $adminNotification['data']);
    }

    /**
     * Test post status notification data structure
     */
    public function test_post_status_notification_data_structure(): void
    {
        $post = Post::factory()->create(['user_id' => $this->user->id]);
        
        $notification = Notification::factory()->create([
            'user_id' => $this->user->id,
            'type' => 'post_approved',
            'data' => [
                'post_id' => $post->id,
                'post_title' => $post->title,
                'status' => 'approved',
                'admin_note' => null
            ]
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/notifications');

        $response->assertStatus(200);
        $notifications = $response->json('data.notifications');
        
        $statusNotification = collect($notifications)->firstWhere('id', $notification->id);
        $this->assertEquals('post_approved', $statusNotification['type']);
        $this->assertArrayHasKey('post_id', $statusNotification['data']);
        $this->assertArrayHasKey('status', $statusNotification['data']);
    }

    /**
     * Test notifications are paginated
     */
    public function test_notifications_are_paginated(): void
    {
        Notification::factory()->count(25)->create([
            'user_id' => $this->user->id
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/notifications?per_page=10');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        'notifications',
                        'pagination' => [
                            'current_page',
                            'last_page',
                            'per_page',
                            'total'
                        ]
                    ]
                ]);

        $pagination = $response->json('data.pagination');
        $this->assertEquals(10, $pagination['per_page']);
        $this->assertEquals(3, $pagination['last_page']);
        $this->assertEquals(25, $pagination['total']);
    }

    /**
     * Test notifications are ordered by creation date
     */
    public function test_notifications_are_ordered_by_creation_date(): void
    {
        $notification1 = Notification::factory()->create([
            'user_id' => $this->user->id,
            'created_at' => now()->subHours(2)
        ]);

        $notification2 = Notification::factory()->create([
            'user_id' => $this->user->id,
            'created_at' => now()->subHour()
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/notifications');

        $response->assertStatus(200);
        $notifications = $response->json('data.notifications');
        
        // Should be ordered by newest first
        $this->assertEquals($notification2->id, $notifications[0]['id']);
        $this->assertEquals($notification1->id, $notifications[1]['id']);
    }

    /**
     * Test unread count is returned correctly
     */
    public function test_unread_count_returned_correctly(): void
    {
        Notification::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'is_read' => false
        ]);
        
        Notification::factory()->count(2)->create([
            'user_id' => $this->user->id,
            'is_read' => true
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/notifications');

        $response->assertStatus(200)
                ->assertJsonPath('data.unread_count', 3);
    }

    /**
     * Test unauthenticated user cannot access notifications
     */
    public function test_unauthenticated_user_cannot_access_notifications(): void
    {
        $response = $this->getJson('/api/notifications');
        $response->assertStatus(401);
    }

    /**
     * Test marking non-existent notifications as read
     */
    public function test_marking_non_existent_notifications_as_read(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/notifications/read', [
                             'notification_ids' => [999999, 999998]
                         ]);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'marked_count' => 0
                    ]
                ]);
    }
}

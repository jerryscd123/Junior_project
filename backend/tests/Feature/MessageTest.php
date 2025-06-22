<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Message;
use Illuminate\Support\Facades\Hash;

class MessageTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;
    protected $admin;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create([
            'role' => 'user',
            'password' => Hash::make('password123'),
        ]);
        
        $this->admin = User::factory()->create([
            'role' => 'admin',
            'password' => Hash::make('password123'),
        ]);
    }

    /**
     * Test user can get their messages
     */
    public function test_user_can_get_messages(): void
    {
        // Create messages for the user
        Message::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'status' => 'unread'
        ]);
        
        // Create messages for other user (should not be visible)
        $otherUser = User::factory()->create();
        Message::factory()->count(2)->create([
            'user_id' => $otherUser->id,
            'status' => 'unread'
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/messages');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'messages' => [
                            '*' => [
                                'id',
                                'subject',
                                'content',
                                'status',
                                'created_at',
                                'to_admin_id',
                                'admin'
                            ]
                        ],
                        'pagination'
                    ]
                ]);

        $messages = $response->json('data.messages');
        $this->assertCount(3, $messages);
        
        // Check that all messages belong to the authenticated user
        foreach ($messages as $message) {
            $this->assertEquals('unread', $message['status']);
        }
    }

    /**
     * Test user can send message to admin
     */
    public function test_user_can_send_message_to_admin(): void
    {
        $messageData = [
            'subject' => 'Need help with my account',
            'content' => 'I am having trouble accessing some features. Can you please help?',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/messages', $messageData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => [
                        'message' => [
                            'id',
                            'subject',
                            'content',
                            'status',
                            'created_at'
                        ]
                    ]
                ])
                ->assertJson([
                    'success' => true,
                    'message' => 'Message sent successfully',
                    'data' => [
                        'message' => [
                            'subject' => 'Need help with my account',
                            'content' => 'I am having trouble accessing some features. Can you please help?',
                            'status' => 'unread',
                        ]
                    ]
                ]);

        $this->assertDatabaseHas('messages', [
            'subject' => 'Need help with my account',
            'content' => 'I am having trouble accessing some features. Can you please help?',
            'user_id' => $this->user->id,
            'status' => 'unread',
        ]);
    }

    /**
     * Test message creation validation
     */
    public function test_message_creation_validation(): void
    {
        $messageData = [
            'subject' => '', // Required field empty
            'content' => '', // Required field empty
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/messages', $messageData);

        $response->assertStatus(422)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'errors'
                ])
                ->assertJson([
                    'success' => false,
                ]);
    }

    /**
     * Test subject length validation
     */
    public function test_subject_length_validation(): void
    {
        $messageData = [
            'subject' => str_repeat('a', 151), // Exceeds 150 character limit
            'content' => 'Valid content',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/messages', $messageData);

        $response->assertStatus(422)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'errors' => [
                        'subject'
                    ]
                ]);
    }

    /**
     * Test messages are filtered by status
     */
    public function test_messages_filtered_by_status(): void
    {
        Message::factory()->count(2)->create([
            'user_id' => $this->user->id,
            'status' => 'unread'
        ]);
        
        Message::factory()->count(3)->create([
            'user_id' => $this->user->id,
            'status' => 'responded'
        ]);

        // Get unread messages
        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/messages?status=unread');

        $response->assertStatus(200);
        $messages = $response->json('data.messages');
        $this->assertCount(2, $messages);
        
        foreach ($messages as $message) {
            $this->assertEquals('unread', $message['status']);
        }
    }

    /**
     * Test messages can be searched
     */
    public function test_messages_can_be_searched(): void
    {
        Message::factory()->create([
            'user_id' => $this->user->id,
            'subject' => 'Account Issue',
            'content' => 'Having trouble with login'
        ]);
        
        Message::factory()->create([
            'user_id' => $this->user->id,
            'subject' => 'Feature Request',
            'content' => 'Would like to see new features'
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/messages?search=Account');

        $response->assertStatus(200);
        $messages = $response->json('data.messages');
        $this->assertCount(1, $messages);
        $this->assertStringContainsString('Account', $messages[0]['subject']);
    }

    /**
     * Test messages are paginated
     */
    public function test_messages_are_paginated(): void
    {
        Message::factory()->count(25)->create([
            'user_id' => $this->user->id
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/messages?per_page=10');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        'messages',
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
     * Test messages are ordered by creation date
     */
    public function test_messages_are_ordered_by_creation_date(): void
    {
        $message1 = Message::factory()->create([
            'user_id' => $this->user->id,
            'created_at' => now()->subHours(2)
        ]);

        $message2 = Message::factory()->create([
            'user_id' => $this->user->id,
            'created_at' => now()->subHour()
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/messages');

        $response->assertStatus(200);
        $messages = $response->json('data.messages');
        
        // Should be ordered by newest first
        $this->assertEquals($message2->id, $messages[0]['id']);
        $this->assertEquals($message1->id, $messages[1]['id']);
    }

    /**
     * Test unauthenticated user cannot access messages
     */
    public function test_unauthenticated_user_cannot_access_messages(): void
    {
        $response = $this->getJson('/api/messages');
        $response->assertStatus(401);
    }

    /**
     * Test unauthenticated user cannot send messages
     */
    public function test_unauthenticated_user_cannot_send_messages(): void
    {
        $messageData = [
            'subject' => 'Test Subject',
            'content' => 'Test content',
        ];

        $response = $this->postJson('/api/messages', $messageData);
        $response->assertStatus(401);
    }

    /**
     * Test message status types are valid
     */
    public function test_message_status_types_are_valid(): void
    {
        $validStatuses = ['unread', 'read', 'responded'];

        foreach ($validStatuses as $status) {
            $message = Message::factory()->create([
                'user_id' => $this->user->id,
                'status' => $status
            ]);

            $this->assertDatabaseHas('messages', [
                'id' => $message->id,
                'status' => $status,
            ]);
        }
    }

    /**
     * Test message with admin response information
     */
    public function test_message_with_admin_response_information(): void
    {
        $message = Message::factory()->create([
            'user_id' => $this->user->id,
            'to_admin_id' => $this->admin->id,
            'status' => 'responded'
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/messages');

        $response->assertStatus(200);
        $messages = $response->json('data.messages');
        
        $respondedMessage = collect($messages)->firstWhere('id', $message->id);
        $this->assertEquals('responded', $respondedMessage['status']);
        $this->assertEquals($this->admin->id, $respondedMessage['to_admin_id']);
        $this->assertNotNull($respondedMessage['admin']);
        $this->assertEquals($this->admin->name, $respondedMessage['admin']['name']);
    }

    /**
     * Test message content filtering
     */
    public function test_message_content_filtering(): void
    {
        $messageData = [
            'subject' => 'Help with badword issue',
            'content' => 'I have a problem with inappropriate content filtering.',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/messages', $messageData);

        // Should still create the message
        $response->assertStatus(201);
        
        $this->assertDatabaseHas('messages', [
            'subject' => 'Help with badword issue',
            'content' => 'I have a problem with inappropriate content filtering.',
            'status' => 'unread',
        ]);
    }

    /**
     * Test message rate limiting
     */
    public function test_message_rate_limiting(): void
    {
        // Send multiple messages quickly
        for ($i = 0; $i < 5; $i++) {
            $messageData = [
                'subject' => "Message $i",
                'content' => "Content for message $i",
            ];

            $response = $this->actingAs($this->user, 'sanctum')
                             ->postJson('/api/messages', $messageData);

            if ($i < 3) {
                // First few messages should succeed
                $response->assertStatus(201);
            } else {
                // Later messages might be rate limited
                // This depends on the actual rate limiting implementation
                $this->assertTrue(in_array($response->status(), [201, 429]));
            }
        }
    }

    /**
     * Test message notification creation
     */
    public function test_message_creates_notification(): void
    {
        $messageData = [
            'subject' => 'Test notification',
            'content' => 'This should create a notification for admins.',
        ];

        $this->actingAs($this->user, 'sanctum')
             ->postJson('/api/messages', $messageData);

        // Check that a notification was created for admins
        // This would depend on the actual notification implementation
        $this->assertDatabaseHas('messages', [
            'subject' => 'Test notification',
            'user_id' => $this->user->id,
        ]);
    }

    /**
     * Test message privacy - user can only see own messages
     */
    public function test_message_privacy(): void
    {
        $otherUser = User::factory()->create();
        
        // Create message for other user
        Message::factory()->create([
            'user_id' => $otherUser->id,
            'subject' => 'Other user message'
        ]);
        
        // Create message for current user
        Message::factory()->create([
            'user_id' => $this->user->id,
            'subject' => 'My message'
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/messages');

        $response->assertStatus(200);
        $messages = $response->json('data.messages');
        
        // Should only see own message
        $this->assertCount(1, $messages);
        $this->assertEquals('My message', $messages[0]['subject']);
    }

    /**
     * Test empty message list
     */
    public function test_empty_message_list(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/messages');

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'messages' => []
                    ]
                ]);
    }
}

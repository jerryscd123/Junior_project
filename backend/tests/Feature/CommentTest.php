<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Post;
use App\Models\Comment;
use Illuminate\Support\Facades\Hash;

class CommentTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;
    protected $admin;
    protected $post;

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

        $this->post = Post::factory()->create([
            'status' => 'approved',
            'user_id' => $this->user->id
        ]);
    }

    /**
     * Test getting comments for a post (public endpoint)
     */
    public function test_can_get_post_comments(): void
    {
        // Create some approved comments
        Comment::factory()->count(3)->create([
            'post_id' => $this->post->id,
            'status' => 'approved'
        ]);
        
        // Create pending comments (should not be visible)
        Comment::factory()->count(2)->create([
            'post_id' => $this->post->id,
            'status' => 'pending'
        ]);

        $response = $this->getJson("/api/posts/{$this->post->id}/comments");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'comments' => [
                            '*' => [
                                'id',
                                'content',
                                'status',
                                'is_anonymous',
                                'created_at',
                                'user'
                            ]
                        ],
                        'pagination'
                    ]
                ]);

        // Should only return approved comments
        $comments = $response->json('data.comments');
        $this->assertCount(3, $comments);
        foreach ($comments as $comment) {
            $this->assertEquals('approved', $comment['status']);
        }
    }

    /**
     * Test authenticated user can create comment
     */
    public function test_authenticated_user_can_create_comment(): void
    {
        $commentData = [
            'content' => 'This is a test comment.',
            'is_anonymous' => false,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson("/api/posts/{$this->post->id}/comments", $commentData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => [
                        'comment' => [
                            'id',
                            'content',
                            'status',
                            'is_anonymous',
                            'created_at'
                        ]
                    ]
                ])
                ->assertJson([
                    'success' => true,
                    'message' => 'Comment created successfully',
                    'data' => [
                        'comment' => [
                            'content' => 'This is a test comment.',
                            'status' => 'pending',
                            'is_anonymous' => false,
                        ]
                    ]
                ]);

        $this->assertDatabaseHas('comments', [
            'content' => 'This is a test comment.',
            'post_id' => $this->post->id,
            'user_id' => $this->user->id,
            'status' => 'pending',
            'is_anonymous' => false,
        ]);
    }

    /**
     * Test user can create anonymous comment
     */
    public function test_user_can_create_anonymous_comment(): void
    {
        $commentData = [
            'content' => 'This is an anonymous comment.',
            'is_anonymous' => true,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson("/api/posts/{$this->post->id}/comments", $commentData);

        $response->assertStatus(201)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'comment' => [
                            'is_anonymous' => true,
                        ]
                    ]
                ]);

        $this->assertDatabaseHas('comments', [
            'content' => 'This is an anonymous comment.',
            'is_anonymous' => true,
        ]);
    }

    /**
     * Test comment creation validation
     */
    public function test_comment_creation_validation(): void
    {
        $commentData = [
            'content' => '', // Required field empty
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson("/api/posts/{$this->post->id}/comments", $commentData);

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
     * Test user can update own comment
     */
    public function test_user_can_update_own_comment(): void
    {
        $comment = Comment::factory()->create([
            'post_id' => $this->post->id,
            'user_id' => $this->user->id,
            'status' => 'pending'
        ]);

        $updateData = [
            'content' => 'Updated comment content.',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->putJson("/api/comments/{$comment->id}", $updateData);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Comment updated successfully',
                    'data' => [
                        'comment' => [
                            'content' => 'Updated comment content.',
                        ]
                    ]
                ]);

        $this->assertDatabaseHas('comments', [
            'id' => $comment->id,
            'content' => 'Updated comment content.',
        ]);
    }

    /**
     * Test user cannot update other user's comment
     */
    public function test_user_cannot_update_other_users_comment(): void
    {
        $otherUser = User::factory()->create();
        $comment = Comment::factory()->create([
            'post_id' => $this->post->id,
            'user_id' => $otherUser->id
        ]);

        $updateData = [
            'content' => 'Hacked comment content.',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->putJson("/api/comments/{$comment->id}", $updateData);

        $response->assertStatus(403);
    }

    /**
     * Test user can delete own comment
     */
    public function test_user_can_delete_own_comment(): void
    {
        $comment = Comment::factory()->create([
            'post_id' => $this->post->id,
            'user_id' => $this->user->id,
            'status' => 'pending'
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->deleteJson("/api/comments/{$comment->id}");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Comment deleted successfully',
                ]);

        $this->assertSoftDeleted('comments', [
            'id' => $comment->id,
        ]);
    }

    /**
     * Test user cannot delete other user's comment
     */
    public function test_user_cannot_delete_other_users_comment(): void
    {
        $otherUser = User::factory()->create();
        $comment = Comment::factory()->create([
            'post_id' => $this->post->id,
            'user_id' => $otherUser->id
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->deleteJson("/api/comments/{$comment->id}");

        $response->assertStatus(403);
    }

    /**
     * Test unauthenticated user cannot create comment
     */
    public function test_unauthenticated_user_cannot_create_comment(): void
    {
        $commentData = [
            'content' => 'Test comment',
        ];

        $response = $this->postJson("/api/posts/{$this->post->id}/comments", $commentData);

        $response->assertStatus(401);
    }

    /**
     * Test cannot comment on non-existent post
     */
    public function test_cannot_comment_on_non_existent_post(): void
    {
        $commentData = [
            'content' => 'Test comment',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/posts/999999/comments', $commentData);

        $response->assertStatus(404);
    }

    /**
     * Test cannot comment on pending post
     */
    public function test_cannot_comment_on_pending_post(): void
    {
        $pendingPost = Post::factory()->create(['status' => 'pending']);

        $commentData = [
            'content' => 'Test comment',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson("/api/posts/{$pendingPost->id}/comments", $commentData);

        $response->assertStatus(403);
    }

    /**
     * Test comments are paginated
     */
    public function test_comments_are_paginated(): void
    {
        Comment::factory()->count(25)->create([
            'post_id' => $this->post->id,
            'status' => 'approved'
        ]);

        $response = $this->getJson("/api/posts/{$this->post->id}/comments?per_page=10");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        'comments',
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
     * Test comments are ordered by creation date
     */
    public function test_comments_are_ordered_by_creation_date(): void
    {
        $comment1 = Comment::factory()->create([
            'post_id' => $this->post->id,
            'status' => 'approved',
            'created_at' => now()->subHours(2)
        ]);

        $comment2 = Comment::factory()->create([
            'post_id' => $this->post->id,
            'status' => 'approved',
            'created_at' => now()->subHour()
        ]);

        $response = $this->getJson("/api/posts/{$this->post->id}/comments");

        $response->assertStatus(200);
        $comments = $response->json('data.comments');
        
        // Should be ordered by newest first
        $this->assertEquals($comment2->id, $comments[0]['id']);
        $this->assertEquals($comment1->id, $comments[1]['id']);
    }

    /**
     * Test comment content filtering
     */
    public function test_comment_content_filtering(): void
    {
        $commentData = [
            'content' => 'This comment contains badword and inappropriate content.',
            'is_anonymous' => false,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson("/api/posts/{$this->post->id}/comments", $commentData);

        // Should still create the comment but might flag it for moderation
        $response->assertStatus(201);
        
        // The comment should be created with pending status for moderation
        $this->assertDatabaseHas('comments', [
            'content' => 'This comment contains badword and inappropriate content.',
            'status' => 'pending',
        ]);
    }

    /**
     * Test anonymous comment privacy
     */
    public function test_anonymous_comment_privacy(): void
    {
        $comment = Comment::factory()->create([
            'post_id' => $this->post->id,
            'user_id' => $this->user->id,
            'status' => 'approved',
            'is_anonymous' => true
        ]);

        $response = $this->getJson("/api/posts/{$this->post->id}/comments");

        $response->assertStatus(200);
        $comments = $response->json('data.comments');
        
        $anonymousComment = collect($comments)->firstWhere('id', $comment->id);
        $this->assertTrue($anonymousComment['is_anonymous']);
        $this->assertNull($anonymousComment['user']); // User info should be hidden
    }
}

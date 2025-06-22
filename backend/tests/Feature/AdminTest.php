<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Post;
use App\Models\Comment;
use App\Models\Message;
use App\Models\Tag;
use App\Models\Faq;
use Illuminate\Support\Facades\Hash;

class AdminTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $admin;
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->admin = User::factory()->create([
            'role' => 'admin',
            'password' => Hash::make('password123'),
        ]);
        
        $this->user = User::factory()->create([
            'role' => 'user',
            'password' => Hash::make('password123'),
        ]);
    }

    /**
     * Test admin can get pending posts
     */
    public function test_admin_can_get_pending_posts(): void
    {
        Post::factory()->count(3)->create(['status' => 'pending']);
        Post::factory()->count(2)->create(['status' => 'approved']);

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->getJson('/api/admin/posts/pending');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'posts' => [
                            '*' => [
                                'id',
                                'title',
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

        $posts = $response->json('data.posts');
        $this->assertCount(3, $posts);
        foreach ($posts as $post) {
            $this->assertEquals('pending', $post['status']);
        }
    }

    /**
     * Test regular user cannot access pending posts
     */
    public function test_regular_user_cannot_access_pending_posts(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson('/api/admin/posts/pending');

        $response->assertStatus(403);
    }

    /**
     * Test admin can approve post
     */
    public function test_admin_can_approve_post(): void
    {
        $post = Post::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->putJson("/api/admin/posts/{$post->id}/approve");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Post approved successfully',
                    'data' => [
                        'post' => [
                            'id' => $post->id,
                            'status' => 'approved'
                        ]
                    ]
                ]);

        $this->assertDatabaseHas('posts', [
            'id' => $post->id,
            'status' => 'approved',
        ]);
    }

    /**
     * Test admin can reject post with note
     */
    public function test_admin_can_reject_post_with_note(): void
    {
        $post = Post::factory()->create(['status' => 'pending']);

        $rejectionData = [
            'admin_note' => 'This post violates community guidelines.',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->putJson("/api/admin/posts/{$post->id}/reject", $rejectionData);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Post rejected successfully',
                    'data' => [
                        'post' => [
                            'id' => $post->id,
                            'status' => 'rejected',
                            'admin_note' => 'This post violates community guidelines.'
                        ]
                    ]
                ]);

        $this->assertDatabaseHas('posts', [
            'id' => $post->id,
            'status' => 'rejected',
            'admin_note' => 'This post violates community guidelines.',
        ]);
    }

    /**
     * Test regular user cannot approve posts
     */
    public function test_regular_user_cannot_approve_posts(): void
    {
        $post = Post::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->putJson("/api/admin/posts/{$post->id}/approve");

        $response->assertStatus(403);
    }

    /**
     * Test admin can get pending comments
     */
    public function test_admin_can_get_pending_comments(): void
    {
        $post = Post::factory()->create(['status' => 'approved']);
        
        Comment::factory()->count(3)->create([
            'post_id' => $post->id,
            'status' => 'pending'
        ]);
        
        Comment::factory()->count(2)->create([
            'post_id' => $post->id,
            'status' => 'approved'
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->getJson('/api/admin/comments/pending');

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
                                'user',
                                'post'
                            ]
                        ],
                        'pagination'
                    ]
                ]);

        $comments = $response->json('data.comments');
        $this->assertCount(3, $comments);
        foreach ($comments as $comment) {
            $this->assertEquals('pending', $comment['status']);
        }
    }

    /**
     * Test admin can approve comment
     */
    public function test_admin_can_approve_comment(): void
    {
        $post = Post::factory()->create(['status' => 'approved']);
        $comment = Comment::factory()->create([
            'post_id' => $post->id,
            'status' => 'pending'
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->putJson("/api/admin/comments/{$comment->id}/approve");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Comment approved successfully',
                    'data' => [
                        'comment' => [
                            'id' => $comment->id,
                            'status' => 'approved'
                        ]
                    ]
                ]);

        $this->assertDatabaseHas('comments', [
            'id' => $comment->id,
            'status' => 'approved',
        ]);
    }

    /**
     * Test admin can reject comment
     */
    public function test_admin_can_reject_comment(): void
    {
        $post = Post::factory()->create(['status' => 'approved']);
        $comment = Comment::factory()->create([
            'post_id' => $post->id,
            'status' => 'pending'
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->putJson("/api/admin/comments/{$comment->id}/reject");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Comment rejected successfully',
                    'data' => [
                        'comment' => [
                            'id' => $comment->id,
                            'status' => 'rejected'
                        ]
                    ]
                ]);

        $this->assertDatabaseHas('comments', [
            'id' => $comment->id,
            'status' => 'rejected',
        ]);
    }

    /**
     * Test admin can create tags
     */
    public function test_admin_can_create_tags(): void
    {
        $tagData = [
            'name' => 'Technology',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->postJson('/api/tags', $tagData);

        $response->assertStatus(201)
                ->assertJson([
                    'success' => true,
                    'message' => 'Tag created successfully',
                    'data' => [
                        'tag' => [
                            'name' => 'Technology'
                        ]
                    ]
                ]);

        $this->assertDatabaseHas('tags', [
            'name' => 'Technology',
        ]);
    }

    /**
     * Test regular user cannot create tags
     */
    public function test_regular_user_cannot_create_tags(): void
    {
        $tagData = [
            'name' => 'Technology',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/tags', $tagData);

        $response->assertStatus(403);
    }

    /**
     * Test admin can delete tags
     */
    public function test_admin_can_delete_tags(): void
    {
        $tag = Tag::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->deleteJson("/api/tags/{$tag->id}");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Tag deleted successfully',
                ]);

        $this->assertSoftDeleted('tags', [
            'id' => $tag->id,
        ]);
    }

    /**
     * Test admin can get all messages
     */
    public function test_admin_can_get_all_messages(): void
    {
        Message::factory()->count(3)->create(['user_id' => $this->user->id]);

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->getJson('/api/admin/messages');

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
                                'user'
                            ]
                        ],
                        'pagination'
                    ]
                ]);

        $messages = $response->json('data.messages');
        $this->assertCount(3, $messages);
    }

    /**
     * Test admin can reply to message
     */
    public function test_admin_can_reply_to_message(): void
    {
        $message = Message::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'unread'
        ]);

        $replyData = [
            'content' => 'Thank you for your message. We will look into this.',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->postJson("/api/admin/messages/{$message->id}/reply", $replyData);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Reply sent successfully',
                ]);

        // Check that message status is updated
        $this->assertDatabaseHas('messages', [
            'id' => $message->id,
            'status' => 'responded',
            'to_admin_id' => $this->admin->id,
        ]);
    }

    /**
     * Test admin can create FAQs
     */
    public function test_admin_can_create_faqs(): void
    {
        $faqData = [
            'question' => 'How do I create a post?',
            'answer' => 'To create a post, click on the "Create Post" button and fill in the required fields.',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->postJson('/api/faqs', $faqData);

        $response->assertStatus(201)
                ->assertJson([
                    'success' => true,
                    'message' => 'FAQ created successfully',
                    'data' => [
                        'faq' => [
                            'question' => 'How do I create a post?',
                            'answer' => 'To create a post, click on the "Create Post" button and fill in the required fields.'
                        ]
                    ]
                ]);

        $this->assertDatabaseHas('faqs', [
            'question' => 'How do I create a post?',
            'answer' => 'To create a post, click on the "Create Post" button and fill in the required fields.',
        ]);
    }

    /**
     * Test admin can update FAQs
     */
    public function test_admin_can_update_faqs(): void
    {
        $faq = Faq::factory()->create();

        $updateData = [
            'question' => 'Updated question?',
            'answer' => 'Updated answer.',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->putJson("/api/faqs/{$faq->id}", $updateData);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'FAQ updated successfully',
                    'data' => [
                        'faq' => [
                            'question' => 'Updated question?',
                            'answer' => 'Updated answer.'
                        ]
                    ]
                ]);

        $this->assertDatabaseHas('faqs', [
            'id' => $faq->id,
            'question' => 'Updated question?',
            'answer' => 'Updated answer.',
        ]);
    }

    /**
     * Test admin can delete FAQs
     */
    public function test_admin_can_delete_faqs(): void
    {
        $faq = Faq::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->deleteJson("/api/faqs/{$faq->id}");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'FAQ deleted successfully',
                ]);

        $this->assertSoftDeleted('faqs', [
            'id' => $faq->id,
        ]);
    }

    /**
     * Test regular user cannot create FAQs
     */
    public function test_regular_user_cannot_create_faqs(): void
    {
        $faqData = [
            'question' => 'Test question?',
            'answer' => 'Test answer.',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/faqs', $faqData);

        $response->assertStatus(403);
    }

    /**
     * Test unauthenticated user cannot access admin endpoints
     */
    public function test_unauthenticated_user_cannot_access_admin_endpoints(): void
    {
        $endpoints = [
            'GET /api/admin/posts/pending',
            'GET /api/admin/comments/pending',
            'GET /api/admin/messages',
            'POST /api/tags',
            'POST /api/faqs',
        ];

        foreach ($endpoints as $endpoint) {
            [$method, $url] = explode(' ', $endpoint);
            
            $response = $this->json($method, $url);
            $response->assertStatus(401);
        }
    }

    /**
     * Test admin can filter pending posts by date
     */
    public function test_admin_can_filter_pending_posts_by_date(): void
    {
        Post::factory()->create([
            'status' => 'pending',
            'created_at' => now()->subDays(2)
        ]);
        
        Post::factory()->create([
            'status' => 'pending',
            'created_at' => now()
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->getJson('/api/admin/posts/pending?from=' . now()->subDay()->toDateString());

        $response->assertStatus(200);
        $posts = $response->json('data.posts');
        $this->assertCount(1, $posts);
    }

    /**
     * Test admin can search pending posts
     */
    public function test_admin_can_search_pending_posts(): void
    {
        Post::factory()->create([
            'title' => 'Laravel Tutorial',
            'status' => 'pending'
        ]);
        
        Post::factory()->create([
            'title' => 'Vue.js Guide',
            'status' => 'pending'
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->getJson('/api/admin/posts/pending?search=Laravel');

        $response->assertStatus(200);
        $posts = $response->json('data.posts');
        $this->assertCount(1, $posts);
        $this->assertStringContainsString('Laravel', $posts[0]['title']);
    }

    /**
     * Test admin moderation actions create notifications
     */
    public function test_admin_moderation_creates_notifications(): void
    {
        $post = Post::factory()->create([
            'status' => 'pending',
            'user_id' => $this->user->id
        ]);

        $this->actingAs($this->admin, 'sanctum')
             ->putJson("/api/admin/posts/{$post->id}/approve");

        // Check that notification was created for the user
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->user->id,
            'type' => 'post_approved',
        ]);
    }
}

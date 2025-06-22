<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Post;
use App\Models\Tag;
use Illuminate\Support\Facades\Hash;

class PostTest extends TestCase
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
     * Test getting list of posts (public endpoint)
     */
    public function test_can_get_posts_list(): void
    {
        // Create some approved posts
        Post::factory()->count(3)->create(['status' => 'approved']);
        Post::factory()->count(2)->create(['status' => 'pending']);

        $response = $this->getJson('/api/posts');

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
                                'like_count',
                                'comment_count',
                                'created_at',
                                'user',
                                'tags'
                            ]
                        ],
                        'pagination'
                    ]
                ]);

        // Should only return approved posts
        $posts = $response->json('data.posts');
        $this->assertCount(3, $posts);
        foreach ($posts as $post) {
            $this->assertEquals('approved', $post['status']);
        }
    }

    /**
     * Test getting single post (public endpoint)
     */
    public function test_can_get_single_post(): void
    {
        $post = Post::factory()->create(['status' => 'approved']);

        $response = $this->getJson("/api/posts/{$post->id}");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'post' => [
                            'id',
                            'title',
                            'content',
                            'status',
                            'is_anonymous',
                            'like_count',
                            'comment_count',
                            'created_at',
                            'user',
                            'tags'
                        ]
                    ]
                ])
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'post' => [
                            'id' => $post->id,
                            'title' => $post->title,
                        ]
                    ]
                ]);
    }

    /**
     * Test cannot get pending post as regular user
     */
    public function test_cannot_get_pending_post(): void
    {
        $post = Post::factory()->create(['status' => 'pending']);

        $response = $this->getJson("/api/posts/{$post->id}");

        $response->assertStatus(404);
    }

    /**
     * Test authenticated user can create post
     */
    public function test_authenticated_user_can_create_post(): void
    {
        $tag = Tag::factory()->create();
        
        $postData = [
            'title' => 'Test Post Title',
            'content' => 'This is the content of the test post.',
            'is_anonymous' => false,
            'tags' => [$tag->id]
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/posts', $postData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => [
                        'post' => [
                            'id',
                            'title',
                            'content',
                            'status',
                            'is_anonymous',
                            'created_at'
                        ]
                    ]
                ])
                ->assertJson([
                    'success' => true,
                    'message' => 'Post created successfully',
                    'data' => [
                        'post' => [
                            'title' => 'Test Post Title',
                            'content' => 'This is the content of the test post.',
                            'status' => 'pending',
                            'is_anonymous' => false,
                        ]
                    ]
                ]);

        $this->assertDatabaseHas('posts', [
            'title' => 'Test Post Title',
            'content' => 'This is the content of the test post.',
            'user_id' => $this->user->id,
            'status' => 'pending',
            'is_anonymous' => false,
        ]);
    }

    /**
     * Test user can create anonymous post
     */
    public function test_user_can_create_anonymous_post(): void
    {
        $postData = [
            'title' => 'Anonymous Post',
            'content' => 'This is an anonymous post.',
            'is_anonymous' => true,
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/posts', $postData);

        $response->assertStatus(201)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'post' => [
                            'is_anonymous' => true,
                        ]
                    ]
                ]);

        $this->assertDatabaseHas('posts', [
            'title' => 'Anonymous Post',
            'is_anonymous' => true,
        ]);
    }

    /**
     * Test post creation validation
     */
    public function test_post_creation_validation(): void
    {
        $postData = [
            'title' => '', // Required field empty
            'content' => '', // Required field empty
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/posts', $postData);

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
     * Test user can update own post
     */
    public function test_user_can_update_own_post(): void
    {
        $post = Post::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'pending'
        ]);

        $updateData = [
            'title' => 'Updated Post Title',
            'content' => 'Updated post content.',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->putJson("/api/posts/{$post->id}", $updateData);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Post updated successfully',
                    'data' => [
                        'post' => [
                            'title' => 'Updated Post Title',
                            'content' => 'Updated post content.',
                        ]
                    ]
                ]);

        $this->assertDatabaseHas('posts', [
            'id' => $post->id,
            'title' => 'Updated Post Title',
            'content' => 'Updated post content.',
        ]);
    }

    /**
     * Test user cannot update other user's post
     */
    public function test_user_cannot_update_other_users_post(): void
    {
        $otherUser = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $otherUser->id]);

        $updateData = [
            'title' => 'Hacked Title',
            'content' => 'Hacked content.',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->putJson("/api/posts/{$post->id}", $updateData);

        $response->assertStatus(403);
    }

    /**
     * Test user can delete own post
     */
    public function test_user_can_delete_own_post(): void
    {
        $post = Post::factory()->create([
            'user_id' => $this->user->id,
            'status' => 'pending'
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->deleteJson("/api/posts/{$post->id}");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Post deleted successfully',
                ]);

        $this->assertSoftDeleted('posts', [
            'id' => $post->id,
        ]);
    }

    /**
     * Test user cannot delete other user's post
     */
    public function test_user_cannot_delete_other_users_post(): void
    {
        $otherUser = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->deleteJson("/api/posts/{$post->id}");

        $response->assertStatus(403);
    }

    /**
     * Test posts can be filtered by status
     */
    public function test_posts_can_be_filtered_by_status(): void
    {
        Post::factory()->count(2)->create(['status' => 'approved']);
        Post::factory()->count(3)->create(['status' => 'pending']);

        $response = $this->getJson('/api/posts?status=approved');

        $response->assertStatus(200);
        $posts = $response->json('data.posts');
        $this->assertCount(2, $posts);
    }

    /**
     * Test posts can be filtered by tags
     */
    public function test_posts_can_be_filtered_by_tags(): void
    {
        $tag1 = Tag::factory()->create(['name' => 'technology']);
        $tag2 = Tag::factory()->create(['name' => 'health']);
        
        $post1 = Post::factory()->create(['status' => 'approved']);
        $post2 = Post::factory()->create(['status' => 'approved']);
        
        $post1->tags()->attach($tag1);
        $post2->tags()->attach($tag2);

        $response = $this->getJson("/api/posts?tags={$tag1->id}");

        $response->assertStatus(200);
        $posts = $response->json('data.posts');
        $this->assertCount(1, $posts);
        $this->assertEquals($post1->id, $posts[0]['id']);
    }

    /**
     * Test posts can be searched by title and content
     */
    public function test_posts_can_be_searched(): void
    {
        Post::factory()->create([
            'title' => 'Laravel Tutorial',
            'content' => 'Learn Laravel framework',
            'status' => 'approved'
        ]);
        
        Post::factory()->create([
            'title' => 'Vue.js Guide',
            'content' => 'Frontend development with Vue',
            'status' => 'approved'
        ]);

        $response = $this->getJson('/api/posts?search=Laravel');

        $response->assertStatus(200);
        $posts = $response->json('data.posts');
        $this->assertCount(1, $posts);
        $this->assertStringContainsString('Laravel', $posts[0]['title']);
    }

    /**
     * Test unauthenticated user cannot create post
     */
    public function test_unauthenticated_user_cannot_create_post(): void
    {
        $postData = [
            'title' => 'Test Post',
            'content' => 'Test content',
        ];

        $response = $this->postJson('/api/posts', $postData);

        $response->assertStatus(401);
    }

    /**
     * Test post pagination
     */
    public function test_posts_are_paginated(): void
    {
        Post::factory()->count(25)->create(['status' => 'approved']);

        $response = $this->getJson('/api/posts?per_page=10');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        'posts',
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
}

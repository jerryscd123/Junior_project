<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Post;
use App\Models\Like;
use Illuminate\Support\Facades\Hash;

class LikeTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;
    protected $otherUser;
    protected $post;

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

        $this->post = Post::factory()->create([
            'status' => 'approved',
            'user_id' => $this->user->id
        ]);
    }

    /**
     * Test getting likes for a post (public endpoint)
     */
    public function test_can_get_post_likes(): void
    {
        // Create some likes for the post
        Like::factory()->count(3)->create(['post_id' => $this->post->id]);

        $response = $this->getJson("/api/posts/{$this->post->id}/likes");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'likes' => [
                            '*' => [
                                'id',
                                'user_id',
                                'post_id',
                                'created_at',
                                'user'
                            ]
                        ],
                        'total_likes'
                    ]
                ])
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'total_likes' => 3
                    ]
                ]);

        $likes = $response->json('data.likes');
        $this->assertCount(3, $likes);
    }

    /**
     * Test authenticated user can like a post
     */
    public function test_authenticated_user_can_like_post(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson("/api/posts/{$this->post->id}/like");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Post liked successfully',
                    'data' => [
                        'liked' => true,
                        'total_likes' => 1
                    ]
                ]);

        $this->assertDatabaseHas('likes', [
            'user_id' => $this->user->id,
            'post_id' => $this->post->id,
        ]);

        // Check that post like_count is updated
        $this->post->refresh();
        $this->assertEquals(1, $this->post->like_count);
    }

    /**
     * Test authenticated user can unlike a post
     */
    public function test_authenticated_user_can_unlike_post(): void
    {
        // First like the post
        Like::factory()->create([
            'user_id' => $this->user->id,
            'post_id' => $this->post->id
        ]);
        
        // Update post like count
        $this->post->update(['like_count' => 1]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson("/api/posts/{$this->post->id}/unlike");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Post unliked successfully',
                    'data' => [
                        'liked' => false,
                        'total_likes' => 0
                    ]
                ]);

        $this->assertDatabaseMissing('likes', [
            'user_id' => $this->user->id,
            'post_id' => $this->post->id,
        ]);

        // Check that post like_count is updated
        $this->post->refresh();
        $this->assertEquals(0, $this->post->like_count);
    }

    /**
     * Test user cannot like the same post twice
     */
    public function test_user_cannot_like_same_post_twice(): void
    {
        // First like
        $this->actingAs($this->user, 'sanctum')
             ->postJson("/api/posts/{$this->post->id}/like");

        // Try to like again
        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson("/api/posts/{$this->post->id}/like");

        $response->assertStatus(400)
                ->assertJson([
                    'success' => false,
                    'message' => 'Post already liked',
                ]);

        // Should still have only one like
        $this->assertEquals(1, Like::where('post_id', $this->post->id)->count());
    }

    /**
     * Test user cannot unlike a post they haven't liked
     */
    public function test_user_cannot_unlike_post_not_liked(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson("/api/posts/{$this->post->id}/unlike");

        $response->assertStatus(400)
                ->assertJson([
                    'success' => false,
                    'message' => 'Post not liked yet',
                ]);
    }

    /**
     * Test unauthenticated user cannot like a post
     */
    public function test_unauthenticated_user_cannot_like_post(): void
    {
        $response = $this->postJson("/api/posts/{$this->post->id}/like");

        $response->assertStatus(401);
    }

    /**
     * Test unauthenticated user cannot unlike a post
     */
    public function test_unauthenticated_user_cannot_unlike_post(): void
    {
        $response = $this->postJson("/api/posts/{$this->post->id}/unlike");

        $response->assertStatus(401);
    }

    /**
     * Test cannot like non-existent post
     */
    public function test_cannot_like_non_existent_post(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson('/api/posts/999999/like');

        $response->assertStatus(404);
    }

    /**
     * Test cannot like pending post
     */
    public function test_cannot_like_pending_post(): void
    {
        $pendingPost = Post::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson("/api/posts/{$pendingPost->id}/like");

        $response->assertStatus(403)
                ->assertJson([
                    'success' => false,
                    'message' => 'Cannot like pending post',
                ]);
    }

    /**
     * Test cannot like rejected post
     */
    public function test_cannot_like_rejected_post(): void
    {
        $rejectedPost = Post::factory()->create(['status' => 'rejected']);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson("/api/posts/{$rejectedPost->id}/like");

        $response->assertStatus(403)
                ->assertJson([
                    'success' => false,
                    'message' => 'Cannot like rejected post',
                ]);
    }

    /**
     * Test multiple users can like the same post
     */
    public function test_multiple_users_can_like_same_post(): void
    {
        // User 1 likes the post
        $this->actingAs($this->user, 'sanctum')
             ->postJson("/api/posts/{$this->post->id}/like");

        // User 2 likes the post
        $this->actingAs($this->otherUser, 'sanctum')
             ->postJson("/api/posts/{$this->post->id}/like");

        $this->assertEquals(2, Like::where('post_id', $this->post->id)->count());
        
        $this->post->refresh();
        $this->assertEquals(2, $this->post->like_count);
    }

    /**
     * Test like status is returned correctly for authenticated user
     */
    public function test_like_status_returned_for_authenticated_user(): void
    {
        // Like the post
        Like::factory()->create([
            'user_id' => $this->user->id,
            'post_id' => $this->post->id
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
                         ->getJson("/api/posts/{$this->post->id}");

        $response->assertStatus(200)
                ->assertJsonPath('data.post.is_liked_by_user', true);
    }

    /**
     * Test like status is false for unauthenticated user
     */
    public function test_like_status_false_for_unauthenticated_user(): void
    {
        $response = $this->getJson("/api/posts/{$this->post->id}");

        $response->assertStatus(200)
                ->assertJsonPath('data.post.is_liked_by_user', false);
    }

    /**
     * Test getting likes with user information
     */
    public function test_get_likes_with_user_information(): void
    {
        $like = Like::factory()->create([
            'post_id' => $this->post->id,
            'user_id' => $this->user->id
        ]);

        $response = $this->getJson("/api/posts/{$this->post->id}/likes");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        'likes' => [
                            '*' => [
                                'id',
                                'user_id',
                                'post_id',
                                'created_at',
                                'user' => [
                                    'id',
                                    'name',
                                    'avatar'
                                ]
                            ]
                        ]
                    ]
                ]);

        $likes = $response->json('data.likes');
        $this->assertEquals($this->user->id, $likes[0]['user']['id']);
        $this->assertEquals($this->user->name, $likes[0]['user']['name']);
    }

    /**
     * Test likes are ordered by creation date
     */
    public function test_likes_are_ordered_by_creation_date(): void
    {
        $like1 = Like::factory()->create([
            'post_id' => $this->post->id,
            'created_at' => now()->subHours(2)
        ]);

        $like2 = Like::factory()->create([
            'post_id' => $this->post->id,
            'created_at' => now()->subHour()
        ]);

        $response = $this->getJson("/api/posts/{$this->post->id}/likes");

        $response->assertStatus(200);
        $likes = $response->json('data.likes');
        
        // Should be ordered by newest first
        $this->assertEquals($like2->id, $likes[0]['id']);
        $this->assertEquals($like1->id, $likes[1]['id']);
    }

    /**
     * Test like count is updated correctly
     */
    public function test_like_count_updated_correctly(): void
    {
        $this->assertEquals(0, $this->post->like_count);

        // Add first like
        $this->actingAs($this->user, 'sanctum')
             ->postJson("/api/posts/{$this->post->id}/like");

        $this->post->refresh();
        $this->assertEquals(1, $this->post->like_count);

        // Add second like
        $this->actingAs($this->otherUser, 'sanctum')
             ->postJson("/api/posts/{$this->post->id}/like");

        $this->post->refresh();
        $this->assertEquals(2, $this->post->like_count);

        // Remove first like
        $this->actingAs($this->user, 'sanctum')
             ->postJson("/api/posts/{$this->post->id}/unlike");

        $this->post->refresh();
        $this->assertEquals(1, $this->post->like_count);
    }
}

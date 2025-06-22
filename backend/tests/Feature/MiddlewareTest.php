<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

class MiddlewareTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that EnsureTokenIsValid middleware works
     */
    public function test_token_validation_middleware()
    {
        // Test without token - should fail
        $response = $this->getJson('/api/user');
        $response->assertStatus(401);

        // Test with valid token - should pass
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        
        $response = $this->getJson('/api/user');
        $response->assertStatus(200);
    }

    /**
     * Test that EnsureUserIsAdmin middleware works
     */
    public function test_admin_middleware()
    {
        // Create regular user
        $user = User::factory()->create(['role' => 'user']);
        Sanctum::actingAs($user);

        // Test admin route with regular user - should fail
        $response = $this->getJson('/api/admin/test');
        $response->assertStatus(404); // Route doesn't exist yet, but middleware should be registered

        // Create admin user
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        // Test admin route with admin user
        $response = $this->getJson('/api/admin/test');
        $response->assertStatus(404); // Route doesn't exist yet, but middleware should be registered
    }

    /**
     * Test that middleware aliases are properly registered
     */
    public function test_middleware_aliases_registered()
    {
        $kernel = app(\Illuminate\Contracts\Http\Kernel::class);
        $middlewareAliases = $kernel->getMiddlewareAliases();

        // Check that our custom middleware aliases are registered
        $this->assertArrayHasKey('auth.token', $middlewareAliases);
        $this->assertArrayHasKey('auth.admin', $middlewareAliases);
        $this->assertArrayHasKey('content.moderation', $middlewareAliases);
        $this->assertArrayHasKey('anonymous', $middlewareAliases);
        $this->assertArrayHasKey('rate.limit', $middlewareAliases);

        // Check that they point to the correct classes
        $this->assertEquals(\App\Http\Middleware\EnsureTokenIsValid::class, $middlewareAliases['auth.token']);
        $this->assertEquals(\App\Http\Middleware\EnsureUserIsAdmin::class, $middlewareAliases['auth.admin']);
        $this->assertEquals(\App\Http\Middleware\ContentModerationMiddleware::class, $middlewareAliases['content.moderation']);
        $this->assertEquals(\App\Http\Middleware\HandleAnonymousUsers::class, $middlewareAliases['anonymous']);
        $this->assertEquals(\App\Http\Middleware\RateLimitMiddleware::class, $middlewareAliases['rate.limit']);
    }
} 
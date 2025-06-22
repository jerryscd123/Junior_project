<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;

class AuthTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    /**
     * Test user registration with valid data
     */
    public function test_user_can_register_with_valid_data(): void
    {
        $userData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'bio' => 'This is my bio',
            'is_anonymous' => false,
        ];

        $response = $this->postJson('/api/register', $userData);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => [
                        'user' => [
                            'id',
                            'name',
                            'email',
                            'avatar',
                            'bio',
                            'is_anonymous',
                            'role',
                            'created_at',
                        ],
                        'token'
                    ]
                ])
                ->assertJson([
                    'success' => true,
                    'message' => 'User registered successfully',
                ]);

        $this->assertDatabaseHas('users', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'bio' => 'This is my bio',
            'is_anonymous' => false,
            'role' => 'user',
        ]);
    }

    /**
     * Test user registration with avatar upload
     */
    public function test_user_can_register_with_avatar(): void
    {
        $avatar = UploadedFile::fake()->image('avatar.jpg', 200, 200);

        $userData = [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'avatar' => $avatar,
        ];

        $response = $this->postJson('/api/register', $userData);

        // Debug: Print response if it fails
        if ($response->status() !== 200) {
            dump('Response status: ' . $response->status());
            dump('Response content: ' . $response->content());
        }

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => [
                        'user' => [
                            'id',
                            'name',
                            'email',
                            'avatar',
                            'bio',
                            'is_anonymous',
                            'role',
                            'created_at',
                        ],
                        'token'
                    ]
                ]);

        $user = User::where('email', 'jane@example.com')->first();
        $this->assertNotNull($user->avatar);
        Storage::disk('public')->assertExists($user->avatar);
    }

    /**
     * Test user registration validation errors
     */
    public function test_user_registration_validation_errors(): void
    {
        $userData = [
            'name' => '', // Required field empty
            'email' => 'invalid-email', // Invalid email format
            'password' => '123', // Too short password
            'password_confirmation' => 'different', // Doesn't match password
        ];

        $response = $this->postJson('/api/register', $userData);

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
     * Test user login with valid credentials
     */
    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('Password123!'),
        ]);

        $loginData = [
            'email' => 'test@example.com',
            'password' => 'Password123!',
        ];

        $response = $this->postJson('/api/login', $loginData);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => [
                        'user' => [
                            'id',
                            'name',
                            'email',
                            'avatar',
                            'bio',
                            'is_anonymous',
                            'role',
                            'created_at',
                        ],
                        'token'
                    ]
                ])
                ->assertJson([
                    'success' => true,
                    'message' => 'Login successful',
                ]);
    }

    /**
     * Test user login with invalid credentials
     */
    public function test_user_cannot_login_with_invalid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('Password123!'),
        ]);

        $loginData = [
            'email' => 'test@example.com',
            'password' => 'WrongPassword',
        ];

        $response = $this->postJson('/api/login', $loginData);

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
     * Test user logout
     */
    public function test_user_can_logout(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/logout');

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Logged out successfully',
                ]);

        // Verify token is deleted
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $user->id,
        ]);
    }

    /**
     * Test get user profile
     */
    public function test_user_can_get_profile(): void
    {
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'bio' => 'Test bio',
        ]);
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/user/profile');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => [
                        'id',
                        'name',
                        'email',
                        'avatar',
                        'bio',
                        'is_anonymous',
                        'role',
                        'created_at',
                        'updated_at',
                        'posts_count',
                        'comments_count',
                        'likes_count',
                    ]
                ])
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'name' => 'Test User',
                        'email' => 'test@example.com',
                        'bio' => 'Test bio',
                    ]
                ]);
    }

    /**
     * Test update user profile
     */
    public function test_user_can_update_profile(): void
    {
        $user = User::factory()->create([
            'name' => 'Old Name',
            'bio' => 'Old bio',
        ]);
        $token = $user->createToken('test-token')->plainTextToken;

        $updateData = [
            'name' => 'New Name',
            'bio' => 'New bio',
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->putJson('/api/user/profile', $updateData);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => [
                        'id',
                        'name',
                        'email',
                        'avatar',
                        'bio',
                        'is_anonymous',
                        'role',
                        'updated_at',
                    ]
                ])
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'name' => 'New Name',
                        'bio' => 'New bio',
                    ]
                ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'New Name',
            'bio' => 'New bio',
        ]);
    }

    /**
     * Test update profile with password change
     */
    public function test_user_can_update_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('OldPassword123!'),
        ]);
        $token = $user->createToken('test-token')->plainTextToken;

        $updateData = [
            'current_password' => 'OldPassword123!',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->putJson('/api/user/profile', $updateData);

        $response->assertStatus(200);

        // Verify password was changed
        $user->refresh();
        $this->assertTrue(Hash::check('NewPassword123!', $user->password));
    }

    /**
     * Test get user settings
     */
    public function test_user_can_get_settings(): void
    {
        $user = User::factory()->create([
            'is_anonymous' => true,
        ]);
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/user/settings');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => [
                        'id',
                        'name',
                        'email',
                        'is_anonymous',
                        'role',
                        'email_verified_at',
                        'created_at',
                        'updated_at',
                        'preferences' => [
                            'notifications_enabled',
                            'email_notifications',
                            'privacy_mode',
                        ]
                    ]
                ])
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'is_anonymous' => true,
                        'preferences' => [
                            'privacy_mode' => true,
                        ]
                    ]
                ]);
    }

    /**
     * Test update user settings
     */
    public function test_user_can_update_settings(): void
    {
        $user = User::factory()->create([
            'is_anonymous' => false,
        ]);
        $token = $user->createToken('test-token')->plainTextToken;

        $updateData = [
            'is_anonymous' => true,
            'preferences' => [
                'notifications_enabled' => false,
                'email_notifications' => false,
                'privacy_mode' => true,
            ]
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->putJson('/api/user/settings', $updateData);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'is_anonymous' => true,
                        'preferences' => [
                            'notifications_enabled' => false,
                            'email_notifications' => false,
                            'privacy_mode' => true,
                        ]
                    ]
                ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'is_anonymous' => true,
        ]);
    }

    /**
     * Test unauthorized access to protected routes
     */
    public function test_unauthorized_access_to_protected_routes(): void
    {
        $protectedRoutes = [
            ['method' => 'post', 'uri' => '/api/logout'],
            ['method' => 'get', 'uri' => '/api/user/profile'],
            ['method' => 'put', 'uri' => '/api/user/profile'],
            ['method' => 'get', 'uri' => '/api/user/settings'],
            ['method' => 'put', 'uri' => '/api/user/settings'],
        ];

        foreach ($protectedRoutes as $route) {
            $response = $this->{$route['method'] . 'Json'}($route['uri']);
            $response->assertStatus(401);
        }
    }
} 
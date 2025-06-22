<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Faq;
use Illuminate\Support\Facades\Hash;

class FaqTest extends TestCase
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
     * Test public can get FAQs list
     */
    public function test_public_can_get_faqs_list(): void
    {
        Faq::factory()->count(5)->create();

        $response = $this->getJson('/api/faqs');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'faqs' => [
                            '*' => [
                                'id',
                                'question',
                                'answer',
                                'created_at'
                            ]
                        ],
                        'pagination'
                    ]
                ]);

        $faqs = $response->json('data.faqs');
        $this->assertCount(5, $faqs);
    }

    /**
     * Test admin can create FAQ
     */
    public function test_admin_can_create_faq(): void
    {
        $faqData = [
            'question' => 'How do I create a post?',
            'answer' => 'To create a post, click on the "Create Post" button and fill in the required fields.',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->postJson('/api/faqs', $faqData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => [
                        'faq' => [
                            'id',
                            'question',
                            'answer',
                            'created_at'
                        ]
                    ]
                ])
                ->assertJson([
                    'success' => true,
                    'message' => 'FAQ created successfully',
                    'data' => [
                        'faq' => [
                            'question' => 'How do I create a post?',
                            'answer' => 'To create a post, click on the "Create Post" button and fill in the required fields.',
                        ]
                    ]
                ]);

        $this->assertDatabaseHas('faqs', [
            'question' => 'How do I create a post?',
            'answer' => 'To create a post, click on the "Create Post" button and fill in the required fields.',
        ]);
    }

    /**
     * Test regular user cannot create FAQ
     */
    public function test_regular_user_cannot_create_faq(): void
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
     * Test unauthenticated user cannot create FAQ
     */
    public function test_unauthenticated_user_cannot_create_faq(): void
    {
        $faqData = [
            'question' => 'Test question?',
            'answer' => 'Test answer.',
        ];

        $response = $this->postJson('/api/faqs', $faqData);

        $response->assertStatus(401);
    }

    /**
     * Test FAQ creation validation
     */
    public function test_faq_creation_validation(): void
    {
        $faqData = [
            'question' => '', // Required field empty
            'answer' => '', // Required field empty
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->postJson('/api/faqs', $faqData);

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
     * Test admin can update FAQ
     */
    public function test_admin_can_update_faq(): void
    {
        $faq = Faq::factory()->create();

        $updateData = [
            'question' => 'Updated question?',
            'answer' => 'Updated answer with more details.',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->putJson("/api/faqs/{$faq->id}", $updateData);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'FAQ updated successfully',
                    'data' => [
                        'faq' => [
                            'id' => $faq->id,
                            'question' => 'Updated question?',
                            'answer' => 'Updated answer with more details.',
                        ]
                    ]
                ]);

        $this->assertDatabaseHas('faqs', [
            'id' => $faq->id,
            'question' => 'Updated question?',
            'answer' => 'Updated answer with more details.',
        ]);
    }

    /**
     * Test regular user cannot update FAQ
     */
    public function test_regular_user_cannot_update_faq(): void
    {
        $faq = Faq::factory()->create();

        $updateData = [
            'question' => 'Hacked question?',
            'answer' => 'Hacked answer.',
        ];

        $response = $this->actingAs($this->user, 'sanctum')
                         ->putJson("/api/faqs/{$faq->id}", $updateData);

        $response->assertStatus(403);
    }

    /**
     * Test admin can delete FAQ
     */
    public function test_admin_can_delete_faq(): void
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
     * Test regular user cannot delete FAQ
     */
    public function test_regular_user_cannot_delete_faq(): void
    {
        $faq = Faq::factory()->create();

        $response = $this->actingAs($this->user, 'sanctum')
                         ->deleteJson("/api/faqs/{$faq->id}");

        $response->assertStatus(403);
    }

    /**
     * Test FAQs can be searched
     */
    public function test_faqs_can_be_searched(): void
    {
        Faq::factory()->create([
            'question' => 'How to create a post?',
            'answer' => 'Click the create button and fill the form.'
        ]);
        
        Faq::factory()->create([
            'question' => 'How to delete my account?',
            'answer' => 'Go to settings and click delete account.'
        ]);

        $response = $this->getJson('/api/faqs?search=create');

        $response->assertStatus(200);
        $faqs = $response->json('data.faqs');
        $this->assertCount(1, $faqs);
        $this->assertStringContainsString('create', strtolower($faqs[0]['question']));
    }

    /**
     * Test FAQs search in both question and answer
     */
    public function test_faqs_search_in_question_and_answer(): void
    {
        Faq::factory()->create([
            'question' => 'General question?',
            'answer' => 'This answer contains the word posting.'
        ]);
        
        Faq::factory()->create([
            'question' => 'How to make a posting?',
            'answer' => 'Simple answer here.'
        ]);

        $response = $this->getJson('/api/faqs?search=posting');

        $response->assertStatus(200);
        $faqs = $response->json('data.faqs');
        $this->assertCount(2, $faqs);
    }

    /**
     * Test FAQs are paginated
     */
    public function test_faqs_are_paginated(): void
    {
        Faq::factory()->count(25)->create();

        $response = $this->getJson('/api/faqs?per_page=10');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        'faqs',
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
     * Test FAQs are ordered by creation date
     */
    public function test_faqs_are_ordered_by_creation_date(): void
    {
        $faq1 = Faq::factory()->create([
            'created_at' => now()->subHours(2)
        ]);

        $faq2 = Faq::factory()->create([
            'created_at' => now()->subHour()
        ]);

        $response = $this->getJson('/api/faqs');

        $response->assertStatus(200);
        $faqs = $response->json('data.faqs');
        
        // Should be ordered by newest first
        $this->assertEquals($faq2->id, $faqs[0]['id']);
        $this->assertEquals($faq1->id, $faqs[1]['id']);
    }

    /**
     * Test getting single FAQ
     */
    public function test_can_get_single_faq(): void
    {
        $faq = Faq::factory()->create();

        $response = $this->getJson("/api/faqs/{$faq->id}");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'faq' => [
                            'id',
                            'question',
                            'answer',
                            'created_at'
                        ]
                    ]
                ])
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'faq' => [
                            'id' => $faq->id,
                            'question' => $faq->question,
                            'answer' => $faq->answer,
                        ]
                    ]
                ]);
    }

    /**
     * Test getting non-existent FAQ
     */
    public function test_getting_non_existent_faq(): void
    {
        $response = $this->getJson('/api/faqs/999999');

        $response->assertStatus(404);
    }

    /**
     * Test updating non-existent FAQ
     */
    public function test_updating_non_existent_faq(): void
    {
        $updateData = [
            'question' => 'Updated question?',
            'answer' => 'Updated answer.',
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->putJson('/api/faqs/999999', $updateData);

        $response->assertStatus(404);
    }

    /**
     * Test deleting non-existent FAQ
     */
    public function test_deleting_non_existent_faq(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
                         ->deleteJson('/api/faqs/999999');

        $response->assertStatus(404);
    }

    /**
     * Test FAQ update validation
     */
    public function test_faq_update_validation(): void
    {
        $faq = Faq::factory()->create();

        $updateData = [
            'question' => '', // Required field empty
            'answer' => '', // Required field empty
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->putJson("/api/faqs/{$faq->id}", $updateData);

        $response->assertStatus(422)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'errors'
                ]);
    }

    /**
     * Test empty FAQ list
     */
    public function test_empty_faq_list(): void
    {
        $response = $this->getJson('/api/faqs');

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'faqs' => []
                    ]
                ]);
    }

    /**
     * Test FAQ search with no results
     */
    public function test_faq_search_with_no_results(): void
    {
        Faq::factory()->count(3)->create();

        $response = $this->getJson('/api/faqs?search=nonexistentterm');

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'faqs' => []
                    ]
                ]);
    }

    /**
     * Test FAQ case insensitive search
     */
    public function test_faq_case_insensitive_search(): void
    {
        Faq::factory()->create([
            'question' => 'How to Create a Post?',
            'answer' => 'Simple instructions here.'
        ]);

        // Search with different cases
        $searchTerms = ['create', 'CREATE', 'Create', 'CrEaTe'];

        foreach ($searchTerms as $term) {
            $response = $this->getJson("/api/faqs?search={$term}");
            
            $response->assertStatus(200);
            $faqs = $response->json('data.faqs');
            $this->assertCount(1, $faqs);
        }
    }

    /**
     * Test FAQ content length
     */
    public function test_faq_content_length(): void
    {
        $longQuestion = str_repeat('This is a very long question. ', 50);
        $longAnswer = str_repeat('This is a very long answer with lots of details. ', 100);

        $faqData = [
            'question' => $longQuestion,
            'answer' => $longAnswer,
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
                         ->postJson('/api/faqs', $faqData);

        $response->assertStatus(201);

        $this->assertDatabaseHas('faqs', [
            'question' => $longQuestion,
            'answer' => $longAnswer,
        ]);
    }
}

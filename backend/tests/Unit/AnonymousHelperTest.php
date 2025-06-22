<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Utils\AnonymousHelper;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Cache;

class AnonymousHelperTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        
        // Mock Session and Cache facades
        Session::shouldReceive('get')->andReturn(null)->byDefault();
        Session::shouldReceive('put')->andReturn(true)->byDefault();
        Cache::shouldReceive('get')->andReturn(null)->byDefault();
        Cache::shouldReceive('put')->andReturn(true)->byDefault();
        Cache::shouldReceive('forget')->andReturn(true)->byDefault();
    }

    /**
     * Test anonymous ID generation
     */
    public function test_generate_anonymous_id(): void
    {
        $id1 = AnonymousHelper::generateAnonymousId();
        $id2 = AnonymousHelper::generateAnonymousId();
        
        // Should be strings
        $this->assertIsString($id1);
        $this->assertIsString($id2);
        
        // Should be unique
        $this->assertNotEquals($id1, $id2);
        
        // Should have expected format: anon_[16chars]_[timestamp]
        $this->assertStringStartsWith('anon_', $id1);
        $this->assertStringStartsWith('anon_', $id2);
        
        // Should contain underscores
        $this->assertStringContainsString('_', $id1);
        $this->assertStringContainsString('_', $id2);
        
        // Should be reasonable length
        $this->assertGreaterThan(20, strlen($id1));
        $this->assertLessThan(50, strlen($id1));
    }

    /**
     * Test session anonymous ID management
     */
    public function test_get_session_anonymous_id(): void
    {
        // Test when no session ID exists
        Session::shouldReceive('get')
               ->with('anonymous_user_id')
               ->once()
               ->andReturn(null);
        
        Session::shouldReceive('put')
               ->with('anonymous_user_id', \Mockery::type('string'))
               ->once()
               ->andReturn(true);
        
        $id1 = AnonymousHelper::getSessionAnonymousId();
        $this->assertIsString($id1);
        $this->assertStringStartsWith('anon_', $id1);
        
        // Test when session ID exists
        $existingId = 'anon_existing123_1234567890';
        Session::shouldReceive('get')
               ->with('anonymous_user_id')
               ->once()
               ->andReturn($existingId);
        
        $id2 = AnonymousHelper::getSessionAnonymousId();
        $this->assertEquals($existingId, $id2);
    }

    /**
     * Test anonymous name generation
     */
    public function test_generate_anonymous_name(): void
    {
        // Test without ID (random name)
        $name1 = AnonymousHelper::generateAnonymousName();
        $name2 = AnonymousHelper::generateAnonymousName();
        
        $this->assertIsString($name1);
        $this->assertIsString($name2);
        $this->assertNotEmpty($name1);
        $this->assertNotEmpty($name2);
        
        // Should contain "User"
        $this->assertStringContainsString('User', $name1);
        $this->assertStringContainsString('User', $name2);
        
        // Test with specific ID (consistent name)
        $testId = 'anon_test123_1234567890';
        $name3 = AnonymousHelper::generateAnonymousName($testId);
        $name4 = AnonymousHelper::generateAnonymousName($testId);
        
        $this->assertEquals($name3, $name4); // Should be consistent
        $this->assertStringContainsString('#', $name3); // Should have number
        $this->assertStringContainsString('User', $name3);
        
        // Test with different IDs (different names)
        $testId2 = 'anon_test456_1234567890';
        $name5 = AnonymousHelper::generateAnonymousName($testId2);
        $this->assertNotEquals($name3, $name5);
    }

    /**
     * Test anonymous data storage
     */
    public function test_store_anonymous_data(): void
    {
        $anonymousId = 'anon_test123_1234567890';
        $testData = [
            'posts_count' => 5,
            'last_activity' => '2024-01-01 12:00:00',
            'preferences' => ['theme' => 'dark']
        ];
        
        Cache::shouldReceive('put')
              ->with('anonymous_user_' . $anonymousId, $testData, \Mockery::type('object'))
              ->once()
              ->andReturn(true);
        
        $result = AnonymousHelper::storeAnonymousData($anonymousId, $testData);
        $this->assertTrue($result);
        
        // Test with custom duration
        Cache::shouldReceive('put')
              ->with('anonymous_user_' . $anonymousId, $testData, \Mockery::type('object'))
              ->once()
              ->andReturn(true);
        
        $result = AnonymousHelper::storeAnonymousData($anonymousId, $testData, 60);
        $this->assertTrue($result);
    }

    /**
     * Test anonymous data retrieval
     */
    public function test_get_anonymous_data(): void
    {
        $anonymousId = 'anon_test123_1234567890';
        $testData = [
            'posts_count' => 5,
            'last_activity' => '2024-01-01 12:00:00'
        ];
        
        Cache::shouldReceive('get')
              ->with('anonymous_user_' . $anonymousId)
              ->once()
              ->andReturn($testData);
        
        $result = AnonymousHelper::getAnonymousData($anonymousId);
        $this->assertEquals($testData, $result);
        
        // Test when no data exists
        Cache::shouldReceive('get')
              ->with('anonymous_user_nonexistent')
              ->once()
              ->andReturn(null);
        
        $result = AnonymousHelper::getAnonymousData('nonexistent');
        $this->assertNull($result);
    }

    /**
     * Test anonymous data updates
     */
    public function test_update_anonymous_data(): void
    {
        $anonymousId = 'anon_test123_1234567890';
        $existingData = ['posts_count' => 5];
        $newData = ['comments_count' => 3];
        $mergedData = ['posts_count' => 5, 'comments_count' => 3];
        
        // Test merge update
        Cache::shouldReceive('get')
              ->with('anonymous_user_' . $anonymousId, [])
              ->once()
              ->andReturn($existingData);
        
        Cache::shouldReceive('put')
              ->with('anonymous_user_' . $anonymousId, $mergedData, \Mockery::type('object'))
              ->once()
              ->andReturn(true);
        
        $result = AnonymousHelper::updateAnonymousData($anonymousId, $newData, true);
        $this->assertTrue($result);
        
        // Test replace update
        Cache::shouldReceive('put')
              ->with('anonymous_user_' . $anonymousId, $newData, \Mockery::type('object'))
              ->once()
              ->andReturn(true);
        
        $result = AnonymousHelper::updateAnonymousData($anonymousId, $newData, false);
        $this->assertTrue($result);
    }

    /**
     * Test anonymous data deletion
     */
    public function test_delete_anonymous_data(): void
    {
        $anonymousId = 'anon_test123_1234567890';
        
        Cache::shouldReceive('forget')
              ->with('anonymous_user_' . $anonymousId)
              ->once()
              ->andReturn(true);
        
        $result = AnonymousHelper::deleteAnonymousData($anonymousId);
        $this->assertTrue($result);
    }

    /**
     * Test anonymous user detection
     */
    public function test_is_anonymous(): void
    {
        // Test with null user
        $this->assertTrue(AnonymousHelper::isAnonymous(null));
        
        // Test with array user (anonymous)
        $anonymousUser = ['id' => 1, 'is_anonymous' => true];
        $this->assertTrue(AnonymousHelper::isAnonymous($anonymousUser));
        
        // Test with array user (not anonymous)
        $regularUser = ['id' => 1, 'is_anonymous' => false];
        $this->assertFalse(AnonymousHelper::isAnonymous($regularUser));
        
        // Test with object user (anonymous)
        $anonymousUserObj = (object) ['id' => 1, 'is_anonymous' => true];
        $this->assertTrue(AnonymousHelper::isAnonymous($anonymousUserObj));
        
        // Test with object user (not anonymous)
        $regularUserObj = (object) ['id' => 1, 'is_anonymous' => false];
        $this->assertFalse(AnonymousHelper::isAnonymous($regularUserObj));
        
        // Test with user without is_anonymous property
        $userWithoutFlag = ['id' => 1, 'name' => 'John'];
        $this->assertFalse(AnonymousHelper::isAnonymous($userWithoutFlag));
    }

    /**
     * Test data sanitization for anonymous users
     */
    public function test_sanitize_anonymous_data(): void
    {
        $sensitiveData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '123-456-7890',
            'address' => '123 Main St',
            'ip_address' => '192.168.1.1',
            'user_agent' => 'Mozilla/5.0...',
            'real_name' => 'John Smith',
            'personal_info' => 'Some personal details',
            'posts_count' => 5,
            'preferences' => ['theme' => 'dark']
        ];
        
        $sanitized = AnonymousHelper::sanitizeAnonymousData($sensitiveData);
        
        // Should remove sensitive fields
        $this->assertArrayNotHasKey('email', $sanitized);
        $this->assertArrayNotHasKey('phone', $sanitized);
        $this->assertArrayNotHasKey('address', $sanitized);
        $this->assertArrayNotHasKey('ip_address', $sanitized);
        $this->assertArrayNotHasKey('user_agent', $sanitized);
        $this->assertArrayNotHasKey('real_name', $sanitized);
        $this->assertArrayNotHasKey('personal_info', $sanitized);
        
        // Should keep non-sensitive fields
        $this->assertArrayHasKey('name', $sanitized);
        $this->assertArrayHasKey('posts_count', $sanitized);
        $this->assertArrayHasKey('preferences', $sanitized);
        
        $this->assertEquals('John Doe', $sanitized['name']);
        $this->assertEquals(5, $sanitized['posts_count']);
        $this->assertEquals(['theme' => 'dark'], $sanitized['preferences']);
    }

    /**
     * Test anonymous profile generation
     */
    public function test_generate_anonymous_profile(): void
    {
        // Test without specific ID
        $profile1 = AnonymousHelper::generateAnonymousProfile();
        
        $this->assertIsArray($profile1);
        $this->assertArrayHasKey('anonymous_id', $profile1);
        $this->assertArrayHasKey('display_name', $profile1);
        $this->assertArrayHasKey('is_anonymous', $profile1);
        $this->assertArrayHasKey('avatar', $profile1);
        $this->assertArrayHasKey('bio', $profile1);
        $this->assertArrayHasKey('created_at', $profile1);
        
        $this->assertTrue($profile1['is_anonymous']);
        $this->assertNull($profile1['avatar']);
        $this->assertNull($profile1['bio']);
        $this->assertStringStartsWith('anon_', $profile1['anonymous_id']);
        $this->assertStringContainsString('User', $profile1['display_name']);
        
        // Test with specific ID
        $testId = 'anon_test123_1234567890';
        $profile2 = AnonymousHelper::generateAnonymousProfile($testId);
        
        $this->assertEquals($testId, $profile2['anonymous_id']);
        $this->assertTrue($profile2['is_anonymous']);
    }

    /**
     * Test sensitive information masking
     */
    public function test_mask_sensitive_info(): void
    {
        // Test default masking (2 visible chars, rest masked)
        $this->assertEquals('jo**************', AnonymousHelper::maskSensitiveInfo('john@example.com'));
        $this->assertEquals('12**********', AnonymousHelper::maskSensitiveInfo('123-456-7890'));
        
        // Test custom visible characters
        $this->assertEquals('j***', AnonymousHelper::maskSensitiveInfo('john', 1));
        $this->assertEquals('joh*', AnonymousHelper::maskSensitiveInfo('john', 3));
        
        // Test custom mask character
        $this->assertEquals('jo##############', AnonymousHelper::maskSensitiveInfo('john@example.com', 2, '#'));
        
        // Test edge cases
        $this->assertEquals('**', AnonymousHelper::maskSensitiveInfo('ab', 2));
        $this->assertEquals('*', AnonymousHelper::maskSensitiveInfo('a', 2));
        $this->assertEquals('', AnonymousHelper::maskSensitiveInfo(''));
    }

    /**
     * Test cleanup of expired data
     */
    public function test_cleanup_expired_data(): void
    {
        // Since Laravel cache handles expiration automatically,
        // this method should return 0
        $result = AnonymousHelper::cleanupExpiredData();
        $this->assertEquals(0, $result);
    }

    /**
     * Test anonymous user statistics
     */
    public function test_get_anonymous_stats(): void
    {
        $stats = AnonymousHelper::getAnonymousStats();
        
        $this->assertIsArray($stats);
        $this->assertArrayHasKey('active_anonymous_users', $stats);
        $this->assertArrayHasKey('total_anonymous_posts', $stats);
        $this->assertArrayHasKey('total_anonymous_comments', $stats);
        
        // Values should be non-negative
        $this->assertGreaterThanOrEqual(0, $stats['active_anonymous_users']);
        $this->assertGreaterThanOrEqual(0, $stats['total_anonymous_posts']);
        $this->assertGreaterThanOrEqual(0, $stats['total_anonymous_comments']);
    }

    /**
     * Test anonymous ID validation
     */
    public function test_is_valid_anonymous_id(): void
    {
        // Valid IDs (exactly 16 alphanumeric chars after anon_)
        $this->assertTrue(AnonymousHelper::isValidAnonymousId('anon_abcdef1234567890_1234567890'));
        $this->assertTrue(AnonymousHelper::isValidAnonymousId('anon_ABCDEF1234567890_9876543210'));
        
        // Invalid IDs
        $this->assertFalse(AnonymousHelper::isValidAnonymousId('invalid_id'));
        $this->assertFalse(AnonymousHelper::isValidAnonymousId('anon_'));
        $this->assertFalse(AnonymousHelper::isValidAnonymousId('anon_short_123'));
        $this->assertFalse(AnonymousHelper::isValidAnonymousId('anon_abc123def456_123')); // 15 chars instead of 16
        $this->assertFalse(AnonymousHelper::isValidAnonymousId(''));
        $this->assertFalse(AnonymousHelper::isValidAnonymousId('user_123_456'));
        $this->assertFalse(AnonymousHelper::isValidAnonymousId('anon_abc_'));
        $this->assertFalse(AnonymousHelper::isValidAnonymousId('anon__123456'));
    }

    /**
     * Test user data conversion to anonymous
     */
    public function test_convert_to_anonymous(): void
    {
        $userData = [
            'id' => 123,
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'posts_count' => 5,
            'is_anonymous' => false
        ];
        
        // Test without specific anonymous ID
        $anonymousData = AnonymousHelper::convertToAnonymous($userData);
        
        $this->assertArrayHasKey('anonymous_id', $anonymousData);
        $this->assertArrayHasKey('name', $anonymousData);
        $this->assertTrue($anonymousData['is_anonymous']);
        $this->assertNull($anonymousData['id']);
        $this->assertNull($anonymousData['email']);
        $this->assertArrayNotHasKey('posts_count', $anonymousData);
        
        // Test with specific anonymous ID
        $testId = 'anon_test123_1234567890';
        $anonymousData2 = AnonymousHelper::convertToAnonymous($userData, $testId);
        
        $this->assertEquals($testId, $anonymousData2['anonymous_id']);
        $this->assertTrue($anonymousData2['is_anonymous']);
    }

    /**
     * Test anonymous display info
     */
    public function test_get_anonymous_display_info(): void
    {
        $anonymousId = 'anon_test123_1234567890';
        $displayInfo = AnonymousHelper::getAnonymousDisplayInfo($anonymousId);
        
        $this->assertIsArray($displayInfo);
        $this->assertArrayHasKey('id', $displayInfo);
        $this->assertArrayHasKey('anonymous_id', $displayInfo);
        $this->assertArrayHasKey('name', $displayInfo);
        $this->assertArrayHasKey('avatar', $displayInfo);
        $this->assertArrayHasKey('is_anonymous', $displayInfo);
        
        $this->assertNull($displayInfo['id']);
        $this->assertEquals($anonymousId, $displayInfo['anonymous_id']);
        $this->assertTrue($displayInfo['is_anonymous']);
        $this->assertNull($displayInfo['avatar']);
        $this->assertStringContainsString('User', $displayInfo['name']);
    }

    /**
     * Test anonymous posting permission
     */
    public function test_is_anonymous_posting_allowed(): void
    {
        // Since config() is not available in pure unit tests, we'll skip this test
        // or test it differently. For now, we'll mark it as skipped.
        $this->markTestSkipped('Config helper not available in unit tests. This should be tested in feature tests.');
    }

    /**
     * Test rate limiting for anonymous users
     */
    public function test_check_rate_limit(): void
    {
        $anonymousId = 'anon_test123_1234567890';
        
        // Mock cache for rate limiting - first call should return 0 (no previous attempts)
        Cache::shouldReceive('get')
              ->with("rate_limit_post_{$anonymousId}", 0)
              ->once()
              ->andReturn(0);
        
        Cache::shouldReceive('put')
              ->with("rate_limit_post_{$anonymousId}", 1, \Mockery::type('object'))
              ->once()
              ->andReturn(true);
        
        // Should allow first attempt
        $this->assertTrue(AnonymousHelper::checkRateLimit($anonymousId, 'post', 5, 60));
        
        // Mock cache for rate limiting - second call should return 5 (at limit)
        Cache::shouldReceive('get')
              ->with("rate_limit_post_{$anonymousId}", 0)
              ->once()
              ->andReturn(5);
        
        // Should block when at limit
        $this->assertFalse(AnonymousHelper::checkRateLimit($anonymousId, 'post', 5, 60));
    }

    /**
     * Test session data clearing
     */
    public function test_clear_session_data(): void
    {
        Session::shouldReceive('forget')
               ->with('anonymous_user_id')
               ->once()
               ->andReturn(true);
        
        // Should not throw any exceptions
        AnonymousHelper::clearSessionData();
        $this->assertTrue(true); // If we get here, no exception was thrown
    }

    /**
     * Test edge cases and error handling
     */
    public function test_edge_cases(): void
    {
        // Test with empty strings
        $this->assertFalse(AnonymousHelper::isValidAnonymousId(''));
        $this->assertEquals('', AnonymousHelper::maskSensitiveInfo(''));
        
        // Test with null values
        $this->assertTrue(AnonymousHelper::isAnonymous(null));
        
        // Test with malformed data
        $malformedData = ['not_an_array' => 'value'];
        $sanitized = AnonymousHelper::sanitizeAnonymousData($malformedData);
        $this->assertIsArray($sanitized);
        
        // Test anonymous name generation with empty ID
        $name = AnonymousHelper::generateAnonymousName('');
        $this->assertIsString($name);
        $this->assertNotEmpty($name);
    }
} 
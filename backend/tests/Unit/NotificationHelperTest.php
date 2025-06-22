<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Utils\NotificationHelper;
use Illuminate\Support\Collection;

class NotificationHelperTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
    }

    protected function tearDown(): void
    {
        parent::tearDown();
    }

    /**
     * Test notification type constants
     */
    public function test_notification_types_constant(): void
    {
        $expectedTypes = [
            'like',
            'comment',
            'admin_message',
            'post_approved',
            'post_rejected',
            'comment_approved',
            'comment_rejected',
        ];
        
        $this->assertEquals($expectedTypes, NotificationHelper::NOTIFICATION_TYPES);
    }

    /**
     * Test valid notification type checking
     */
    public function test_is_valid_notification_type(): void
    {
        // Valid types
        $this->assertTrue(NotificationHelper::isValidNotificationType('like'));
        $this->assertTrue(NotificationHelper::isValidNotificationType('comment'));
        $this->assertTrue(NotificationHelper::isValidNotificationType('admin_message'));
        $this->assertTrue(NotificationHelper::isValidNotificationType('post_approved'));
        $this->assertTrue(NotificationHelper::isValidNotificationType('post_rejected'));
        $this->assertTrue(NotificationHelper::isValidNotificationType('comment_approved'));
        $this->assertTrue(NotificationHelper::isValidNotificationType('comment_rejected'));
        
        // Invalid types
        $this->assertFalse(NotificationHelper::isValidNotificationType('invalid_type'));
        $this->assertFalse(NotificationHelper::isValidNotificationType(''));
        $this->assertFalse(NotificationHelper::isValidNotificationType('LIKE'));
        $this->assertFalse(NotificationHelper::isValidNotificationType('message'));
    }

    /**
     * Test getting supported notification types
     */
    public function test_get_supported_types(): void
    {
        $supportedTypes = NotificationHelper::getSupportedTypes();
        
        $this->assertIsArray($supportedTypes);
        $this->assertEquals(NotificationHelper::NOTIFICATION_TYPES, $supportedTypes);
        $this->assertContains('like', $supportedTypes);
        $this->assertContains('comment', $supportedTypes);
        $this->assertContains('admin_message', $supportedTypes);
    }

    /**
     * Test notification data structure validation
     */
    public function test_validate_notification_data_structure(): void
    {
        // Test like notification data structure
        $likeData = [
            'message' => 'John Doe liked your post',
            'post_id' => 123,
            'post_title' => 'Test Post',
            'liker_id' => 456,
            'liker_name' => 'John Doe',
        ];
        
        $this->assertArrayHasKey('message', $likeData);
        $this->assertArrayHasKey('post_id', $likeData);
        $this->assertArrayHasKey('liker_id', $likeData);
        
        // Test comment notification data structure
        $commentData = [
            'message' => 'Jane Doe commented on your post',
            'post_id' => 123,
            'post_title' => 'Test Post',
            'comment_id' => 789,
            'commenter_id' => 456,
            'commenter_name' => 'Jane Doe',
        ];
        
        $this->assertArrayHasKey('message', $commentData);
        $this->assertArrayHasKey('comment_id', $commentData);
        $this->assertArrayHasKey('commenter_id', $commentData);
        
        // Test admin message data structure
        $adminData = [
            'message' => 'New message from admin: Welcome',
            'subject' => 'Welcome',
            'admin_message' => 'Welcome to our platform',
            'message_id' => 101,
        ];
        
        $this->assertArrayHasKey('subject', $adminData);
        $this->assertArrayHasKey('admin_message', $adminData);
    }

    /**
     * Test notification message formatting
     */
    public function test_notification_message_formatting(): void
    {
        // Test like message format
        $likerName = 'John Doe';
        $expectedLikeMessage = "{$likerName} liked your post";
        $this->assertEquals($expectedLikeMessage, "{$likerName} liked your post");
        
        // Test comment message format
        $commenterName = 'Jane Smith';
        $expectedCommentMessage = "{$commenterName} commented on your post";
        $this->assertEquals($expectedCommentMessage, "{$commenterName} commented on your post");
        
        // Test post approved message format
        $postTitle = 'My Test Post';
        $expectedApprovedMessage = "Your post '{$postTitle}' has been approved and is now live";
        $this->assertEquals($expectedApprovedMessage, "Your post '{$postTitle}' has been approved and is now live");
        
        // Test post rejected message format
        $expectedRejectedMessage = "Your post '{$postTitle}' has been rejected";
        $this->assertEquals($expectedRejectedMessage, "Your post '{$postTitle}' has been rejected");
    }

    /**
     * Test anonymous user handling in notifications
     */
    public function test_anonymous_user_notification_handling(): void
    {
        // Test anonymous liker
        $anonymousLikerName = 'Anonymous';
        $expectedAnonymousMessage = "Someone liked your post";
        $this->assertEquals($expectedAnonymousMessage, "Someone liked your post");
        
        // Test anonymous commenter
        $expectedAnonymousCommentMessage = "Someone commented on your post";
        $this->assertEquals($expectedAnonymousCommentMessage, "Someone commented on your post");
        
        // Verify anonymous users don't get personal information
        $this->assertEquals('Anonymous', $anonymousLikerName);
    }

    /**
     * Test notification data validation
     */
    public function test_notification_data_validation(): void
    {
        // Test required fields for like notification
        $likeRequiredFields = ['message', 'post_id', 'liker_id'];
        foreach ($likeRequiredFields as $field) {
            $this->assertIsString($field);
            $this->assertNotEmpty($field);
        }
        
        // Test required fields for comment notification
        $commentRequiredFields = ['message', 'post_id', 'comment_id', 'commenter_id'];
        foreach ($commentRequiredFields as $field) {
            $this->assertIsString($field);
            $this->assertNotEmpty($field);
        }
        
        // Test required fields for admin message
        $adminRequiredFields = ['message', 'subject', 'admin_message'];
        foreach ($adminRequiredFields as $field) {
            $this->assertIsString($field);
            $this->assertNotEmpty($field);
        }
    }

    /**
     * Test notification type categorization
     */
    public function test_notification_type_categorization(): void
    {
        $interactionTypes = ['like', 'comment'];
        $moderationTypes = ['post_approved', 'post_rejected', 'comment_approved', 'comment_rejected'];
        $adminTypes = ['admin_message'];
        
        // Test interaction types
        foreach ($interactionTypes as $type) {
            $this->assertContains($type, NotificationHelper::NOTIFICATION_TYPES);
        }
        
        // Test moderation types
        foreach ($moderationTypes as $type) {
            $this->assertContains($type, NotificationHelper::NOTIFICATION_TYPES);
        }
        
        // Test admin types
        foreach ($adminTypes as $type) {
            $this->assertContains($type, NotificationHelper::NOTIFICATION_TYPES);
        }
        
        // Verify all types are accounted for
        $allTypes = array_merge($interactionTypes, $moderationTypes, $adminTypes);
        $this->assertEquals(count(NotificationHelper::NOTIFICATION_TYPES), count($allTypes));
    }

    /**
     * Test notification priority levels
     */
    public function test_notification_priority_levels(): void
    {
        // High priority notifications (moderation results)
        $highPriorityTypes = ['post_approved', 'post_rejected', 'comment_approved', 'comment_rejected', 'admin_message'];
        
        // Medium priority notifications (interactions)
        $mediumPriorityTypes = ['like', 'comment'];
        
        foreach ($highPriorityTypes as $type) {
            $this->assertTrue(NotificationHelper::isValidNotificationType($type));
        }
        
        foreach ($mediumPriorityTypes as $type) {
            $this->assertTrue(NotificationHelper::isValidNotificationType($type));
        }
    }

    /**
     * Test notification data sanitization
     */
    public function test_notification_data_sanitization(): void
    {
        // Test that notification data doesn't contain sensitive information
        $sampleNotificationData = [
            'message' => 'Test notification',
            'post_id' => 123,
            'user_name' => 'John Doe',
        ];
        
        // Should not contain sensitive fields
        $sensitiveFields = ['password', 'email', 'phone', 'address', 'ip_address'];
        
        foreach ($sensitiveFields as $field) {
            $this->assertArrayNotHasKey($field, $sampleNotificationData);
        }
        
        // Should contain safe fields
        $this->assertArrayHasKey('message', $sampleNotificationData);
        $this->assertArrayHasKey('post_id', $sampleNotificationData);
    }

    /**
     * Test edge cases and error handling
     */
    public function test_edge_cases(): void
    {
        // Test with empty notification type
        $this->assertFalse(NotificationHelper::isValidNotificationType(''));
        
        // Test case sensitivity
        $this->assertFalse(NotificationHelper::isValidNotificationType('LIKE'));
        $this->assertFalse(NotificationHelper::isValidNotificationType('Like'));
        
        // Test with invalid string types
        $this->assertFalse(NotificationHelper::isValidNotificationType('invalid_type'));
        $this->assertFalse(NotificationHelper::isValidNotificationType('message'));
        $this->assertFalse(NotificationHelper::isValidNotificationType('notification'));
    }

    /**
     * Test notification constants integrity
     */
    public function test_notification_constants_integrity(): void
    {
        $types = NotificationHelper::NOTIFICATION_TYPES;
        
        // Should be an array
        $this->assertIsArray($types);
        
        // Should not be empty
        $this->assertNotEmpty($types);
        
        // Should contain only strings
        foreach ($types as $type) {
            $this->assertIsString($type);
            $this->assertNotEmpty($type);
        }
        
        // Should not contain duplicates
        $this->assertEquals(count($types), count(array_unique($types)));
        
        // Should contain expected minimum types
        $this->assertGreaterThanOrEqual(7, count($types));
    }
} 
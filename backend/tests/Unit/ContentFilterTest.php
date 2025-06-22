<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Utils\ContentFilter;

class ContentFilterTest extends TestCase
{
    /**
     * Test banned words detection
     */
    public function test_contains_banned_words(): void
    {
        // Test with banned words
        $this->assertTrue(ContentFilter::containsBannedWords('This is a fuck test'));
        $this->assertTrue(ContentFilter::containsBannedWords('You are such a bitch'));
        $this->assertTrue(ContentFilter::containsBannedWords('DAMN this is bad'));
        $this->assertTrue(ContentFilter::containsBannedWords('kill yourself now'));
        
        // Test with clean content
        $this->assertFalse(ContentFilter::containsBannedWords('This is a clean message'));
        $this->assertFalse(ContentFilter::containsBannedWords('Hello world'));
        $this->assertFalse(ContentFilter::containsBannedWords(''));
        
        // Test case insensitivity
        $this->assertTrue(ContentFilter::containsBannedWords('FUCK'));
        $this->assertTrue(ContentFilter::containsBannedWords('FuCk'));
        $this->assertTrue(ContentFilter::containsBannedWords('fuck'));
    }

    /**
     * Test profanity filtering
     */
    public function test_filter_profanity(): void
    {
        // Test basic profanity filtering
        $this->assertEquals('This is a **** test', ContentFilter::filterProfanity('This is a fuck test'));
        $this->assertEquals('You are such a *****', ContentFilter::filterProfanity('You are such a bitch'));
        $this->assertEquals('**** this is bad', ContentFilter::filterProfanity('damn this is bad'));
        
        // Test multiple banned words
        $this->assertEquals('**** you, you *****', ContentFilter::filterProfanity('fuck you, you bitch'));
        
        // Test clean content remains unchanged
        $this->assertEquals('This is clean', ContentFilter::filterProfanity('This is clean'));
        $this->assertEquals('', ContentFilter::filterProfanity(''));
        
        // Test case insensitive filtering
        $this->assertEquals('****', ContentFilter::filterProfanity('FUCK'));
        $this->assertEquals('****', ContentFilter::filterProfanity('FuCk'));
    }

    /**
     * Test harmful content detection
     */
    public function test_detect_harmful_content(): void
    {
        // Test single harmful word
        $detected = ContentFilter::detectHarmfulContent('This contains fuck word');
        $this->assertContains('fuck', $detected);
        $this->assertCount(1, $detected);
        
        // Test multiple harmful words
        $detected = ContentFilter::detectHarmfulContent('fuck you bitch');
        $this->assertContains('fuck', $detected);
        $this->assertContains('bitch', $detected);
        $this->assertCount(2, $detected);
        
        // Test clean content
        $detected = ContentFilter::detectHarmfulContent('This is clean content');
        $this->assertEmpty($detected);
        
        // Test case insensitivity
        $detected = ContentFilter::detectHarmfulContent('FUCK YOU');
        $this->assertContains('fuck', $detected);
        
        // Test high severity words
        $detected = ContentFilter::detectHarmfulContent('kill yourself');
        $this->assertContains('kill yourself', $detected);
    }

    /**
     * Test severity score calculation
     */
    public function test_calculate_severity_score(): void
    {
        // Test critical severity (score 4)
        $this->assertEquals(4, ContentFilter::calculateSeverityScore('kill yourself'));
        $this->assertEquals(4, ContentFilter::calculateSeverityScore('kys now'));
        $this->assertEquals(4, ContentFilter::calculateSeverityScore('suicide is the answer'));
        $this->assertEquals(4, ContentFilter::calculateSeverityScore('terrorist attack'));
        
        // Test medium severity (score 2)
        $this->assertEquals(2, ContentFilter::calculateSeverityScore('fuck you'));
        $this->assertEquals(2, ContentFilter::calculateSeverityScore('you bitch'));
        $this->assertEquals(2, ContentFilter::calculateSeverityScore('asshole behavior'));
        
        // Test low severity (score 1)
        $this->assertEquals(1, ContentFilter::calculateSeverityScore('click here for free money'));
        $this->assertEquals(1, ContentFilter::calculateSeverityScore('get rich quick'));
        
        // Test clean content (score 0)
        $this->assertEquals(0, ContentFilter::calculateSeverityScore('This is clean content'));
        $this->assertEquals(0, ContentFilter::calculateSeverityScore('Hello world'));
        $this->assertEquals(0, ContentFilter::calculateSeverityScore(''));
        
        // Test mixed severity - should return highest
        $this->assertEquals(4, ContentFilter::calculateSeverityScore('fuck you, kill yourself'));
        $this->assertEquals(2, ContentFilter::calculateSeverityScore('damn you bitch'));
    }

    /**
     * Test severity level names
     */
    public function test_get_severity_level(): void
    {
        $this->assertEquals('critical', ContentFilter::getSeverityLevel(4));
        $this->assertEquals('high', ContentFilter::getSeverityLevel(3));
        $this->assertEquals('medium', ContentFilter::getSeverityLevel(2));
        $this->assertEquals('low', ContentFilter::getSeverityLevel(1));
        $this->assertEquals('none', ContentFilter::getSeverityLevel(0));
        
        // Test invalid scores
        $this->assertEquals('none', ContentFilter::getSeverityLevel(99));
        $this->assertEquals('none', ContentFilter::getSeverityLevel(-1));
    }

    /**
     * Test comprehensive content analysis
     */
    public function test_analyze_content(): void
    {
        // Test critical content
        $analysis = ContentFilter::analyzeContent('kill yourself now');
        $this->assertTrue($analysis['contains_banned_words']);
        $this->assertContains('kill yourself', $analysis['detected_words']);
        $this->assertEquals(4, $analysis['severity_score']);
        $this->assertEquals('critical', $analysis['severity_level']);
        $this->assertTrue($analysis['requires_moderation']);
        $this->assertTrue($analysis['auto_reject']);
        $this->assertStringContainsString('*', $analysis['filtered_content']);
        
        // Test medium severity content
        $analysis = ContentFilter::analyzeContent('fuck this shit');
        $this->assertTrue($analysis['contains_banned_words']);
        $this->assertContains('fuck', $analysis['detected_words']);
        $this->assertContains('shit', $analysis['detected_words']);
        $this->assertEquals(2, $analysis['severity_score']);
        $this->assertEquals('medium', $analysis['severity_level']);
        $this->assertTrue($analysis['requires_moderation']);
        $this->assertFalse($analysis['auto_reject']);
        
        // Test clean content
        $analysis = ContentFilter::analyzeContent('This is a nice post');
        $this->assertFalse($analysis['contains_banned_words']);
        $this->assertEmpty($analysis['detected_words']);
        $this->assertEquals(0, $analysis['severity_score']);
        $this->assertEquals('none', $analysis['severity_level']);
        $this->assertFalse($analysis['requires_moderation']);
        $this->assertFalse($analysis['auto_reject']);
        $this->assertEquals('This is a nice post', $analysis['filtered_content']);
        
        // Test low severity content
        $analysis = ContentFilter::analyzeContent('click here for free money');
        $this->assertTrue($analysis['contains_banned_words']);
        $this->assertEquals(1, $analysis['severity_score']);
        $this->assertEquals('low', $analysis['severity_level']);
        $this->assertFalse($analysis['requires_moderation']);
        $this->assertFalse($analysis['auto_reject']);
    }

    /**
     * Test auto-rejection logic
     */
    public function test_should_auto_reject(): void
    {
        // Critical content should be auto-rejected
        $this->assertTrue(ContentFilter::shouldAutoReject('kill yourself'));
        $this->assertTrue(ContentFilter::shouldAutoReject('kys'));
        $this->assertTrue(ContentFilter::shouldAutoReject('suicide'));
        $this->assertTrue(ContentFilter::shouldAutoReject('terrorist'));
        
        // Medium and low severity should not be auto-rejected
        $this->assertFalse(ContentFilter::shouldAutoReject('fuck you'));
        $this->assertFalse(ContentFilter::shouldAutoReject('damn'));
        $this->assertFalse(ContentFilter::shouldAutoReject('click here'));
        
        // Clean content should not be auto-rejected
        $this->assertFalse(ContentFilter::shouldAutoReject('This is clean'));
        $this->assertFalse(ContentFilter::shouldAutoReject(''));
    }

    /**
     * Test moderation requirement logic
     */
    public function test_requires_moderation(): void
    {
        // Critical and medium severity should require moderation
        $this->assertTrue(ContentFilter::requiresModeration('kill yourself'));
        $this->assertTrue(ContentFilter::requiresModeration('fuck you'));
        $this->assertTrue(ContentFilter::requiresModeration('bitch'));
        
        // Low severity should not require moderation
        $this->assertFalse(ContentFilter::requiresModeration('click here'));
        $this->assertFalse(ContentFilter::requiresModeration('free money'));
        
        // Clean content should not require moderation
        $this->assertFalse(ContentFilter::requiresModeration('This is clean'));
        $this->assertFalse(ContentFilter::requiresModeration(''));
    }

    /**
     * Test adding banned words
     */
    public function test_add_banned_word(): void
    {
        $originalWords = ContentFilter::getBannedWords();
        
        // Add new banned word
        ContentFilter::addBannedWord('newbadword');
        $this->assertContains('newbadword', ContentFilter::getBannedWords());
        
        // Test that it's now detected
        $this->assertTrue(ContentFilter::containsBannedWords('This contains newbadword'));
        
        // Test case insensitivity
        ContentFilter::addBannedWord('ANOTHERBAD');
        $this->assertContains('anotherbad', ContentFilter::getBannedWords());
        
        // Test duplicate prevention
        $beforeCount = count(ContentFilter::getBannedWords());
        ContentFilter::addBannedWord('newbadword'); // Add same word again
        $afterCount = count(ContentFilter::getBannedWords());
        $this->assertEquals($beforeCount, $afterCount);
    }

    /**
     * Test removing banned words
     */
    public function test_remove_banned_word(): void
    {
        // Add a word first
        ContentFilter::addBannedWord('temporaryword');
        $this->assertContains('temporaryword', ContentFilter::getBannedWords());
        
        // Remove the word
        ContentFilter::removeBannedWord('temporaryword');
        $this->assertNotContains('temporaryword', ContentFilter::getBannedWords());
        
        // Test that it's no longer detected
        $this->assertFalse(ContentFilter::containsBannedWords('This contains temporaryword'));
        
        // Test case insensitivity
        ContentFilter::addBannedWord('CASETEST');
        ContentFilter::removeBannedWord('casetest');
        $this->assertNotContains('casetest', ContentFilter::getBannedWords());
        
        // Test removing non-existent word (should not cause error)
        $beforeCount = count(ContentFilter::getBannedWords());
        ContentFilter::removeBannedWord('nonexistentword');
        $afterCount = count(ContentFilter::getBannedWords());
        $this->assertEquals($beforeCount, $afterCount);
    }

    /**
     * Test getting banned words list
     */
    public function test_get_banned_words(): void
    {
        $bannedWords = ContentFilter::getBannedWords();
        
        $this->assertIsArray($bannedWords);
        $this->assertNotEmpty($bannedWords);
        
        // Test that known banned words are in the list
        $this->assertContains('fuck', $bannedWords);
        $this->assertContains('shit', $bannedWords);
        $this->assertContains('kill yourself', $bannedWords);
        $this->assertContains('nazi', $bannedWords);
    }

    /**
     * Test edge cases
     */
    public function test_edge_cases(): void
    {
        // Test empty string
        $this->assertFalse(ContentFilter::containsBannedWords(''));
        $this->assertEquals('', ContentFilter::filterProfanity(''));
        $this->assertEmpty(ContentFilter::detectHarmfulContent(''));
        $this->assertEquals(0, ContentFilter::calculateSeverityScore(''));
        
        // Test whitespace only
        $this->assertFalse(ContentFilter::containsBannedWords('   '));
        $this->assertEquals('   ', ContentFilter::filterProfanity('   '));
        
        // Test very long content
        $longContent = str_repeat('This is a long sentence. ', 100) . 'fuck';
        $this->assertTrue(ContentFilter::containsBannedWords($longContent));
        
        // Test special characters
        $this->assertFalse(ContentFilter::containsBannedWords('!@#$%^&*()'));
        
        // Test numbers
        $this->assertFalse(ContentFilter::containsBannedWords('123456789'));
        
        // Test partial word matches (should not match)
        $this->assertFalse(ContentFilter::containsBannedWords('duckling')); // contains 'uck' but not 'fuck'
    }

    /**
     * Test performance with large content
     */
    public function test_performance_with_large_content(): void
    {
        // Create large content
        $largeContent = str_repeat('This is a test sentence with normal words. ', 1000);
        
        $startTime = microtime(true);
        $result = ContentFilter::analyzeContent($largeContent);
        $endTime = microtime(true);
        
        // Should complete within reasonable time (1 second)
        $this->assertLessThan(1.0, $endTime - $startTime);
        $this->assertFalse($result['contains_banned_words']);
        $this->assertEquals(0, $result['severity_score']);
    }
} 
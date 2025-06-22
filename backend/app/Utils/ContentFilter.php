<?php

namespace App\Utils;

class ContentFilter
{
    /**
     * List of banned words and phrases
     */
    private static array $bannedWords = [
        // Profanity
        'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard',
        // Hate speech
        'nazi', 'terrorist', 'kill yourself', 'kys',
        // Spam indicators
        'click here', 'free money', 'get rich quick', 'viagra',
        // Harmful content
        'suicide', 'self harm', 'cutting', 'overdose',
    ];

    /**
     * Severity levels for different types of content
     */
    private static array $severityLevels = [
        'low' => 1,
        'medium' => 2,
        'high' => 3,
        'critical' => 4,
    ];

    /**
     * High severity words that require immediate attention
     */
    private static array $highSeverityWords = [
        'kill yourself', 'kys', 'suicide', 'self harm', 'terrorist', 'nazi'
    ];

    /**
     * Medium severity words
     */
    private static array $mediumSeverityWords = [
        'fuck', 'shit', 'bitch', 'asshole', 'bastard'
    ];

    /**
     * Check if content contains banned words
     *
     * @param string $content
     * @return bool
     */
    public static function containsBannedWords(string $content): bool
    {
        $content = strtolower($content);
        
        foreach (self::$bannedWords as $word) {
            if (strpos($content, strtolower($word)) !== false) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Filter profanity from content
     *
     * @param string $content
     * @return string
     */
    public static function filterProfanity(string $content): string
    {
        $filtered = $content;
        
        foreach (self::$bannedWords as $word) {
            $replacement = str_repeat('*', strlen($word));
            $filtered = str_ireplace($word, $replacement, $filtered);
        }
        
        return $filtered;
    }

    /**
     * Detect harmful content in text
     *
     * @param string $content
     * @return array
     */
    public static function detectHarmfulContent(string $content): array
    {
        $content = strtolower($content);
        $detectedWords = [];
        
        foreach (self::$bannedWords as $word) {
            if (strpos($content, strtolower($word)) !== false) {
                $detectedWords[] = $word;
            }
        }
        
        return $detectedWords;
    }

    /**
     * Calculate severity score for content
     *
     * @param string $content
     * @return int
     */
    public static function calculateSeverityScore(string $content): int
    {
        $content = strtolower($content);
        $maxSeverity = 0;
        
        // Check for high severity words
        foreach (self::$highSeverityWords as $word) {
            if (strpos($content, strtolower($word)) !== false) {
                $maxSeverity = max($maxSeverity, self::$severityLevels['critical']);
            }
        }
        
        // Check for medium severity words
        foreach (self::$mediumSeverityWords as $word) {
            if (strpos($content, strtolower($word)) !== false) {
                $maxSeverity = max($maxSeverity, self::$severityLevels['medium']);
            }
        }
        
        // Check for other banned words (low severity)
        foreach (self::$bannedWords as $word) {
            if (!in_array($word, array_merge(self::$highSeverityWords, self::$mediumSeverityWords))) {
                if (strpos($content, strtolower($word)) !== false) {
                    $maxSeverity = max($maxSeverity, self::$severityLevels['low']);
                }
            }
        }
        
        return $maxSeverity;
    }

    /**
     * Get severity level name from score
     *
     * @param int $score
     * @return string
     */
    public static function getSeverityLevel(int $score): string
    {
        return array_search($score, self::$severityLevels) ?: 'none';
    }

    /**
     * Comprehensive content analysis
     *
     * @param string $content
     * @return array
     */
    public static function analyzeContent(string $content): array
    {
        $detectedWords = self::detectHarmfulContent($content);
        $severityScore = self::calculateSeverityScore($content);
        $severityLevel = self::getSeverityLevel($severityScore);
        $containsBanned = self::containsBannedWords($content);
        $filteredContent = self::filterProfanity($content);
        
        return [
            'contains_banned_words' => $containsBanned,
            'detected_words' => $detectedWords,
            'severity_score' => $severityScore,
            'severity_level' => $severityLevel,
            'filtered_content' => $filteredContent,
            'requires_moderation' => $severityScore >= self::$severityLevels['medium'],
            'auto_reject' => $severityScore >= self::$severityLevels['critical'],
        ];
    }

    /**
     * Check if content should be auto-rejected
     *
     * @param string $content
     * @return bool
     */
    public static function shouldAutoReject(string $content): bool
    {
        $severityScore = self::calculateSeverityScore($content);
        return $severityScore >= self::$severityLevels['critical'];
    }

    /**
     * Check if content requires manual moderation
     *
     * @param string $content
     * @return bool
     */
    public static function requiresModeration(string $content): bool
    {
        $severityScore = self::calculateSeverityScore($content);
        return $severityScore >= self::$severityLevels['medium'];
    }

    /**
     * Add new banned word
     *
     * @param string $word
     * @return void
     */
    public static function addBannedWord(string $word): void
    {
        if (!in_array(strtolower($word), array_map('strtolower', self::$bannedWords))) {
            self::$bannedWords[] = strtolower($word);
        }
    }

    /**
     * Remove banned word
     *
     * @param string $word
     * @return void
     */
    public static function removeBannedWord(string $word): void
    {
        $key = array_search(strtolower($word), array_map('strtolower', self::$bannedWords));
        if ($key !== false) {
            unset(self::$bannedWords[$key]);
            self::$bannedWords = array_values(self::$bannedWords);
        }
    }

    /**
     * Get all banned words
     *
     * @return array
     */
    public static function getBannedWords(): array
    {
        return self::$bannedWords;
    }
} 
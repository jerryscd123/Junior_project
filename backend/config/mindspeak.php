<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Anonymous Posting Configuration
    |--------------------------------------------------------------------------
    |
    | This option controls whether anonymous users are allowed to create posts
    | and comments on the platform. When enabled, users can post without
    | registering an account.
    |
    */
    'allow_anonymous_posting' => env('MINDSPEAK_ALLOW_ANONYMOUS_POSTING', true),

    /*
    |--------------------------------------------------------------------------
    | Content Moderation Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for content moderation features including auto-rejection
    | thresholds and moderation requirements.
    |
    */
    'content_moderation' => [
        'auto_reject_threshold' => 4, // Critical severity score
        'moderation_threshold' => 2,  // Medium severity score
        'enable_auto_moderation' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting Configuration
    |--------------------------------------------------------------------------
    |
    | Rate limiting settings for anonymous users to prevent spam and abuse.
    |
    */
    'rate_limits' => [
        'anonymous_posts_per_hour' => 5,
        'anonymous_comments_per_hour' => 10,
        'anonymous_likes_per_hour' => 50,
    ],

    /*
    |--------------------------------------------------------------------------
    | Anonymous User Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for anonymous user behavior and data retention.
    |
    */
    'anonymous_settings' => [
        'session_duration' => 1440, // 24 hours in minutes
        'data_retention_days' => 30,
        'cleanup_frequency' => 'daily',
    ],

    /*
    |--------------------------------------------------------------------------
    | Notification Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for notification system behavior.
    |
    */
    'notifications' => [
        'retention_days' => 90,
        'batch_size' => 100,
        'enable_email_notifications' => false,
    ],
]; 
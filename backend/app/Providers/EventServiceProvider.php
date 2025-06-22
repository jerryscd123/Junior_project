<?php

namespace App\Providers;

use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

// Import Mindspeak events and listeners
use App\Events\PostStatusChanged;
use App\Events\CommentCreated;
use App\Events\PostLiked;
use App\Listeners\SendPostStatusNotification;
use App\Listeners\SendCommentNotification;
use App\Listeners\SendLikeNotification;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
        
        // Mindspeak notification events
        PostStatusChanged::class => [
            SendPostStatusNotification::class,
        ],
        
        CommentCreated::class => [
            SendCommentNotification::class,
        ],
        
        PostLiked::class => [
            SendLikeNotification::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}

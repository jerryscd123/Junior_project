<?php

namespace App\Listeners;

use App\Events\PostLiked;
use App\Models\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendLikeNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(PostLiked $event): void
    {
        try {
            // Only create notifications if the post has an author and it's not a self-like
            if (!$event->post->user_id) {
                Log::info('Skipping notification for anonymous post', [
                    'post_id' => $event->post->id,
                    'like_id' => $event->like->id
                ]);
                return;
            }

            // Don't notify if the liker is the same as the post author
            if ($event->post->user_id === $event->like->user_id) {
                Log::info('Skipping notification for self-like', [
                    'post_id' => $event->post->id,
                    'like_id' => $event->like->id,
                    'user_id' => $event->post->user_id
                ]);
                return;
            }

            // Create like notification for the post author
            Notification::createLikeNotification(
                $event->post->user_id,
                $event->post->id,
                $event->post->title
            );

            Log::info('Like notification created', [
                'post_id' => $event->post->id,
                'like_id' => $event->like->id,
                'post_author_id' => $event->post->user_id,
                'liker_id' => $event->like->user_id,
                'liker_name' => $event->getLikerName(),
                'total_likes' => $event->post->like_count
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to create like notification', [
                'post_id' => $event->post->id,
                'like_id' => $event->like->id,
                'post_author_id' => $event->post->user_id,
                'liker_id' => $event->like->user_id,
                'error' => $e->getMessage()
            ]);

            // Re-throw the exception to trigger job retry if using queues
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(PostLiked $event, \Throwable $exception): void
    {
        Log::error('SendLikeNotification listener failed permanently', [
            'post_id' => $event->post->id,
            'like_id' => $event->like->id,
            'post_author_id' => $event->post->user_id,
            'liker_id' => $event->like->user_id,
            'error' => $exception->getMessage()
        ]);
    }
}

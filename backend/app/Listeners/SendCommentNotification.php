<?php

namespace App\Listeners;

use App\Events\CommentCreated;
use App\Models\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendCommentNotification implements ShouldQueue
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
    public function handle(CommentCreated $event): void
    {
        try {
            // Only create notifications if the post has an author and it's not a self-comment
            if (!$event->post->user_id) {
                Log::info('Skipping notification for anonymous post', [
                    'post_id' => $event->post->id,
                    'comment_id' => $event->comment->id
                ]);
                return;
            }

            // Don't notify if the commenter is the same as the post author
            if ($event->post->user_id === $event->comment->user_id) {
                Log::info('Skipping notification for self-comment', [
                    'post_id' => $event->post->id,
                    'comment_id' => $event->comment->id,
                    'user_id' => $event->post->user_id
                ]);
                return;
            }

            // Create comment notification for the post author
            Notification::createCommentNotification(
                $event->post->user_id,
                $event->post->id,
                $event->post->title,
                $event->comment->id
            );

            Log::info('Comment notification created', [
                'post_id' => $event->post->id,
                'comment_id' => $event->comment->id,
                'post_author_id' => $event->post->user_id,
                'commenter_id' => $event->comment->user_id,
                'commenter_name' => $event->getCommenterName(),
                'is_anonymous' => $event->isAnonymous()
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to create comment notification', [
                'post_id' => $event->post->id,
                'comment_id' => $event->comment->id,
                'post_author_id' => $event->post->user_id,
                'commenter_id' => $event->comment->user_id,
                'error' => $e->getMessage()
            ]);

            // Re-throw the exception to trigger job retry if using queues
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(CommentCreated $event, \Throwable $exception): void
    {
        Log::error('SendCommentNotification listener failed permanently', [
            'post_id' => $event->post->id,
            'comment_id' => $event->comment->id,
            'post_author_id' => $event->post->user_id,
            'commenter_id' => $event->comment->user_id,
            'error' => $exception->getMessage()
        ]);
    }
}

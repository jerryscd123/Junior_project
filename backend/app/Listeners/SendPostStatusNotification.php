<?php

namespace App\Listeners;

use App\Events\PostStatusChanged;
use App\Models\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendPostStatusNotification implements ShouldQueue
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
    public function handle(PostStatusChanged $event): void
    {
        try {
            // Only create notifications if the post has an author
            if (!$event->post->user_id) {
                Log::info('Skipping notification for anonymous post', [
                    'post_id' => $event->post->id,
                    'status_change' => $event->oldStatus . ' -> ' . $event->newStatus
                ]);
                return;
            }

            // Create notification based on the new status
            if ($event->wasApproved()) {
                Notification::createPostApprovedNotification(
                    $event->post->user_id,
                    $event->post->id,
                    $event->post->title
                );

                Log::info('Post approved notification created', [
                    'post_id' => $event->post->id,
                    'user_id' => $event->post->user_id,
                    'post_title' => $event->post->title
                ]);
            } elseif ($event->wasRejected()) {
                Notification::createPostRejectedNotification(
                    $event->post->user_id,
                    $event->post->id,
                    $event->post->title,
                    $event->adminNote
                );

                Log::info('Post rejected notification created', [
                    'post_id' => $event->post->id,
                    'user_id' => $event->post->user_id,
                    'post_title' => $event->post->title,
                    'admin_note' => $event->adminNote
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to create post status notification', [
                'post_id' => $event->post->id,
                'user_id' => $event->post->user_id,
                'old_status' => $event->oldStatus,
                'new_status' => $event->newStatus,
                'error' => $e->getMessage()
            ]);

            // Re-throw the exception to trigger job retry if using queues
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(PostStatusChanged $event, \Throwable $exception): void
    {
        Log::error('SendPostStatusNotification listener failed permanently', [
            'post_id' => $event->post->id,
            'user_id' => $event->post->user_id,
            'old_status' => $event->oldStatus,
            'new_status' => $event->newStatus,
            'error' => $exception->getMessage()
        ]);
    }
}

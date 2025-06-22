<?php

namespace App\Events;

use App\Models\Post;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PostStatusChanged
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Post $post;
    public string $oldStatus;
    public string $newStatus;
    public ?string $adminNote;

    /**
     * Create a new event instance.
     */
    public function __construct(Post $post, string $oldStatus, string $newStatus, ?string $adminNote = null)
    {
        $this->post = $post;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
        $this->adminNote = $adminNote;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->post->user_id),
        ];
    }

    /**
     * Check if the post was approved.
     */
    public function wasApproved(): bool
    {
        return $this->newStatus === 'approved' && $this->oldStatus !== 'approved';
    }

    /**
     * Check if the post was rejected.
     */
    public function wasRejected(): bool
    {
        return $this->newStatus === 'rejected' && $this->oldStatus !== 'rejected';
    }

    /**
     * Get notification data for this event.
     */
    public function getNotificationData(): array
    {
        return [
            'post_id' => $this->post->id,
            'post_title' => $this->post->title,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
            'admin_note' => $this->adminNote,
            'post_url' => '/posts/' . $this->post->id,
        ];
    }
}

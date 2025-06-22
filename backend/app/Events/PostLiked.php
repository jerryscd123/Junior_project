<?php

namespace App\Events;

use App\Models\Like;
use App\Models\Post;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PostLiked
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Like $like;
    public Post $post;
    public User $liker;

    /**
     * Create a new event instance.
     */
    public function __construct(Like $like)
    {
        $this->like = $like;
        $this->post = $like->post;
        $this->liker = $like->user;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [];
        
        // Notify the post author if they exist and are not the liker
        if ($this->post->user_id && $this->post->user_id !== $this->like->user_id) {
            $channels[] = new PrivateChannel('user.' . $this->post->user_id);
        }
        
        return $channels;
    }

    /**
     * Get the post author (who should be notified).
     */
    public function getPostAuthor(): ?User
    {
        return $this->post->user;
    }

    /**
     * Get the liker display name.
     */
    public function getLikerName(): string
    {
        return $this->liker->getDisplayName();
    }

    /**
     * Check if the post is anonymous.
     */
    public function isPostAnonymous(): bool
    {
        return $this->post->is_anonymous || !$this->post->user;
    }

    /**
     * Get notification data for this event.
     */
    public function getNotificationData(): array
    {
        return [
            'like_id' => $this->like->id,
            'post_id' => $this->post->id,
            'post_title' => $this->post->title,
            'liker_name' => $this->getLikerName(),
            'liker_id' => $this->liker->id,
            'post_author_id' => $this->post->user_id,
            'post_url' => '/posts/' . $this->post->id,
            'total_likes' => $this->post->like_count,
        ];
    }
}

<?php

namespace App\Events;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommentCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Comment $comment;
    public Post $post;
    public ?User $commenter;

    /**
     * Create a new event instance.
     */
    public function __construct(Comment $comment)
    {
        $this->comment = $comment;
        $this->post = $comment->post;
        $this->commenter = $comment->user;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [];
        
        // Notify the post author if they exist and are not the commenter
        if ($this->post->user_id && $this->post->user_id !== $this->comment->user_id) {
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
     * Check if the comment is anonymous.
     */
    public function isAnonymous(): bool
    {
        return $this->comment->is_anonymous || !$this->commenter;
    }

    /**
     * Get the commenter display name.
     */
    public function getCommenterName(): string
    {
        return $this->comment->getAuthorName();
    }

    /**
     * Get notification data for this event.
     */
    public function getNotificationData(): array
    {
        return [
            'comment_id' => $this->comment->id,
            'post_id' => $this->post->id,
            'post_title' => $this->post->title,
            'commenter_name' => $this->getCommenterName(),
            'commenter_id' => $this->comment->user_id,
            'comment_content' => substr($this->comment->content, 0, 100) . (strlen($this->comment->content) > 100 ? '...' : ''),
            'is_anonymous' => $this->isAnonymous(),
            'post_url' => '/posts/' . $this->post->id,
            'comment_url' => '/posts/' . $this->post->id . '#comment-' . $this->comment->id,
        ];
    }
}

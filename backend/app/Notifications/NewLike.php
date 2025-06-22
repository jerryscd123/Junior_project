<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewLike extends Notification
{
    use Queueable;

    protected $like;
    protected $post;

    /**
     * Create a new notification instance.
     */
    public function __construct($like, $post)
    {
        $this->like = $like;
        $this->post = $post;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $likerName = $this->like->user->name ?? 'Someone';
        
        return (new MailMessage)
                    ->line($likerName . ' liked your post "' . $this->post->title . '"')
                    ->action('View Post', url('/posts/' . $this->post->id))
                    ->line('Thank you for sharing your thoughts with the Mindspeak community!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $likerName = $this->like->user->name ?? 'Someone';
        
        return [
            'type' => 'like',
            'data' => [
                'like_id' => $this->like->id,
                'post_id' => $this->post->id,
                'post_title' => $this->post->title,
                'liker_name' => $likerName,
                'liker_id' => $this->like->user_id,
                'message' => $likerName . ' liked your post "' . $this->post->title . '"',
            ]
        ];
    }
}

<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewComment extends Notification
{
    use Queueable;

    protected $comment;
    protected $post;

    /**
     * Create a new notification instance.
     */
    public function __construct($comment, $post)
    {
        $this->comment = $comment;
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
        $commenterName = $this->comment->is_anonymous ? 'Anonymous' : ($this->comment->user->name ?? 'Anonymous');
        
        return (new MailMessage)
                    ->line($commenterName . ' commented on your post "' . $this->post->title . '"')
                    ->line('"' . substr($this->comment->content, 0, 100) . (strlen($this->comment->content) > 100 ? '...' : '') . '"')
                    ->action('View Comment', url('/posts/' . $this->post->id))
                    ->line('Thank you for engaging with the Mindspeak community!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $commenterName = $this->comment->is_anonymous ? 'Anonymous' : ($this->comment->user->name ?? 'Anonymous');
        
        return [
            'type' => 'comment',
            'data' => [
                'comment_id' => $this->comment->id,
                'post_id' => $this->post->id,
                'post_title' => $this->post->title,
                'commenter_name' => $commenterName,
                'comment_preview' => substr($this->comment->content, 0, 100) . (strlen($this->comment->content) > 100 ? '...' : ''),
                'message' => $commenterName . ' commented on your post "' . $this->post->title . '"',
            ]
        ];
    }
}

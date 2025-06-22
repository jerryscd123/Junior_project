<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminMessage extends Notification
{
    use Queueable;

    protected $message;
    protected $adminName;

    /**
     * Create a new notification instance.
     */
    public function __construct($message, $adminName = 'Admin')
    {
        $this->message = $message;
        $this->adminName = $adminName;
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
        return (new MailMessage)
                    ->line('You have received a new message from ' . $this->adminName)
                    ->line('Subject: ' . $this->message->subject)
                    ->line(substr($this->message->content, 0, 200) . (strlen($this->message->content) > 200 ? '...' : ''))
                    ->action('View Message', url('/messages/' . $this->message->id))
                    ->line('Thank you for being part of the Mindspeak community!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'admin_message',
            'data' => [
                'message_id' => $this->message->id,
                'subject' => $this->message->subject,
                'admin_name' => $this->adminName,
                'content_preview' => substr($this->message->content, 0, 200) . (strlen($this->message->content) > 200 ? '...' : ''),
                'message' => 'You have received a new message from ' . $this->adminName . ': ' . $this->message->subject,
            ]
        ];
    }
}

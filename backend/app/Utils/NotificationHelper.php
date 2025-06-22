<?php

namespace App\Utils;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Collection;

class NotificationHelper
{
    /**
     * Supported notification types from the database migration
     */
    public const NOTIFICATION_TYPES = [
        'like',
        'comment',
        'admin_message',
        'post_approved',
        'post_rejected',
        'comment_approved',
        'comment_rejected',
    ];

    /**
     * Create a notification for a user
     *
     * @param int $userId
     * @param string $type
     * @param array $data
     * @return Notification|null
     */
    public static function createNotification(int $userId, string $type, array $data): ?Notification
    {
        if (!self::isValidNotificationType($type)) {
            return null;
        }

        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'data' => $data,
            'is_read' => false,
        ]);
    }

    /**
     * Create a like notification
     *
     * @param int $postOwnerId
     * @param int $likerId
     * @param int $postId
     * @param string $postTitle
     * @return Notification|null
     */
    public static function createLikeNotification(int $postOwnerId, int $likerId, int $postId, string $postTitle): ?Notification
    {
        // Don't notify if user liked their own post
        if ($postOwnerId === $likerId) {
            return null;
        }

        $liker = User::find($likerId);
        
        return self::createNotification($postOwnerId, 'like', [
            'message' => $liker ? "{$liker->name} liked your post" : "Someone liked your post",
            'post_id' => $postId,
            'post_title' => $postTitle,
            'liker_id' => $likerId,
            'liker_name' => $liker?->name ?? 'Anonymous',
        ]);
    }

    /**
     * Create a comment notification
     *
     * @param int $postOwnerId
     * @param int $commenterId
     * @param int $postId
     * @param string $postTitle
     * @param int $commentId
     * @return Notification|null
     */
    public static function createCommentNotification(int $postOwnerId, int $commenterId, int $postId, string $postTitle, int $commentId): ?Notification
    {
        // Don't notify if user commented on their own post
        if ($postOwnerId === $commenterId) {
            return null;
        }

        $commenter = User::find($commenterId);
        
        return self::createNotification($postOwnerId, 'comment', [
            'message' => $commenter ? "{$commenter->name} commented on your post" : "Someone commented on your post",
            'post_id' => $postId,
            'post_title' => $postTitle,
            'comment_id' => $commentId,
            'commenter_id' => $commenterId,
            'commenter_name' => $commenter?->name ?? 'Anonymous',
        ]);
    }

    /**
     * Create a post approved notification
     *
     * @param int $userId
     * @param int $postId
     * @param string $postTitle
     * @return Notification|null
     */
    public static function createPostApprovedNotification(int $userId, int $postId, string $postTitle): ?Notification
    {
        return self::createNotification($userId, 'post_approved', [
            'message' => "Your post '{$postTitle}' has been approved and is now live",
            'post_id' => $postId,
            'post_title' => $postTitle,
        ]);
    }

    /**
     * Create a post rejected notification
     *
     * @param int $userId
     * @param int $postId
     * @param string $postTitle
     * @param string $reason
     * @return Notification|null
     */
    public static function createPostRejectedNotification(int $userId, int $postId, string $postTitle, string $reason = ''): ?Notification
    {
        return self::createNotification($userId, 'post_rejected', [
            'message' => "Your post '{$postTitle}' has been rejected",
            'post_id' => $postId,
            'post_title' => $postTitle,
            'reason' => $reason,
        ]);
    }

    /**
     * Create a comment approved notification
     *
     * @param int $userId
     * @param int $commentId
     * @param int $postId
     * @param string $postTitle
     * @return Notification|null
     */
    public static function createCommentApprovedNotification(int $userId, int $commentId, int $postId, string $postTitle): ?Notification
    {
        return self::createNotification($userId, 'comment_approved', [
            'message' => "Your comment on '{$postTitle}' has been approved",
            'comment_id' => $commentId,
            'post_id' => $postId,
            'post_title' => $postTitle,
        ]);
    }

    /**
     * Create a comment rejected notification
     *
     * @param int $userId
     * @param int $commentId
     * @param int $postId
     * @param string $postTitle
     * @param string $reason
     * @return Notification|null
     */
    public static function createCommentRejectedNotification(int $userId, int $commentId, int $postId, string $postTitle, string $reason = ''): ?Notification
    {
        return self::createNotification($userId, 'comment_rejected', [
            'message' => "Your comment on '{$postTitle}' has been rejected",
            'comment_id' => $commentId,
            'post_id' => $postId,
            'post_title' => $postTitle,
            'reason' => $reason,
        ]);
    }

    /**
     * Create an admin message notification
     *
     * @param int $userId
     * @param string $subject
     * @param string $message
     * @param int|null $messageId
     * @return Notification|null
     */
    public static function createAdminMessageNotification(int $userId, string $subject, string $message, ?int $messageId = null): ?Notification
    {
        return self::createNotification($userId, 'admin_message', [
            'message' => "New message from admin: {$subject}",
            'subject' => $subject,
            'admin_message' => $message,
            'message_id' => $messageId,
        ]);
    }

    /**
     * Create notifications for multiple users
     *
     * @param array $userIds
     * @param string $type
     * @param array $data
     * @return Collection
     */
    public static function createBatchNotifications(array $userIds, string $type, array $data): Collection
    {
        $notifications = collect();

        foreach ($userIds as $userId) {
            $notification = self::createNotification($userId, $type, $data);
            if ($notification) {
                $notifications->push($notification);
            }
        }

        return $notifications;
    }

    /**
     * Mark notification as read
     *
     * @param int $notificationId
     * @param int $userId
     * @return bool
     */
    public static function markAsRead(int $notificationId, int $userId): bool
    {
        $notification = Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->first();

        if ($notification) {
            $notification->update(['is_read' => true]);
            return true;
        }

        return false;
    }

    /**
     * Mark all notifications as read for a user
     *
     * @param int $userId
     * @return int Number of notifications marked as read
     */
    public static function markAllAsRead(int $userId): int
    {
        return Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);
    }

    /**
     * Mark notifications as read by type
     *
     * @param int $userId
     * @param string $type
     * @return int Number of notifications marked as read
     */
    public static function markAsReadByType(int $userId, string $type): int
    {
        if (!self::isValidNotificationType($type)) {
            return 0;
        }

        return Notification::where('user_id', $userId)
            ->where('type', $type)
            ->where('is_read', false)
            ->update(['is_read' => true]);
    }

    /**
     * Get unread notifications count for a user
     *
     * @param int $userId
     * @return int
     */
    public static function getUnreadCount(int $userId): int
    {
        return Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->count();
    }

    /**
     * Get unread notifications count by type
     *
     * @param int $userId
     * @param string $type
     * @return int
     */
    public static function getUnreadCountByType(int $userId, string $type): int
    {
        if (!self::isValidNotificationType($type)) {
            return 0;
        }

        return Notification::where('user_id', $userId)
            ->where('type', $type)
            ->where('is_read', false)
            ->count();
    }

    /**
     * Delete old notifications
     *
     * @param int $daysOld
     * @return int Number of deleted notifications
     */
    public static function deleteOldNotifications(int $daysOld = 30): int
    {
        return Notification::where('created_at', '<', now()->subDays($daysOld))
            ->delete();
    }

    /**
     * Delete notifications for a specific post
     *
     * @param int $postId
     * @return int Number of deleted notifications
     */
    public static function deletePostNotifications(int $postId): int
    {
        return Notification::whereJsonContains('data->post_id', $postId)
            ->delete();
    }

    /**
     * Delete notifications for a specific comment
     *
     * @param int $commentId
     * @return int Number of deleted notifications
     */
    public static function deleteCommentNotifications(int $commentId): int
    {
        return Notification::whereJsonContains('data->comment_id', $commentId)
            ->delete();
    }

    /**
     * Check if notification type is valid
     *
     * @param string $type
     * @return bool
     */
    public static function isValidNotificationType(string $type): bool
    {
        return in_array($type, self::NOTIFICATION_TYPES);
    }

    /**
     * Get all supported notification types
     *
     * @return array
     */
    public static function getSupportedTypes(): array
    {
        return self::NOTIFICATION_TYPES;
    }

    /**
     * Get notification statistics for a user
     *
     * @param int $userId
     * @return array
     */
    public static function getNotificationStats(int $userId): array
    {
        $stats = [];
        
        foreach (self::NOTIFICATION_TYPES as $type) {
            $stats[$type] = [
                'total' => Notification::where('user_id', $userId)->where('type', $type)->count(),
                'unread' => Notification::where('user_id', $userId)->where('type', $type)->where('is_read', false)->count(),
            ];
        }

        $stats['overall'] = [
            'total' => Notification::where('user_id', $userId)->count(),
            'unread' => Notification::where('user_id', $userId)->where('is_read', false)->count(),
        ];

        return $stats;
    }
} 
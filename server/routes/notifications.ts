import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';

export const notificationsRouter = Router();

/**
 * GET /api/notifications
 * Get authenticated user's notifications and unread count
 */
notificationsRouter.get('/notifications', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { limit, offset, unreadOnly } = req.query as { limit?: string; offset?: string; unreadOnly?: string };

    const parsedLimit = limit ? Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100) : 20;
    const parsedOffset = offset ? Math.max(parseInt(offset, 10) || 0, 0) : 0;
    const isUnreadOnly = unreadOnly === 'true' || unreadOnly === '1';

    const result = NotificationService.getUserNotifications(user.id, parsedLimit, parsedOffset, isUnreadOnly);

    return res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.', error: err.message });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
notificationsRouter.patch('/notifications/:id/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const updated = NotificationService.markAsRead(id, user.id);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Notification not found or does not belong to user.' });
    }

    const unreadCount = NotificationService.getUnreadCount(user.id);

    return res.json({
      success: true,
      message: 'Notification marked as read.',
      unreadCount,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update notification.', error: err.message });
  }
});

/**
 * POST /api/notifications/read-all
 * Mark all user notifications as read
 */
notificationsRouter.post('/notifications/read-all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const count = NotificationService.markAllAsRead(user.id);

    return res.json({
      success: true,
      message: `Marked ${count} notifications as read.`,
      unreadCount: 0,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to mark notifications as read.', error: err.message });
  }
});

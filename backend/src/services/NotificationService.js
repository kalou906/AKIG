/**
 * services/NotificationService.js
 * Service for managing notifications (real-time, email, SMS)
 * Handles notification creation, delivery, and tracking
 */

const nodemailer = require('nodemailer');

class NotificationService {
  constructor(pool, redisClient) {
    this.pool = pool;
    this.redisClient = redisClient;
    
    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  /**
   * Create and send a notification
   * @param {number} userId - User ID
   * @param {string} type - Notification type (email, sms, push, in-app)
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} data - Additional data
   * @returns {Object} Created notification
   */
  async sendNotification(userId, type, title, message, data = {}) {
    const client = await this.pool.connect();
    
    try {
      // Store notification in database
      const result = await client.query(
        `INSERT INTO notifications 
         (user_id, type, title, message, data, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
         RETURNING *`,
        [userId, type, title, message, JSON.stringify(data), 'pending']
      );

      const notification = result.rows[0];

      // Route to appropriate delivery channel
      switch (type) {
        case 'email':
          await this.sendEmailNotification(userId, notification);
          break;
        case 'sms':
          await this.sendSMSNotification(userId, notification);
          break;
        case 'push':
          await this.sendPushNotification(userId, notification);
          break;
        case 'in-app':
          await this.sendInAppNotification(userId, notification);
          break;
        default:
          await this.sendInAppNotification(userId, notification);
      }

      // Cache recent notifications
      await this.redisClient.setex(
        `user:${userId}:notifications`,
        3600,
        JSON.stringify({ id: notification.id, title, message })
      );

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Send email notification
   * @private
   */
  async sendEmailNotification(userId, notification) {
    try {
      // Get user email
      const userResult = await this.pool.query(
        'SELECT email, name FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      const emailContent = {
        from: process.env.SMTP_FROM || 'noreply@akig.com',
        to: user.email,
        subject: notification.title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${notification.title}</h2>
            <p style="color: #666; line-height: 1.6;">${notification.message}</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999;">
              <p>Sent by AKIG System</p>
            </div>
          </div>
        `,
        text: `${notification.title}\n\n${notification.message}`
      };

      // Send email
      await this.emailTransporter.sendMail(emailContent);

      // Mark notification as sent
      await this.pool.query(
        `UPDATE notifications 
         SET status = $1, sent_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        ['sent', notification.id]
      );

      console.log(`Email sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending email notification:', error);
      
      // Update status to failed
      await this.pool.query(
        `UPDATE notifications 
         SET status = $1, error_message = $2 
         WHERE id = $3`,
        ['failed', error.message, notification.id]
      );
    }
  }

  /**
   * Send SMS notification
   * @private
   */
  async sendSMSNotification(userId, notification) {
    try {
      // Get user phone
      const userResult = await this.pool.query(
        `SELECT phone FROM user_contacts 
         WHERE user_id = $1 AND is_primary = true`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        console.warn(`No phone number found for user ${userId}`);
        return;
      }

      const phone = userResult.rows[0].phone;

      // SMS integration (e.g., Twilio)
      // For now, just log and mark as sent
      console.log(`SMS would be sent to ${phone}: ${notification.message}`);

      // Mark notification as sent
      await this.pool.query(
        `UPDATE notifications 
         SET status = $1, sent_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        ['sent', notification.id]
      );
    } catch (error) {
      console.error('Error sending SMS notification:', error);

      await this.pool.query(
        `UPDATE notifications 
         SET status = $1, error_message = $2 
         WHERE id = $3`,
        ['failed', error.message, notification.id]
      );
    }
  }

  /**
   * Send push notification
   * @private
   */
  async sendPushNotification(userId, notification) {
    try {
      // Get user devices
      const devicesResult = await this.pool.query(
        `SELECT device_token FROM user_devices 
         WHERE user_id = $1 AND is_active = true`,
        [userId]
      );

      if (devicesResult.rows.length === 0) {
        console.warn(`No active devices found for user ${userId}`);
        return;
      }

      // Send to each device (Firebase Cloud Messaging, APNs, etc.)
      for (const device of devicesResult.rows) {
        // Implementation depends on your push service
        console.log(`Push notification would be sent to device: ${device.device_token}`);
      }

      // Mark notification as sent
      await this.pool.query(
        `UPDATE notifications 
         SET status = $1, sent_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        ['sent', notification.id]
      );
    } catch (error) {
      console.error('Error sending push notification:', error);

      await this.pool.query(
        `UPDATE notifications 
         SET status = $1, error_message = $2 
         WHERE id = $3`,
        ['failed', error.message, notification.id]
      );
    }
  }

  /**
   * Send in-app notification
   * @private
   */
  async sendInAppNotification(userId, notification) {
    try {
      // Mark as sent immediately for in-app
      await this.pool.query(
        `UPDATE notifications 
         SET status = $1, sent_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        ['sent', notification.id]
      );

      // Cache for real-time delivery
      await this.redisClient.lpush(
        `user:${userId}:inapp-queue`,
        JSON.stringify(notification)
      );

      console.log(`In-app notification queued for user ${userId}`);
    } catch (error) {
      console.error('Error sending in-app notification:', error);

      await this.pool.query(
        `UPDATE notifications 
         SET status = $1, error_message = $2 
         WHERE id = $3`,
        ['failed', error.message, notification.id]
      );
    }
  }

  /**
   * Get unread notifications for user
   * @param {number} userId - User ID
   * @param {number} limit - Max results
   * @returns {Array} Unread notifications
   */
  async getUnreadNotifications(userId, limit = 50) {
    try {
      const result = await this.pool.query(
        `SELECT id, type, title, message, status, created_at, data
         FROM notifications
         WHERE user_id = $1 AND is_read = false
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Error retrieving unread notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {number} notificationId - Notification ID
   */
  async markAsRead(notificationId) {
    try {
      await this.pool.query(
        `UPDATE notifications 
         SET is_read = true, read_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [notificationId]
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for user
   * @param {number} userId - User ID
   */
  async markAllAsRead(userId) {
    try {
      await this.pool.query(
        `UPDATE notifications 
         SET is_read = true, read_at = CURRENT_TIMESTAMP 
         WHERE user_id = $1 AND is_read = false`,
        [userId]
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get notification count (unread)
   * @param {number} userId - User ID
   * @returns {number} Unread count
   */
  async getUnreadCount(userId) {
    try {
      // Check cache first
      const cached = await this.redisClient.get(`user:${userId}:unread-count`);
      if (cached) {
        return parseInt(cached);
      }

      // Query database
      const result = await this.pool.query(
        `SELECT COUNT(*) as count 
         FROM notifications 
         WHERE user_id = $1 AND is_read = false`,
        [userId]
      );

      const count = result.rows[0].count;

      // Cache for 5 minutes
      await this.redisClient.setex(
        `user:${userId}:unread-count`,
        300,
        count.toString()
      );

      return count;
    } catch (error) {
      console.error('Error retrieving unread count:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   * @param {number} notificationId - Notification ID
   */
  async deleteNotification(notificationId) {
    try {
      await this.pool.query(
        'DELETE FROM notifications WHERE id = $1',
        [notificationId]
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Create bulk notifications (for announcements, etc.)
   * @param {Array<number>} userIds - Array of user IDs
   * @param {string} type - Notification type
   * @param {string} title - Title
   * @param {string} message - Message
   * @param {Object} data - Additional data
   */
  async sendBulkNotification(userIds, type, title, message, data = {}) {
    try {
      const notifications = [];

      for (const userId of userIds) {
        const notification = await this.sendNotification(
          userId,
          type,
          title,
          message,
          data
        );
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;

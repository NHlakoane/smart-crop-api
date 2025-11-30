import client from "../config/db.js";

class NotificationService {
  // CREATE notification
  async createNotification(notificationData) {
    try {
      const result = await client.query(
        `INSERT INTO notifications (user_id, message, link, is_read, created_at)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
        [
          notificationData.user_id,
          notificationData.message,
          notificationData.link,
          notificationData.is_read || false,
          notificationData.created_at || new Date(),
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Create notification error:", error);
      throw new Error("Failed to create notification");
    }
  }

  // CREATE multiple notifications
  async createMultipleNotifications(notificationsData) {
    try {
      await client.query("BEGIN");

      const values = [];
      const valuePlaceholders = [];
      let paramCount = 0;

      for (const notification of notificationsData) {
        const valueSet = [];
        valueSet.push(notification.user_id);
        valueSet.push(notification.message);
        valueSet.push(notification.link);
        valueSet.push(notification.is_read || false);
        valueSet.push(notification.created_at || new Date());

        values.push(...valueSet);
        valuePlaceholders.push(
          `($${++paramCount}, $${++paramCount}, $${++paramCount}, $${++paramCount}, $${++paramCount})`
        );
      }

      const result = await client.query(
        `INSERT INTO notifications (user_id, message, link, is_read, created_at)
                 VALUES ${valuePlaceholders.join(", ")}
                 RETURNING *`,
        values
      );

      await client.query("COMMIT");
      return result.rows;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Create multiple notifications error:", error);
      throw new Error("Failed to create multiple notifications");
    }
  }

  // READ notification by ID
  async findNotificationById(id) {
    try {
      const result = await client.query(
        `SELECT n.*, u.names as user_name, u.email as user_email
                 FROM notifications n
                 LEFT JOIN users u ON n.user_id = u.user_id
                 WHERE n.notification_id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Find notification by ID error:", error);
      throw new Error("Failed to fetch notification by ID");
    }
  }

  // READ all notifications for a user
  async findNotificationsByUserId(userId, filters = {}) {
    try {
      let query = `
                SELECT n.* 
                FROM notifications n
                WHERE n.user_id = $1
            `;
      const values = [userId];
      let paramCount = 1;

      if (filters.is_read !== undefined) {
        paramCount++;
        query += ` AND n.is_read = $${paramCount}`;
        values.push(filters.is_read);
      }

      if (filters.limit) {
        paramCount++;
        query += ` ORDER BY n.created_at DESC LIMIT $${paramCount}`;
        values.push(filters.limit);
      } else {
        query += ` ORDER BY n.created_at DESC`;
      }

      const result = await client.query(query, values);
      return result.rows;
    } catch (error) {
      console.error("Find notifications by user ID error:", error);
      throw new Error("Failed to fetch notifications by user");
    }
  }

  // READ unread notifications count for a user
  async getUnreadCount(userId) {
    try {
      const result = await client.query(
        `SELECT COUNT(*) as unread_count
                 FROM notifications
                 WHERE user_id = $1 AND is_read = false`,
        [userId]
      );
      return parseInt(result.rows[0].unread_count);
    } catch (error) {
      console.error("Get unread count error:", error);
      throw new Error("Failed to get unread notifications count");
    }
  }

  // UPDATE notification (mark as read)
  async markAsRead(id) {
    try {
      const result = await client.query(
        `UPDATE notifications 
                 SET is_read = true, read_at = CURRENT_TIMESTAMP
                 WHERE notification_id = $1
                 RETURNING *`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Mark notification as read error:", error);
      throw new Error("Failed to mark notification as read");
    }
  }

  // UPDATE multiple notifications as read
  async markMultipleAsRead(notificationIds) {
    try {
      const result = await client.query(
        `UPDATE notifications 
                 SET is_read = true, read_at = CURRENT_TIMESTAMP
                 WHERE notification_id = ANY($1)
                 RETURNING *`,
        [notificationIds]
      );
      return result.rows;
    } catch (error) {
      console.error("Mark multiple notifications as read error:", error);
      throw new Error("Failed to mark multiple notifications as read");
    }
  }

  async markAllAsRead(userId) {
    try {
      const result = await client.query(
        `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_read = false`,
        [userId]
      );

      return result.rowCount;
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
      throw new Error("Failed to mark all notifications as read");
    }
  }

  // DELETE notification
  async deleteNotification(id) {
    try {
      const result = await client.query(
        `DELETE FROM notifications WHERE notification_id = $1 RETURNING notification_id`,
        [id]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.log("Delete notification error:", error);
      throw new Error("Failed to delete notification");
    }
  }

  async deleteAllNotification(userId) {
    try {
      const result = await client.query(
        `DELETE FROM notifications 
WHERE user_id = $1 
RETURNING notification_id;
`,
        [userId]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.log("Delete notification error:", error);
      throw new Error("Failed to delete notification");
    }
  }

  // DELETE all notifications for a user
  async deleteAllUserNotifications(userId) {
    try {
      const result = await client.query(
        `DELETE FROM notifications WHERE user_id = $1 RETURNING COUNT(*) as deleted_count`,
        [userId]
      );
      return parseInt(result.rows[0].deleted_count);
    } catch (error) {
      console.error("Delete all user notifications error:", error);
      throw new Error("Failed to delete all user notifications");
    }
  }

  // GET recent notifications with pagination
  async findRecentNotifications(limit = 20, offset = 0) {
    try {
      const result = await client.query(
        `SELECT n.*, u.names as user_name
                 FROM notifications n
                 LEFT JOIN users u ON n.user_id = u.user_id
                 ORDER BY n.created_at DESC
                 LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      return result.rows;
    } catch (error) {
      console.error("Find recent notifications error:", error);
      throw new Error("Failed to fetch recent notifications");
    }
  }

  // GET notifications by date range
  async findNotificationsByDateRange(startDate, endDate, userId = null) {
    try {
      let query = `
                SELECT n.*, u.names as user_name
                FROM notifications n
                LEFT JOIN users u ON n.user_id = u.user_id
                WHERE n.created_at BETWEEN $1 AND $2
            `;
      const values = [startDate, endDate];
      let paramCount = 2;

      if (userId) {
        paramCount++;
        query += ` AND n.user_id = $${paramCount}`;
        values.push(userId);
      }

      query += ` ORDER BY n.created_at DESC`;

      const result = await client.query(query, values);
      return result.rows;
    } catch (error) {
      console.error("Find notifications by date range error:", error);
      throw new Error("Failed to fetch notifications by date range");
    }
  }

  // CREATE system notification for multiple users
  async createSystemNotification(message, link, userIds) {
    try {
      await client.query("BEGIN");

      const notifications = userIds.map((userId) => ({
        user_id: userId,
        message,
        link,
        is_read: false,
      }));

      const createdNotifications = await this.createMultipleNotifications(
        notifications
      );
      await client.query("COMMIT");

      return createdNotifications;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Create system notification error:", error);
      throw new Error("Failed to create system notification");
    }
  }
}

export default NotificationService;

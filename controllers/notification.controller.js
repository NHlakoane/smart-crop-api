import NotificationService from "../services/notification.service.js";

export class NotificationController {
  constructor() {
    this.notificationService = new NotificationService();
    this.createNotification = this.createNotification.bind(this);
    this.getNotification = this.getNotification.bind(this);
    this.getUserNotifications = this.getUserNotifications.bind(this);
    this.getUnreadCount = this.getUnreadCount.bind(this);
    this.markAsRead = this.markAsRead.bind(this);
    this.markAllAsRead = this.markAllAsRead.bind(this);
    this.deleteNotification = this.deleteNotification.bind(this);
    this.getRecentNotifications = this.getRecentNotifications.bind(this);
    this.createSystemNotification = this.createSystemNotification.bind(this);
  }

  async createNotification(req, res) {
    try {
      const { user_id, message, link, is_read } = req.body;

      if (!user_id || !message) {
        return res.status(400).json({
          success: false,
          message: "User ID and message are required",
        });
      }

      const notificationData = {
        user_id,
        message,
        link,
        is_read,
      };

      const newNotification = await this.notificationService.createNotification(
        notificationData
      );

      return res.status(201).json({
        success: true,
        message: "Notification created successfully",
        data: newNotification,
      });
    } catch (error) {
      console.error("Create notification error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getNotification(req, res) {
    try {
      const { id } = req.params;
      const notification = await this.notificationService.findNotificationById(
        parseInt(id)
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      // Check if user has access to this notification
      if (
        req.user.user_id !== notification.user_id &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      return res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      console.error("Get notification error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getUserNotifications(req, res) {
    try {
      const userId = req.user.userId;

      const { is_read, limit } = req.query;

      const filters = {};
      if (is_read !== undefined) filters.is_read = is_read === "true";
      if (limit) filters.limit = parseInt(limit);

      const notifications =
        await this.notificationService.findNotificationsByUserId(
          parseInt(userId),
          filters
        );

      return res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      console.error("Get user notifications error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getUnreadCount(req, res) {
    try {
      const { userId } = req.params;

      // Check if user is accessing their own count or is admin
      if (req.user.user_id !== parseInt(userId) && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const count = await this.notificationService.getUnreadCount(
        parseInt(userId)
      );

      return res.status(200).json({
        success: true,
        data: { unread_count: count },
      });
    } catch (error) {
      console.error("Get unread count error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const notification = await this.notificationService.findNotificationById(
        parseInt(id)
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      // Check if user has access to this notification
      if (
        req.user.userId !== notification.user_id &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const updatedNotification = await this.notificationService.markAsRead(
        parseInt(id)
      );

      return res.status(200).json({
        success: true,
        message: "Notification marked as read",
        data: updatedNotification,
      });
    } catch (error) {
      console.error("Mark as read error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const userId = req.user.userId;

      const updatedCount = await this.notificationService.markAllAsRead(
        parseInt(userId)
      );

      return res.status(200).json({
        success: true,
        message: `${updatedCount} notifications marked as read`,
        data: { updated_count: updatedCount },
      });
    } catch (error) {
      console.error("Mark all as read error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const notification = await this.notificationService.findNotificationById(
        parseInt(id)
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      // Check if user has access to this notification
      if (
        req.user.user_id !== notification.user_id &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const deleted = await this.notificationService.deleteNotification(
        parseInt(id)
      );

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
      });
    } catch (error) {
      console.error("Delete notification error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async deleteAllNotification(req, res) {
        try {
      const id = req.params.userId;

      // Check if user has access to this notification
      if (
        req.user.user_id !== id &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const deleted = await this.notificationService.deleteAllNotification(parseInt(req.user.user_id)
      );

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Notifications not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Notifications deleted successfully",
      });
    } catch (error) {
      console.error("Delete notification error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getRecentNotifications(req, res) {
    try {
      const { limit, offset } = req.query;
      const notifications =
        await this.notificationService.findRecentNotifications(
          parseInt(limit) || 20,
          parseInt(offset) || 0
        );

      return res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      console.error("Get recent notifications error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async createSystemNotification(req, res) {
    try {
      const { message, link, user_ids } = req.body;

      if (!message || !user_ids || !Array.isArray(user_ids)) {
        return res.status(400).json({
          success: false,
          message: "Message and user IDs array are required",
        });
      }

      // Only admin can create system notifications
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admin can create system notifications",
        });
      }

      const notifications =
        await this.notificationService.createSystemNotification(
          message,
          link,
          user_ids
        );

      return res.status(201).json({
        success: true,
        message: "System notifications created successfully",
        data: { created_count: notifications.length },
      });
    } catch (error) {
      console.error("Create system notification error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}

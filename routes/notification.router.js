import express from "express";
import { NotificationController } from "../controllers/notification.controller.js";
import UserMiddleware from "../middleware/user.middleware.js";

const notificationRouter = express.Router();
const notificationController = new NotificationController();
const userMiddleware = new UserMiddleware();

// Apply authentication to all notification routes
notificationRouter.use(userMiddleware.authenticate());

// Routes
notificationRouter.post("/", 
  userMiddleware.authorize(['admin', 'manager', 'farmer']),
  notificationController.createNotification.bind(notificationController)
);

notificationRouter.post("/system", 
  userMiddleware.authorize(['admin']),
  notificationController.createSystemNotification.bind(notificationController)
);

notificationRouter.get("/user", 
  notificationController.getUserNotifications.bind(notificationController)
);

notificationRouter.get("/user/:userId/unread", 
  notificationController.getUnreadCount.bind(notificationController)
);

notificationRouter.get("/recent", 
  userMiddleware.authorize(['admin']),
  notificationController.getRecentNotifications.bind(notificationController)
);

notificationRouter.get("/:id", 
  notificationController.getNotification.bind(notificationController)
);

notificationRouter.patch("/:id/read", 
  notificationController.markAsRead.bind(notificationController)
);

notificationRouter.patch("/read-all", 
  notificationController.markAllAsRead.bind(notificationController)
);

notificationRouter.delete("/:id", 
  notificationController.deleteNotification.bind(notificationController)
);

notificationRouter.delete("/all/:userId", 
  notificationController.deleteAllNotification.bind(notificationController)
);

export default notificationRouter;
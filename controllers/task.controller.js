import NotificationService from "../services/notification.service.js";
import TaskService from "../services/task.service.js";
import { UserService } from "../services/user.service.js";

class TaskController {
  constructor() {
    this.taskService = new TaskService();
    this.notificationService = new NotificationService();
    this.userService = new UserService();
  }

  async createTask(req, res) {
    try {
      const taskData = {
        ...req.body,
        assigned_by: req.user.userId,
      };

      const task = await this.taskService.createTask(taskData);

      await this.notificationService.createNotification({
        user_id: taskData.assigned_to,
        message: taskData.description,
      });

      res.status(201).json({
        success: true,
        data: task,
        message: "Task created successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getTask(req, res) {
    try {
      const task = await this.taskService.getTaskById(req.params.id);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      // Check if user has access to this task
      if (
        task.assigned_to !== req.user.userId &&
        task.assigned_by !== req.user.userId &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getUserTasks(req, res) {
    try {
      const filters = {
        status: req.query.status,
        priority: req.query.priority,
      };

      const tasks = await this.taskService.getTasksByUser(
        req.user.userId,
        filters
      );

      res.json({
        success: true,
        data: tasks,
        count: tasks.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getAssignedTasks(req, res) {
    try {
      // Only managers and admins can see tasks they assigned
      if (!["manager", "admin"].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Only managers and admins can view assigned tasks.",
        });
      }

      const filters = {
        status: req.query.status,
      };

      const tasks = await this.taskService.getTasksAssignedByUser(
        req.user.userId,
        filters
      );

      res.json({
        success: true,
        data: tasks,
        count: tasks.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateTask(req, res) {
    try {
      const taskId = req.params.id;
      const updates = req.body;

      // Get current task to check permissions
      const currentTask = await this.taskService.getTaskById(taskId);

      if (!currentTask) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      // Check permissions
      const canUpdate =
        currentTask.assigned_to === req.user.userId ||
        currentTask.assigned_by === req.user.userId ||
        req.user.role === "admin";

      if (!canUpdate) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const updatedTask = await this.taskService.updateTask(taskId, updates);

      if (updates.status === "completed") {
        // Notify the assigned user 
        await this.notificationService.createNotification({
          user_id: updatedTask.assigned_to,
          message: `Congratulations for completing "${updatedTask.title}" Task.`,
        });

        // Notify the assigner
        await this.notificationService.createNotification({
          user_id: updatedTask.assigned_by,
          message: `Task "${updatedTask.title}" has been completed.`,
        });
      } else if (Object.keys(updates).length > 0) {
        // Notify user that task was updated
        await this.notificationService.createNotification({
          user_id: updatedTask.assigned_to,
          message: `Task "${updatedTask.title}" has been updated.`,
        });

        // Notify the assigner
        await this.notificationService.createNotification({
          user_id: updatedTask.assigned_by,
          message: `Task "${updatedTask.title}" has been updated.`,
        });
      }

      return res.json({
        success: true,
        data: updatedTask,
        message: "Task updated successfully",
      });
    } catch (error) {
        console.log(error);
        
      return res.status(400).json({
        success: false,
        message: 'Something went wrong, try again later',
      });
    }
  }

  async deleteTask(req, res) {
    try {
      const taskId = req.params.id;
      const task = await this.taskService.getTaskById(taskId);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      // Only the assigner or admin can delete tasks
      if (task.assigned_by !== req.user.userId && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Only the task assigner or admin can delete tasks.",
        });
      }

      await this.taskService.deleteTask(taskId);

      res.json({
        success: true,
        message: "Task deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async addComment(req, res) {
    try {
      const { comment } = req.body;
      const taskId = req.params.id;
      const userId = req.user.userId;

      const task = await this.taskService.getTaskById(taskId);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      // Check if user is involved in this task
      const isInvolved =
        task.assigned_to === userId ||
        task.assigned_by === userId ||
        req.user.role === "admin";

      if (!isInvolved) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const user = await this.userService.findUserById(userId);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      const taskComment = await this.taskService.addTaskComment(
        taskId,
        userId,
        comment
      );

      // Send notification to the other party
      const notificationRecipient =
        task.assigned_to === userId ? task.assigned_by : task.assigned_to;
      await this.notificationService.createNotification({
        user_id: notificationRecipient,
        message: `New comment on task "${task.title}" by ${user.names}`,
      });

      return res.status(201).json({
        success: true,
        data: taskComment,
        message: "Comment added successfully",
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getComments(req, res) {
    try {
      const taskId = req.params.id;
      const task = await this.taskService.getTaskById(taskId);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      // Check if user has access to this task
      if (
        task.assigned_to !== req.user.userId &&
        task.assigned_by !== req.user.userId &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const comments = await this.taskService.getTaskComments(taskId);

      res.json({
        success: true,
        data: comments,
        count: comments.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getTaskTemplates(_req, res) {
  try {
    const taskTemplates = await this.taskService.getTaskTemplates();
    return res.json({
      success: true,
      data: taskTemplates,
    });
  } catch (error) {
    console.log("Error fetching task templates:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, try again later",
    });
  }
}
}

export default TaskController;

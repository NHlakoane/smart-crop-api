import express from "express";
import UserMiddleware from "../middleware/user.middleware.js";
import TaskController from "../controllers/task.controller.js";
;

const taskRouter = express.Router();

const userMiddleware = new UserMiddleware();
const taskController = new TaskController();

// Apply auth middleware to all routes
taskRouter.use(userMiddleware.authenticate());

// Task Templates
taskRouter.get("/task-templates", taskController.getTaskTemplates.bind(taskController));

// Task routes
taskRouter.post("/", taskController.createTask.bind(taskController));
taskRouter.get("/my-tasks", taskController.getUserTasks.bind(taskController));
taskRouter.get("/assigned", taskController.getAssignedTasks.bind(taskController));
taskRouter.get("/:id", taskController.getTask.bind(taskController));
taskRouter.put("/:id", taskController.updateTask.bind(taskController));

// Comment routes
taskRouter.post("/:id/comments", taskController.addComment.bind(taskController));
taskRouter.get("/:id/comments", taskController.getComments.bind(taskController));

export default taskRouter;

import express from "express";
import UserMiddleware from "../middleware/user.middleware.js";
import StatsController from "../controllers/stats.controller.js";

const statsRouter = express.Router();
const userMiddleware = new UserMiddleware();
const statsController = new StatsController();

// Apply authentication to all stats routes
statsRouter.use(userMiddleware.authenticate());

// Crop 
statsRouter.get("/crops", 
  statsController.getCropStats.bind(statsController)
);

// Tasks
statsRouter.get('/tasks', 
    statsController.getTaskStats.bind(statsController)
);
export default statsRouter;
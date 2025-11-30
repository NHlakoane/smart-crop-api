import express from "express";
import authRouter from "./auth.router.js";
import userRouter from "./user.router.js";
import fieldRouter from "./fields.router.js";
import cropRouter from "./crops.router.js";
import taskRouter from "./task.router.js";
import notificationRouter from "./notification.router.js";
import fertilizerRouter from "./fertilizer.router.js";
import reportRouter from "./report.router.js";
import performanceScoreRouter from "./performance-score.router.js";
import statsRouter from "./stats.router.js";
import pesticideRouter from "./pesticides.router.js";

const mainRouter = express.Router();

mainRouter.use("/auth", authRouter); 
mainRouter.use("/users", userRouter);
mainRouter.use("/fields", fieldRouter);
mainRouter.use("/crops", cropRouter);
mainRouter.use("/fertilizers", fertilizerRouter);
mainRouter.use("/tasks", taskRouter);
mainRouter.use("/notifications", notificationRouter);
mainRouter.use("/reports", reportRouter);
mainRouter.use("/performance", performanceScoreRouter);
mainRouter.use("/stats", statsRouter);
mainRouter.use("/pesticides", pesticideRouter);

export default mainRouter;

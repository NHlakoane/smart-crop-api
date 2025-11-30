import express from "express";
import { ReportController } from "../controllers/report.controller.js";
import UserMiddleware from "../middleware/user.middleware.js";

const reportRouter = express.Router();
const reportController = new ReportController();
const userMiddleware = new UserMiddleware();

// Apply authentication to all report routes
reportRouter.use(userMiddleware.authenticate());

// Routes
reportRouter.post("/", 
  userMiddleware.authorize(['admin', 'manager', 'farmer']),
  reportController.createReport.bind(reportController)
);

reportRouter.get("/", reportController.getAllReports.bind(reportController));
reportRouter.get("/stats", reportController.getReportStats.bind(reportController));
reportRouter.get("/pest-outbreaks", reportController.getPestOutbreakReports.bind(reportController));
reportRouter.get("/date-range", reportController.getReportsByDateRange.bind(reportController));
reportRouter.get("/user/:userId", reportController.getUserReports.bind(reportController));
reportRouter.get("/field/:fieldId", reportController.getFieldReports.bind(reportController));
reportRouter.get("/crop/:cropId", reportController.getCropReports.bind(reportController));
reportRouter.get("/crop/:cropId/latest", reportController.getLatestCropReport.bind(reportController));
reportRouter.get("/stage/:stage", reportController.getReportsByStage.bind(reportController));
reportRouter.get("/:id", reportController.getReport.bind(reportController));
reportRouter.put("/:id", 
  userMiddleware.authorize(['admin', 'manager', 'farmer']),
  reportController.updateReport.bind(reportController)
);
reportRouter.delete("/:id", 
  userMiddleware.authorize(['admin', 'manager', 'farmer']),
  reportController.deleteReport.bind(reportController)
);

export default reportRouter;
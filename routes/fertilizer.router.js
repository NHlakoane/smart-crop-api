import express from "express";
import { FertilizerController } from "../controllers/fertilizer.controller.js";
import UserMiddleware from "../middleware/user.middleware.js";

const fertilizerRouter = express.Router();
const fertilizerController = new FertilizerController();
const userMiddleware = new UserMiddleware();

// Apply authentication to all fertilizer routes
fertilizerRouter.use(userMiddleware.authenticate());

// Routes
fertilizerRouter.post("/", 
  userMiddleware.authorize(['admin', 'manager', 'farmer']),
  fertilizerController.createFertilizer.bind(fertilizerController)
);

fertilizerRouter.get("/", fertilizerController.getAllFertilizers.bind(fertilizerController));
fertilizerRouter.get("/stats", fertilizerController.getFertilizerStats.bind(fertilizerController));
fertilizerRouter.get("/recent", fertilizerController.getRecentApplications.bind(fertilizerController));
fertilizerRouter.get("/expired", fertilizerController.getExpiredFertilizers.bind(fertilizerController));
fertilizerRouter.get("/expiring", fertilizerController.getExpiringFertilizers.bind(fertilizerController));
fertilizerRouter.get("/crop/:cropId", fertilizerController.getCropFertilizers.bind(fertilizerController));
fertilizerRouter.get("/field/:fieldId", fertilizerController.getFieldFertilizers.bind(fertilizerController));
fertilizerRouter.get("/manufacturer/:manufacturer", fertilizerController.getManufacturerFertilizers.bind(fertilizerController));
fertilizerRouter.get("/:id", fertilizerController.getFertilizerById.bind(fertilizerController));
fertilizerRouter.put("/:id", 
  userMiddleware.authorize(['admin', 'manager', 'farmer']),
  fertilizerController.updateFertilizer.bind(fertilizerController)
);
fertilizerRouter.delete("/:id", 
  userMiddleware.authorize(['admin', 'manager']),
  fertilizerController.deleteFertilizer.bind(fertilizerController)
);

fertilizerRouter.post("/assign-to-crops", 
  userMiddleware.authorize(['admin', 'manager', 'farmer']),
  fertilizerController.assignFertilizerToCrops.bind(fertilizerController)
);

fertilizerRouter.get("/crop-fertilizers/assignments", 
  fertilizerController.getAllCropFertilizerAssignments.bind(fertilizerController)
);

fertilizerRouter.delete("/crop-fertilizers/:cropId/:fertId",
  userMiddleware.authorize(['admin', 'manager', 'farmer']),
  fertilizerController.deleteCropFertilizerAssignment.bind(fertilizerController)
);

export default fertilizerRouter;
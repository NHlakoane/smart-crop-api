import express from "express";
import { CropController } from "../controllers/crop.controller.js";
import UserMiddleware from "../middleware/user.middleware.js";

const cropRouter = express.Router();
const cropController = new CropController();
const userMiddleware = new UserMiddleware();

// Apply authentication to all crop routes
cropRouter.use(userMiddleware.authenticate());

// Routes
cropRouter.post("/", 
  userMiddleware.authorize(['admin', 'manager', 'farmer']),
  cropController.createCrop.bind(cropController)
);

cropRouter.get("/", cropController.getAllCrops.bind(cropController));
cropRouter.get("/upcoming-harvests", cropController.getUpcomingHarvests.bind(cropController));
cropRouter.get("/user/:userId", cropController.getUserCrops.bind(cropController));
cropRouter.get("/field/:fieldId", cropController.getFieldCrops.bind(cropController));
cropRouter.get("/:id", cropController.getCropById.bind(cropController));
cropRouter.put("/:id", 
  userMiddleware.authorize(['admin', 'manager', 'farmer']),
  cropController.updateCrop.bind(cropController)
);
cropRouter.delete("/:id", 
  userMiddleware.authorize(['admin', 'manager']),
  cropController.deleteCrop.bind(cropController)
);

// Pesticide routes
cropRouter.post("/:cropId/pesticides", 
  userMiddleware.authorize(['admin', 'manager', 'farmer']),
  cropController.addPesticide.bind(cropController)
);
cropRouter.get("/:cropId/pesticides", 
  cropController.getCropPesticides.bind(cropController)
);

export default cropRouter;
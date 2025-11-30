import express from "express";
import { PesticideController } from "../controllers/pesticide.controller.js";
import UserMiddleware from "../middleware/user.middleware.js";

const pesticideRouter = express.Router();
const pesticideController = new PesticideController();
const userMiddleware = new UserMiddleware();

// Apply authentication to all pesticide routes
pesticideRouter.use(userMiddleware.authenticate());

// Routes
pesticideRouter.post("/", 
  userMiddleware.authorize(['admin', 'manager', 'farmer']),
  pesticideController.createPesticide.bind(pesticideController)
);

pesticideRouter.get("/", pesticideController.getAllPesticides.bind(pesticideController));
pesticideRouter.get("/stats", pesticideController.getPesticideStats.bind(pesticideController));
pesticideRouter.get("/recent", pesticideController.getRecentApplications.bind(pesticideController));
pesticideRouter.get("/usage/user", pesticideController.getUsageByUser.bind(pesticideController));
pesticideRouter.get("/usage/crop", pesticideController.getUsageByCrop.bind(pesticideController));
pesticideRouter.get("/user/:userId", pesticideController.getUserPesticides.bind(pesticideController));
pesticideRouter.get("/crop/:cropId", pesticideController.getCropPesticides.bind(pesticideController));
pesticideRouter.get("/type/:type", pesticideController.getPesticidesByType.bind(pesticideController));
pesticideRouter.get("/:id", pesticideController.getPesticideById.bind(pesticideController));
pesticideRouter.put("/:id", 
  userMiddleware.authorize(['admin', 'manager', 'farmer']),
  pesticideController.updatePesticide.bind(pesticideController) 
);
pesticideRouter.delete("/:id", 
  userMiddleware.authorize(['admin', 'manager']),
  pesticideController.deletePesticide.bind(pesticideController)
);

export default pesticideRouter;
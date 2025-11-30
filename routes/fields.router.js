import express from "express";
import FieldController  from "../controllers/field.controller.js";
import UserMiddleware from "../middleware/user.middleware.js";
import upload from "../middleware/multer.js";

const fieldRouter = express.Router();
const fieldController = new FieldController();
const userMiddleware = new UserMiddleware();

fieldRouter.use(userMiddleware.authenticate());

// Routes
fieldRouter.post("/", 
  userMiddleware.authorize(['admin', 'manager']),
  upload.single('file'),
  fieldController.createField.bind(fieldController)
);

fieldRouter.get("/", fieldController.getAllFields.bind(fieldController));
fieldRouter.get("/available", fieldController.getAvailableFields.bind(fieldController));
fieldRouter.get("/:id", fieldController.getFieldById.bind(fieldController));
fieldRouter.put("/:id", 
  userMiddleware.authorize(['admin', 'manager']),
  fieldController.updateField.bind(fieldController)
);
fieldRouter.delete("/:id", 
  userMiddleware.authorize(['admin', 'manager']),
  fieldController.deleteField.bind(fieldController)
);

export default fieldRouter;
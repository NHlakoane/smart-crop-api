import express from "express";
import UserController from "../controllers/user.controller.js";
import UserMiddleware from "../middleware/user.middleware.js";
import upload from "../middleware/multer.js";

const userRouter = express.Router();

const userController = new UserController();
const userMiddleware = new UserMiddleware();

userRouter.post("/", 
  userMiddleware.authenticate(),
  userMiddleware.authorize(['admin', 'manager']),
  upload.single("file"),
  userController.createUser.bind(userController)
);

userRouter.put("/:id", 
  userMiddleware.authenticate(),
  userController.updateUser.bind(userController)
);

userRouter.delete("/:id", 
  userMiddleware.authenticate(),
  userMiddleware.authorize(['admin', 'manager']),
  userController.deleteUser.bind(userController)
);

userRouter.get("/", 
  userMiddleware.authenticate(),
  userMiddleware.authorize(['farmer','admin', 'manager']),
  userController.getAllUsers.bind(userController)
);

userRouter.get("/:id", 
  userMiddleware.authenticate(),
  userController.getUserById.bind(userController)
);

export default userRouter;
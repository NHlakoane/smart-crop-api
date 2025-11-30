import express from "express";
import { AuthController } from "../controllers/auth.controller.js";


const authRouter = express.Router();

const authController = new AuthController();

authRouter.post('/login', authController.handleLogin.bind(authController));
authRouter.get('/logout', authController.handleLogout.bind(authController));

export default authRouter;
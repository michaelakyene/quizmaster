import express from "express";
import { AuthController } from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = express.Router();
const authController = new AuthController();

router.post("/register", (req, res, next) =>
  authController.register(req, res, next)
);
router.post("/login", (req, res, next) => authController.login(req, res, next));
router.get("/profile", authenticate, (req, res, next) =>
  authController.getProfile(req, res, next)
);

export default router;

import express from "express";
import { AttemptController } from "./attempt.controller.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";

const router = express.Router();
const attemptController = new AttemptController();

// Student routes
router.post("/start", authenticate, (req, res, next) =>
  attemptController.startAttempt(req, res, next)
);
router.post("/:attemptId/answer", authenticate, (req, res, next) =>
  attemptController.submitAnswer(req, res, next)
);
router.post("/:attemptId/submit", authenticate, (req, res, next) =>
  attemptController.submitAttempt(req, res, next)
);
router.get("/:attemptId", authenticate, (req, res, next) =>
  attemptController.getAttemptById(req, res, next)
);
router.get("/user/me", authenticate, (req, res, next) =>
  attemptController.getUserAttempts(req, res, next)
);

// Admin routes
router.get("/", authenticate, requireAdmin, (req, res, next) =>
  attemptController.getAllAttempts(req, res, next)
);

export default router;

import express from "express";
import { QuizController } from "./quiz.controller.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";

const router = express.Router();
const quizController = new QuizController();

// Public/Student routes
router.get("/", authenticate, (req, res, next) =>
  quizController.getAllQuizzes(req, res, next)
);
router.get("/:id", authenticate, (req, res, next) =>
  quizController.getQuizById(req, res, next)
);
// Verify access code and retrieve full quiz
router.post("/:id/access", authenticate, (req, res, next) =>
  quizController.verifyAccess(req, res, next)
);

// Admin routes
router.post("/", authenticate, requireAdmin, (req, res, next) =>
  quizController.createQuiz(req, res, next)
);
router.put("/:id", authenticate, requireAdmin, (req, res, next) =>
  quizController.updateQuiz(req, res, next)
);
router.delete("/:id", authenticate, requireAdmin, (req, res, next) =>
  quizController.deleteQuiz(req, res, next)
);

// Question management (Admin only)
router.post("/:id/questions", authenticate, requireAdmin, (req, res, next) =>
  quizController.addQuestion(req, res, next)
);
router.put(
  "/questions/:questionId",
  authenticate,
  requireAdmin,
  (req, res, next) => quizController.updateQuestion(req, res, next)
);
router.delete(
  "/questions/:questionId",
  authenticate,
  requireAdmin,
  (req, res, next) => quizController.deleteQuestion(req, res, next)
);

// Quiz statistics (Admin only)
router.get("/:id/stats", authenticate, requireAdmin, (req, res, next) =>
  quizController.getQuizStats(req, res, next)
);

export default router;

import { QuizService } from "./quiz.service.js";
import {
  validateQuizData,
  validateQuestionData,
} from "../../utils/validators.js";
import {
  sanitizeObjectDeep,
  sanitizeQuestionPayload,
} from "../../utils/sanitize.js";

const quizService = new QuizService();

export class QuizController {
  async createQuiz(req, res, next) {
    try {
      if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const errors = validateQuizData(req.body);
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }
      const sanitizedBody = sanitizeObjectDeep(req.body);
      const quiz = await quizService.createQuiz(sanitizedBody);

      res.status(201).json({
        message: "Quiz created successfully",
        quiz,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllQuizzes(req, res, next) {
    try {
      const includeInactive =
        req.user.role === "ADMIN" && req.query.includeInactive === "true";
      const quizzes = await quizService.getAllQuizzes(includeInactive);

      res.status(200).json({ quizzes });
    } catch (error) {
      next(error);
    }
  }

  async getQuizById(req, res, next) {
    try {
      const { id } = req.params;
      const includeCorrectAnswers = req.user.role === "ADMIN";

      const quiz = await quizService.getQuizById(id, includeCorrectAnswers);

      res.status(200).json({ quiz });
    } catch (error) {
      next(error);
    }
  }

  async updateQuiz(req, res, next) {
    try {
      const { id } = req.params;
      if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const errors = validateQuizData(req.body);

      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const sanitizedBody = sanitizeObjectDeep(req.body);
      const quiz = await quizService.updateQuiz(id, sanitizedBody);

      res.status(200).json({
        message: "Quiz updated successfully",
        quiz,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteQuiz(req, res, next) {
    try {
      const { id } = req.params;
      if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const result = await quizService.deleteQuiz(id);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async addQuestion(req, res, next) {
    try {
      const { id: quizId } = req.params;
      if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const errors = validateQuestionData(req.body);

      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      // Type-specific validation
      const { type, choices, textKeys, matchPairs } = req.body;
      if (type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE") {
        if (!choices || choices.length < 2) {
          return res
            .status(400)
            .json({ error: "At least 2 choices are required" });
        }
      } else if (type === "SHORT_ANSWER" || type === "FILL_IN_THE_BLANK") {
        if (!textKeys || textKeys.length < 1) {
          return res
            .status(400)
            .json({ error: "Provide at least one acceptable answer" });
        }
      } else if (type === "MATCHING") {
        if (!matchPairs || matchPairs.length < 1) {
          return res
            .status(400)
            .json({ error: "Provide at least one matching pair" });
        }
      }

      const sanitizedPayload = sanitizeQuestionPayload(req.body);
      const question = await quizService.addQuestion(quizId, sanitizedPayload);

      res.status(201).json({
        message: "Question added successfully",
        question,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateQuestion(req, res, next) {
    try {
      const { questionId } = req.params;
      if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const errors = validateQuestionData(req.body);

      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const sanitizedPayload = sanitizeQuestionPayload(req.body);
      const question = await quizService.updateQuestion(
        questionId,
        sanitizedPayload
      );

      res.status(200).json({
        message: "Question updated successfully",
        question,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteQuestion(req, res, next) {
    try {
      const { questionId } = req.params;
      if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const result = await quizService.deleteQuestion(questionId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getQuizStats(req, res, next) {
    try {
      const { id } = req.params;
      if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const stats = await quizService.getQuizStats(id);

      res.status(200).json({ stats });
    } catch (error) {
      next(error);
    }
  }

  async verifyAccess(req, res, next) {
    try {
      const { id } = req.params;
      const { code } = req.body;
      const includeCorrectAnswers = req.user.role === "ADMIN";
      const quiz = await quizService.verifyAccessCode(
        id,
        code,
        includeCorrectAnswers
      );
      res.status(200).json({ quiz });
    } catch (error) {
      next(error);
    }
  }
}

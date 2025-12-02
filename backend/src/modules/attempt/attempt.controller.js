import { AttemptService } from "./attempt.service.js";

const attemptService = new AttemptService();

export class AttemptController {
  async startAttempt(req, res, next) {
    try {
      const { quizId, code } = req.body;
      const userId = req.user.id;

      if (!quizId) {
        return res.status(400).json({ error: "Quiz ID is required" });
      }

      const attempt = await attemptService.startAttempt(userId, quizId, code);

      res.status(201).json({
        message: "Attempt started successfully",
        attempt,
      });
    } catch (error) {
      next(error);
    }
  }

  async submitAnswer(req, res, next) {
    try {
      const { attemptId } = req.params;
      const { questionId, choiceIds, textResponse, matchPairs } = req.body;
      const userId = req.user.id;

      if (!questionId) {
        return res.status(400).json({ error: "Question ID is required" });
      }
      if (
        choiceIds === undefined &&
        textResponse === undefined &&
        matchPairs === undefined
      ) {
        return res.status(400).json({
          error: "Provide choiceIds, textResponse, or matchPairs",
        });
      }

      const answers = await attemptService.submitAnswer(
        attemptId,
        userId,
        questionId,
        {
          choiceIds,
          textResponse,
          matchPairs,
        }
      );

      res.status(200).json({
        message: "Answer submitted successfully",
        answers,
      });
    } catch (error) {
      next(error);
    }
  }

  async submitAttempt(req, res, next) {
    try {
      const { attemptId } = req.params;
      const userId = req.user.id;

      const attempt = await attemptService.submitAttempt(attemptId, userId);

      res.status(200).json({
        message: "Attempt submitted successfully",
        attempt,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAttemptById(req, res, next) {
    try {
      const { attemptId } = req.params;
      const userId = req.user.id;

      const attempt = await attemptService.getAttemptById(attemptId, userId);

      res.status(200).json({ attempt });
    } catch (error) {
      next(error);
    }
  }

  async getUserAttempts(req, res, next) {
    try {
      const userId = req.user.id;
      const attempts = await attemptService.getUserAttempts(userId);

      res.status(200).json({ attempts });
    } catch (error) {
      next(error);
    }
  }

  async getAllAttempts(req, res, next) {
    try {
      const { quizId } = req.query;
      const attempts = await attemptService.getAllAttempts(quizId);

      res.status(200).json({ attempts });
    } catch (error) {
      next(error);
    }
  }
}

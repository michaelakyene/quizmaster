import prisma from "../../config/db.js";
import bcrypt from "bcrypt";

export class AttemptService {
  async startAttempt(userId, quizId, code) {
    // Fetch minimal quiz info first (avoid loading choices up front)
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        isActive: true,
        accessCodeHash: true,
      },
    });

    if (!quiz) {
      throw new Error("Quiz not found");
    }

    if (!quiz.isActive) {
      throw new Error("Quiz is not active");
    }

    // Verify access code if configured
    if (quiz.accessCodeHash) {
      if (!code) {
        throw new Error("Access code is required");
      }
      const valid = await bcrypt.compare(String(code), quiz.accessCodeHash);
      if (!valid) {
        throw new Error("Invalid access code");
      }
    }

    // Check if user already has an active (unsubmitted) attempt
    const existingAttempt = await prisma.attempt.findFirst({
      where: {
        userId,
        quizId,
        submittedAt: null,
      },
    });

    if (existingAttempt) {
      return existingAttempt;
    }

    // Calculate max score from questions (only points needed)
    const questions = await prisma.question.findMany({
      where: { quizId },
      select: { id: true, points: true },
    });
    const maxScore = questions.reduce((sum, q) => sum + q.points, 0);

    // Create new attempt
    const attempt = await prisma.attempt.create({
      data: {
        userId,
        quizId,
        maxScore,
      },
    });

    return attempt;
  }

  async submitAnswer(attemptId, userId, questionId, payload) {
    // Verify attempt belongs to user and is active
    const attempt = await prisma.attempt.findFirst({
      where: { id: attemptId, userId, submittedAt: null },
      select: { id: true, quizId: true },
    });

    if (!attempt) {
      throw new Error("Attempt not found or already submitted");
    }

    // Fetch question with choices only if needed
    const question = await prisma.question.findFirst({
      where: { id: questionId, quizId: attempt.quizId },
      include: { choices: true, textKeys: true },
    });
    if (!question) throw new Error("Question not found in this quiz");

    // Transaction: delete & recreate answers to keep atomic
    const { choiceIds, textResponse, matchPairs } = payload || {};
    const result = await prisma.$transaction(async (tx) => {
      await tx.answer.deleteMany({ where: { attemptId, questionId } });
      await tx.answerMatchPair.deleteMany({ where: { attemptId, questionId } });
      let answers = [];
      if (Array.isArray(choiceIds) || typeof choiceIds === "string") {
        const choiceIdArray = Array.isArray(choiceIds)
          ? choiceIds
          : [choiceIds];
        if (choiceIdArray.length) {
          answers = await Promise.all(
            choiceIdArray.map((choiceId) =>
              tx.answer.create({ data: { attemptId, questionId, choiceId } })
            )
          );
        }
      } else if (typeof textResponse === "string") {
        const answer = await tx.answer.create({
          data: { attemptId, questionId, textResponse },
        });
        answers = [answer];
      } else if (Array.isArray(matchPairs) && matchPairs.length) {
        await tx.answerMatchPair.createMany({
          data: matchPairs.map((p) => ({
            attemptId,
            questionId,
            promptId: p.promptId,
            answerId: p.answerId,
          })),
        });
      }
      return answers;
    });
    return result;
  }

  async submitAttempt(attemptId, userId) {
    // Load attempt base
    const attempt = await prisma.attempt.findFirst({
      where: { id: attemptId, userId, submittedAt: null },
      select: { id: true, quizId: true },
    });

    if (!attempt) {
      throw new Error("Attempt not found or already submitted");
    }

    // Fetch questions and answers needed for scoring separately (lean)
    const questions = await prisma.question.findMany({
      where: { quizId: attempt.quizId },
      include: { choices: true, textKeys: true, matchPairs: true },
    });
    const answers = await prisma.answer.findMany({
      where: { attemptId },
      include: { choice: true },
    });
    const answerMatchPairs = await prisma.answerMatchPair.findMany({
      where: { attemptId },
      select: { questionId: true, promptId: true, answerId: true },
    });
    const attemptForScore = {
      quiz: { questions },
      answers,
      answerMatchPairs,
    };
    const score = this.calculateScore(attemptForScore);

    // Update attempt with score and submission time
    const submittedAttempt = await prisma.attempt.update({
      where: { id: attemptId },
      data: { score, submittedAt: new Date() },
      include: {
        answers: { include: { question: true, choice: true } },
        quiz: true,
      },
    });

    return submittedAttempt;
  }

  calculateScore(attempt) {
    let totalScore = 0;

    // Group answers by question
    const answersByQuestion = {};
    attempt.answers.forEach((answer) => {
      if (!answersByQuestion[answer.questionId]) {
        answersByQuestion[answer.questionId] = [];
      }
      answersByQuestion[answer.questionId].push(answer);
    });

    // Group matching answers by question (if provided)
    const matchingByQuestion = {};
    (attempt.answerMatchPairs || []).forEach((pair) => {
      if (!matchingByQuestion[pair.questionId]) {
        matchingByQuestion[pair.questionId] = [];
      }
      matchingByQuestion[pair.questionId].push(pair);
    });

    // Calculate score for each question
    attempt.quiz.questions.forEach((question) => {
      const userAnswers = answersByQuestion[question.id] || [];
      const correctChoices = question.choices.filter((c) => c.isCorrect);

      if (question.type === "SINGLE_CHOICE") {
        // Single choice: correct if user selected the one correct answer
        if (
          userAnswers.length === 1 &&
          correctChoices.length === 1 &&
          userAnswers[0].choiceId === correctChoices[0].id
        ) {
          totalScore += question.points;
        }
      } else if (question.type === "MULTIPLE_CHOICE") {
        // Multiple choice: correct only if exact match
        const userChoiceIds = userAnswers.map((a) => a.choiceId).sort();
        const correctChoiceIds = correctChoices.map((c) => c.id).sort();

        const isExactMatch =
          userChoiceIds.length === correctChoiceIds.length &&
          userChoiceIds.every((id, index) => id === correctChoiceIds[index]);

        if (isExactMatch) {
          totalScore += question.points;
        }
      } else if (
        question.type === "SHORT_ANSWER" ||
        question.type === "FILL_IN_THE_BLANK"
      ) {
        // Compare normalized textResponse against any of the acceptable keys
        const text = (userAnswers[0]?.textResponse || "").trim();
        if (text) {
          // Load acceptable keys (caseSensitive stored per key)
          const keys = question.textKeys || [];
          const matched = keys.some((k) => {
            if (k.caseSensitive) {
              return text === k.value;
            }
            return text.toLowerCase() === k.value.toLowerCase();
          });
          if (matched) {
            totalScore += question.points;
          }
        }
      } else if (question.type === "MATCHING") {
        // Award points only if all prompt->answer mappings are exactly correct.
        const userPairs = matchingByQuestion[question.id] || [];
        const canonicalPairs = question.matchPairs || [];
        if (
          userPairs.length === canonicalPairs.length &&
          userPairs.length > 0
        ) {
          // Build a map of promptId -> expected answerId (design assumption: correct answerId equals the same QuestionMatchPair id).
          const expectedMap = new Map();
          canonicalPairs.forEach((p) => {
            // If schema evolves to separate prompt/answer entities, adjust here.
            expectedMap.set(p.id, p.id);
          });
          const allCorrect = userPairs.every(
            (p) => expectedMap.get(p.promptId) === p.answerId
          );
          if (allCorrect) {
            totalScore += question.points;
          }
        }
      } else if (question.type === "ESSAY") {
        // Essay requires manual grading; no auto points
      }
    });

    return totalScore;
  }

  async getAttemptById(attemptId, userId) {
    // Lean fetch then load questions separately for large quizzes
    const attempt = await prisma.attempt.findFirst({
      where: { id: attemptId, userId },
      select: {
        id: true,
        quizId: true,
        score: true,
        maxScore: true,
        submittedAt: true,
      },
    });
    if (!attempt) throw new Error("Attempt not found");
    const answers = await prisma.answer.findMany({
      where: { attemptId },
      include: { question: { include: { choices: true } }, choice: true },
    });
    const questions = await prisma.question.findMany({
      where: { quizId: attempt.quizId },
      include: { choices: true },
      orderBy: { order: "asc" },
    });
    return { ...attempt, answers, quiz: { id: attempt.quizId, questions } };
  }

  async getUserAttempts(userId) {
    const attempts = await prisma.attempt.findMany({
      where: {
        userId,
        submittedAt: { not: null },
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return attempts;
  }

  async getAllAttempts(quizId = null) {
    const where = quizId
      ? { quizId, submittedAt: { not: null } }
      : { submittedAt: { not: null } };
    // Paginate to avoid loading massive datasets by default
    const attempts = await prisma.attempt.findMany({
      where,
      select: {
        id: true,
        score: true,
        maxScore: true,
        submittedAt: true,
        user: { select: { id: true, name: true, email: true } },
        quiz: { select: { id: true, title: true } },
      },
      orderBy: { submittedAt: "desc" },
      take: 200,
    });
    return attempts;
  }
}

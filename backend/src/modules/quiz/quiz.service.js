import prisma from "../../config/db.js";
import bcrypt from "bcrypt";

const sanitizeQuiz = (quiz) => {
  const requiresAccess = Boolean(quiz.accessCodeHash);
  const sanitized = { ...quiz, requiresAccess };
  delete sanitized.accessCodeHash;
  return sanitized;
};

export class QuizService {
  async createQuiz(data) {
    const accessCodeHash = data.accessCode
      ? await bcrypt.hash(String(data.accessCode), 10)
      : null;

    const quiz = await prisma.quiz.create({
      data: {
        title: data.title,
        description: data.description || null,
        duration: data.duration || 60,
        isActive: data.isActive !== undefined ? data.isActive : true,
        accessCodeHash,
      },
      include: {
        questions: {
          include: {
            choices: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    return sanitizeQuiz(quiz);
  }

  async getAllQuizzes(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    // Return lightweight quiz list without nested questions for scalability.
    const quizzes = await prisma.quiz.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        accessCodeHash: true,
        _count: { select: { attempts: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return quizzes.map(sanitizeQuiz);
  }

  async getQuizById(id, includeCorrectAnswers = false) {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        accessCodeHash: true,
      },
    });

    if (!quiz) {
      throw new Error("Quiz not found");
    }

    const requiresAccess = Boolean(quiz.accessCodeHash);
    if (requiresAccess && !includeCorrectAnswers) {
      return sanitizeQuiz({ ...quiz, questions: [] });
    }
    // Fetch questions only when access is allowed.
    const questions = await prisma.question.findMany({
      where: { quizId: id },
      orderBy: { order: "asc" },
      include: {
        choices: {
          select: {
            id: true,
            text: true,
            order: true,
            isCorrect: includeCorrectAnswers,
          },
          orderBy: { order: "asc" },
        },
        matchPairs: {
          select: { id: true, prompt: true, answer: true },
        },
      },
    });
    return sanitizeQuiz({ ...quiz, questions });
  }

  async updateQuiz(id, data) {
    const updateData = {
      title: data.title,
      description: data.description,
      duration: data.duration,
      isActive: data.isActive,
    };

    if (Object.prototype.hasOwnProperty.call(data, "accessCode")) {
      updateData.accessCodeHash = data.accessCode
        ? await bcrypt.hash(String(data.accessCode), 10)
        : null;
    }

    const quiz = await prisma.quiz.update({
      where: { id },
      data: updateData,
      include: {
        questions: {
          include: {
            choices: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    return sanitizeQuiz(quiz);
  }

  async deleteQuiz(id) {
    await prisma.quiz.delete({
      where: { id },
    });

    return { message: "Quiz deleted successfully" };
  }

  async addQuestion(quizId, questionData) {
    // Get the next order number
    const maxOrder = await prisma.question.findFirst({
      where: { quizId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const nextOrder = maxOrder ? maxOrder.order + 1 : 1;

    const baseData = {
      quizId,
      text: questionData.text,
      type: questionData.type || "SINGLE_CHOICE",
      points: questionData.points || 1,
      order: questionData.order || nextOrder,
    };

    // Use transaction to ensure atomic creation of question + related entities.
    const created = await prisma.$transaction(async (tx) => {
      const q = await tx.question.create({ data: baseData });
      if (
        baseData.type === "SINGLE_CHOICE" ||
        baseData.type === "MULTIPLE_CHOICE"
      ) {
        if (
          Array.isArray(questionData.choices) &&
          questionData.choices.length
        ) {
          await tx.choice.createMany({
            data: questionData.choices.map((choice, index) => ({
              questionId: q.id,
              text: choice.text,
              isCorrect: Boolean(choice.isCorrect),
              order: choice.order || index + 1,
            })),
          });
        }
      } else if (
        baseData.type === "SHORT_ANSWER" ||
        baseData.type === "FILL_IN_THE_BLANK"
      ) {
        if (
          Array.isArray(questionData.textKeys) &&
          questionData.textKeys.length
        ) {
          await tx.questionTextKey.createMany({
            data: questionData.textKeys.map((k) => ({
              questionId: q.id,
              value: k.value,
              caseSensitive: Boolean(k.caseSensitive),
            })),
          });
        }
      } else if (baseData.type === "MATCHING") {
        if (
          Array.isArray(questionData.matchPairs) &&
          questionData.matchPairs.length
        ) {
          await tx.questionMatchPair.createMany({
            data: questionData.matchPairs.map((p) => ({
              questionId: q.id,
              prompt: p.prompt,
              answer: p.answer,
            })),
          });
        }
      }
      return q;
    });

    const question = await prisma.question.findUnique({
      where: { id: created.id },
      include: {
        choices: { orderBy: { order: "asc" } },
        textKeys: true,
        matchPairs: true,
      },
    });

    return question;
  }

  async updateQuestion(questionId, questionData) {
    const question = await prisma.question.update({
      where: { id: questionId },
      data: {
        text: questionData.text,
        type: questionData.type,
        points: questionData.points,
        order: questionData.order,
      },
      include: {
        choices: {
          orderBy: { order: "asc" },
        },
      },
    });

    return question;
  }

  async deleteQuestion(questionId) {
    await prisma.question.delete({
      where: { id: questionId },
    });

    return { message: "Question deleted successfully" };
  }

  async getQuizStats(quizId) {
    const aggregate = await prisma.attempt.aggregate({
      where: { quizId, submittedAt: { not: null } },
      _count: { _all: true },
      _sum: { score: true, maxScore: true },
    });
    const totalAttempts = aggregate._count._all;
    const sumScore = aggregate._sum.score || 0;
    const sumMax = aggregate._sum.maxScore || 0;
    const averageScore =
      totalAttempts > 0 && sumMax > 0 ? (sumScore / sumMax) * 100 : 0;
    // Retrieve recent attempts (limit 25) for overview without loading all.
    const recentAttempts = await prisma.attempt.findMany({
      where: { quizId, submittedAt: { not: null } },
      orderBy: { submittedAt: "desc" },
      take: 25,
      select: {
        score: true,
        maxScore: true,
        submittedAt: true,
        user: { select: { name: true, email: true } },
      },
    });
    return {
      totalAttempts,
      averageScore: Math.round(averageScore * 100) / 100,
      recentAttempts,
    };
  }

  async verifyAccessCode(id, code, includeCorrectAnswers = false) {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        accessCodeHash: true,
      },
    });

    if (!quiz) {
      throw new Error("Quiz not found");
    }
    if (!quiz.accessCodeHash) {
      // Load questions when no access code required
      const questions = await prisma.question.findMany({
        where: { quizId: id },
        orderBy: { order: "asc" },
        include: {
          choices: {
            select: {
              id: true,
              text: true,
              order: true,
              isCorrect: includeCorrectAnswers,
            },
            orderBy: { order: "asc" },
          },
          matchPairs: { select: { id: true, prompt: true, answer: true } },
        },
      });
      return sanitizeQuiz({ ...quiz, questions });
    }

    if (!code) {
      throw new Error("Access code is required");
    }

    const valid = await bcrypt.compare(String(code), quiz.accessCodeHash);
    if (!valid) {
      throw new Error("Invalid access code");
    }

    const questions = await prisma.question.findMany({
      where: { quizId: id },
      orderBy: { order: "asc" },
      include: {
        choices: {
          select: {
            id: true,
            text: true,
            order: true,
            isCorrect: includeCorrectAnswers,
          },
          orderBy: { order: "asc" },
        },
        matchPairs: { select: { id: true, prompt: true, answer: true } },
      },
    });
    return sanitizeQuiz({ ...quiz, questions });
  }
}

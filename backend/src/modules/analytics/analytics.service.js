import { prisma } from "../../src/config/db.js";

const PASS_THRESHOLD = 0.5; // 50%

export async function getOverview({ days = 30 }) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [quizStats, studentStats, activity] = await Promise.all([
    prisma.attempt.groupBy({
      by: ["quizId"],
      _count: { _all: true },
      _sum: { score: true, maxScore: true },
    }),
    prisma.attempt.groupBy({
      by: ["userId"],
      _count: { _all: true },
      _sum: { score: true, maxScore: true },
    }),
    prisma.attempt.findMany({
      where: { startedAt: { gte: since } },
      select: { startedAt: true },
      orderBy: { startedAt: "asc" },
    }),
  ]);

  const quizzes = await prisma.quiz.findMany({
    where: { id: { in: quizStats.map((q) => q.quizId) } },
    select: { id: true, title: true },
  });
  const users = await prisma.user.findMany({
    where: { id: { in: studentStats.map((s) => s.userId) } },
    select: { id: true, name: true, email: true },
  });

  const quizMap = Object.fromEntries(quizzes.map((q) => [q.id, q]));
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const quizPerformance = quizStats.map((q) => {
    const total = q._sum.maxScore || 0;
    const score = q._sum.score || 0;
    const avg = total > 0 ? score / total : 0;
    return {
      quizId: q.quizId,
      title: quizMap[q.quizId]?.title || "Unknown Quiz",
      attempts: q._count._all,
      average: Number(avg.toFixed(3)),
    };
  });

  const studentPerformance = studentStats.map((s) => {
    const total = s._sum.maxScore || 0;
    const score = s._sum.score || 0;
    const avg = total > 0 ? score / total : 0;
    return {
      userId: s.userId,
      name: userMap[s.userId]?.name || "Unknown",
      email: userMap[s.userId]?.email || "",
      attempts: s._count._all,
      average: Number(avg.toFixed(3)),
    };
  });

  // Attempts per day
  const byDay = new Map();
  for (const a of activity) {
    const key = a.startedAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) || 0) + 1);
  }
  const attemptsPerDay = Array.from(byDay.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  // Top/low quizzes by average
  const sortedQuizzes = [...quizPerformance].sort((a, b) => b.average - a.average);
  const topQuizzes = sortedQuizzes.slice(0, 5);
  const lowQuizzes = sortedQuizzes.slice(-5).reverse();

  return {
    quizPerformance,
    studentPerformance,
    attemptsPerDay,
    topQuizzes,
    lowQuizzes,
  };
}

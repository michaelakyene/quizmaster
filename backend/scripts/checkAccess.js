import { PrismaClient } from "@prisma/client";

async function run() {
  const prisma = new PrismaClient();
  try {
    const quiz = await prisma.quiz.findFirst({
      select: { id: true, accessCodeHash: true },
    });
    console.log("Quiz select result:", quiz);
  } catch (e) {
    console.error("Select failed:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();

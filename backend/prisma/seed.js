import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Environment-driven credentials with sensible defaults
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@quizapp.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin User";

const STUDENT_EMAIL = process.env.STUDENT_EMAIL || "student@test.com";
const STUDENT_PASSWORD = process.env.STUDENT_PASSWORD || "student123";
const STUDENT_NAME = process.env.STUDENT_NAME || "Test Student";

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
const QUIZ_ACCESS_CODE = process.env.QUIZ_ACCESS_CODE || "QUIZ123";

async function main() {
  console.log("🌱 Starting seed...");
  console.log("ℹ️ Using ADMIN_EMAIL=", ADMIN_EMAIL);
  console.log("ℹ️ Using STUDENT_EMAIL=", STUDENT_EMAIL);

  // Create / update admin user
  const adminHashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      password: adminHashedPassword,
      name: ADMIN_NAME,
      role: "ADMIN",
    },
  });
  console.log("✅ Ensured admin user:", admin.email);

  // Create sample quiz only if none exist to avoid duplicates
  const existingQuiz = await prisma.quiz.findFirst();
  if (!existingQuiz) {
    const quizAccessHash = await bcrypt.hash(QUIZ_ACCESS_CODE, SALT_ROUNDS);
    const quiz = await prisma.quiz.create({
      data: {
        title: "JavaScript Fundamentals Quiz",
        description: "Test your knowledge of JavaScript basics",
        duration: 30,
        isActive: true,
        accessCodeHash: quizAccessHash,
        questions: {
          create: [
            {
              text: "What is the correct way to declare a variable in JavaScript?",
              type: "SINGLE_CHOICE",
              points: 1,
              order: 1,
              choices: {
                create: [
                  { text: "var x = 5;", isCorrect: true, order: 1 },
                  { text: "variable x = 5;", isCorrect: false, order: 2 },
                  { text: "v x = 5;", isCorrect: false, order: 3 },
                  { text: "dim x = 5;", isCorrect: false, order: 4 },
                ],
              },
            },
            {
              text: "Which of the following are JavaScript data types? (Select all that apply)",
              type: "MULTIPLE_CHOICE",
              points: 2,
              order: 2,
              choices: {
                create: [
                  { text: "String", isCorrect: true, order: 1 },
                  { text: "Number", isCorrect: true, order: 2 },
                  { text: "Boolean", isCorrect: true, order: 3 },
                  { text: "Character", isCorrect: false, order: 4 },
                ],
              },
            },
            {
              text: "What does DOM stand for?",
              type: "SINGLE_CHOICE",
              points: 1,
              order: 3,
              choices: {
                create: [
                  { text: "Document Object Model", isCorrect: true, order: 1 },
                  { text: "Data Object Model", isCorrect: false, order: 2 },
                  {
                    text: "Display Object Management",
                    isCorrect: false,
                    order: 3,
                  },
                  {
                    text: "Digital Optimization Method",
                    isCorrect: false,
                    order: 4,
                  },
                ],
              },
            },
            {
              text: "Which methods can be used to iterate over an array? (Select all that apply)",
              type: "MULTIPLE_CHOICE",
              points: 2,
              order: 4,
              choices: {
                create: [
                  { text: "forEach()", isCorrect: true, order: 1 },
                  { text: "map()", isCorrect: true, order: 2 },
                  { text: "for...of", isCorrect: true, order: 3 },
                  { text: "ifEach()", isCorrect: false, order: 4 },
                ],
              },
            },
          ],
        },
      },
    });
    console.log(
      "✅ Created sample quiz:",
      quiz.title,
      "(access code:",
      QUIZ_ACCESS_CODE,
      ")"
    );
  } else {
    console.log("ℹ️ Skipped sample quiz creation (already exists)");
  }

  // Create / update test student
  const studentHashedPassword = await bcrypt.hash(
    STUDENT_PASSWORD,
    SALT_ROUNDS
  );
  const student = await prisma.user.upsert({
    where: { email: STUDENT_EMAIL },
    update: {},
    create: {
      email: STUDENT_EMAIL,
      password: studentHashedPassword,
      name: STUDENT_NAME,
      role: "STUDENT",
    },
  });
  console.log("✅ Ensured test student:", student.email);

  console.log("\n🎉 Seed completed successfully!");
  console.log("\nCredentials (do NOT use these defaults in production):");
  console.log(`Admin - Email: ${ADMIN_EMAIL} | Password: ${ADMIN_PASSWORD}`);
  console.log(
    `Student - Email: ${STUDENT_EMAIL} | Password: ${STUDENT_PASSWORD}`
  );
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

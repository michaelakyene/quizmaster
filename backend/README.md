# Quiz App Backend

Backend API for the Quiz Application built with Express.js, Prisma, and PostgreSQL.

## Features

- 🔐 Authentication with JWT
- 📝 Quiz management (CRUD operations)
- ✅ Quiz attempt and submission
- 📊 Automatic grading with support for single and multiple choice questions
- 👥 Role-based access control (Admin/Student)
- 🗄️ PostgreSQL database with Prisma ORM
- 📊 Teacher analytics (overview, top/low quizzes, student performance)

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Installation

1. Install dependencies:

```bash
npm install
```

2.Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

3.Run database migrations:

```bash
npm run migrate
```

4.Generate Prisma Client:

```bash
npm run prisma:generate
```

5.Seed the database:

```bash
npm run seed
```

## Running the Application

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires auth)

### Quizzes

- `GET /api/quizzes` - Get all active quizzes
- `GET /api/quizzes/:id` - Get quiz by ID
- `POST /api/quizzes` - Create quiz (admin only)
- `PUT /api/quizzes/:id` - Update quiz (admin only)
- `DELETE /api/quizzes/:id` - Delete quiz (admin only)
- `POST /api/quizzes/:id/questions` - Add question to quiz (admin only)
- `GET /api/quizzes/:id/stats` - Get quiz statistics (admin only)

### Attempts

- `POST /api/attempts/start` - Start a new attempt
- `POST /api/attempts/:attemptId/answer` - Submit answer
- `POST /api/attempts/:attemptId/submit` - Submit attempt
- `GET /api/attempts/:attemptId` - Get attempt details
- `GET /api/attempts/user/me` - Get user's attempts
- `GET /api/attempts` - Get all attempts (admin only)

## Test Credentials

Values are derived from environment variables set before running `npm run seed`:

- Admin: `${ADMIN_EMAIL}` / `${ADMIN_PASSWORD}` (defaults: `admin@quizapp.com` / `admin123`)
- Student: `${STUDENT_EMAIL}` / `${STUDENT_PASSWORD}` (defaults: `student@test.com` / `student123`)

To rotate credentials:

1. Edit `.env` with new values (e.g. stronger passwords).
2. (Optional) Remove existing users or change emails to avoid conflicts.
3. Re-run `npm run seed`.

## Deployment

See root [RENDER_DEPLOY.md](../RENDER_DEPLOY.md) and [render.yaml](../render.yaml) for Render deployment.

## Database Schema

- **User**: email, password, name, role
- **Quiz**: title, description, duration, isActive
- **Question**: text, type, points, order
- **Choice**: text, isCorrect, order
- **Attempt**: score, startedAt, submittedAt
- **Answer**: user's selected choices

## Grading Logic

- **Single Choice**: Full points if correct choice is selected
- **Multiple Choice**: Full points only if all correct choices are selected (exact match)

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with sample data
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:studio` - Open Prisma Studio

## License

MIT

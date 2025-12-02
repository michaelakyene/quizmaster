# Quiz App Frontend

React frontend for the Quiz Application.

## Features

- 🔐 User authentication (login/register)
- 📝 Browse and take quizzes
- ⏱️ Real-time timer during quiz
- 📊 View quiz results with detailed feedback
- 👨‍💼 Admin dashboard for quiz management
- 📱 Responsive design

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

1. Install dependencies:

```bash
npm install
```

2.Set up environment variables (optional):
Create a `.env` file:

```
VITE_API_URL=http://localhost:5000/api
```

## Running the Application

Development mode:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Project Structure

```
src/
├── components/       # Reusable components
├── contexts/         # React contexts (Auth)
├── pages/           # Page components
│   ├── admin/       # Admin-only pages
│   └── ...          # Public/Student pages
├── services/        # API service functions
├── App.jsx          # Main app component with routes
├── main.jsx         # Entry point
└── index.css        # Global styles
```

## Available Routes

### Public

- `/login` - Login page
- `/register` - Registration page

### Student

- `/dashboard` - View available quizzes and attempts
- `/quiz/:id` - Take a quiz
- `/attempt/:attemptId/result` - View quiz results

### Admin

- `/admin/quizzes` - Manage all quizzes
- `/admin/quiz/create` - Create new quiz
- `/admin/quiz/:id/edit` - Edit quiz
- `/admin/quiz/:id/stats` - View quiz statistics

## Tech Stack

- React 18
- React Router v6
- Axios
- Vite
- CSS3

## License

MIT

## Environment Variables

- `DATABASE_URL=postgresql://quizuser:quizpass@localhost:5432/quizapp?schema=public`
- `JWT_SECRET=replace-with-long-secret`
- `JWT_EXPIRES_IN=7d`
- `PORT=5000`
- `NODE_ENV=development`
- `FRONTEND_URL=http://localhost:3000`
# quiz

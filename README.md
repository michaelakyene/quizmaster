# QuizMaster

Full-stack quiz application with a Node/Express + Prisma + PostgreSQL backend and a React + Vite frontend.

Backend is deployed as **Netlify Functions** and the frontend is deployed to **GitHub Pages**.

For a complete deployment walkthrough, see [DEPLOYMENT.md](DEPLOYMENT.md).

---

## Features

- User registration and authentication (students & admins)
- Quiz creation and management (admin)
- Taking quizzes (student)
- Automatic scoring with per-question points
- Attempt history per user
- Basic analytics for admins (quiz performance, attempts, etc.)

---

## Project Structure

- `backend/` – Express API, authentication, quizzes, attempts, analytics, Prisma schema
- `frontend/` – React SPA (Vite), admin views, student views
- `netlify.toml` – Netlify configuration for backend/functions
- `.github/workflows/` – GitHub Actions workflow for frontend deploy
- `DEPLOYMENT.md` – Detailed GitHub Pages + Netlify deployment guide
- `LICENSE` – MIT License

---

## Local Development

### Backend

```bash
cd backend
npm install

cp .env.example .env    # if present
# Edit .env to set DATABASE_URL and JWT_SECRET

npx prisma migrate dev
npm run dev
```

Backend will usually run on `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install

cp .env.example .env    # if not already created
# Ensure VITE_API_URL=http://localhost:5000/api

npm run dev
```

Frontend will run on `http://localhost:3000` and talk to the local backend.

---

## Environment Variables

### Backend (Netlify / local)

- `DATABASE_URL` – PostgreSQL connection string
- `JWT_SECRET` – long random secret key
- `FRONTEND_URL` – production frontend URL (e.g. `https://michaelakyene.github.io`)
- `NODE_ENV` – `development` or `production`

### Frontend (Vite / GitHub Actions)

- `VITE_API_URL` – base API URL, e.g. `http://localhost:5000/api` locally or `https://your-site-name.netlify.app/api` in production

---

## Security & Roles

- Roles: `STUDENT`, `ADMIN`
- Admin-only capabilities:
  - Create/update/delete quizzes
  - View quiz/attempt analytics

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).

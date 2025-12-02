# QuizMaster

Full-stack quiz application with an Express/Prisma/PostgreSQL backend and a React/Vite frontend.

## Deploy on Render

- Backend (Web Service): root `backend`, build `npm install`, start `node src/server.js`.
- Frontend (Static Site): root `frontend`, build `npm install && npm run build`, publish `dist`.
- Environment:
  - Backend: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`.
  - Frontend: `VITE_API_URL`.

See [RENDER_DEPLOY.md](RENDER_DEPLOY.md) for a step-by-step guide and checklist.

## Project Structure

- `backend/` – API, authentication, quizzes, attempts, analytics
- `frontend/` – React app, admin pages, student views
- `render.yaml` – Optional Render blueprint for one-click infra
- `LICENSE` – MIT License

## Local Development (optional)

```bash
cd backend && npm install && npm run dev
cd ../frontend && npm install && npm run dev
```

## Security & Roles

- Roles: Student, Admin (Teacher)
- Admin-only routes include quiz management and analytics

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).

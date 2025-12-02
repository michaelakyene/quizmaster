# Deployment Guide: GitHub Pages + Netlify (Monorepo)

This project is a single repo with:

- `frontend/` – React app built with Vite, deployed to **GitHub Pages**
- `backend/` – Express + Prisma API, deployed as **Netlify Functions**

Follow these steps carefully to avoid common deployment errors.

---

## 0. Requirements

- GitHub account with this repo
- Netlify account
- PostgreSQL database (Neon / Supabase / Render / etc.)
- Node.js 18+ installed locally

---

## 1. Backend on Netlify (API)

### 1.1. Connect the repo

1. Go to https://app.netlify.com
2. "Add new site" → "Import an existing project"
3. Select this GitHub repo.

### 1.2. Build settings

In the Netlify setup form for this site, set:

- **Base directory**: `backend`
- **Build command**: `npm install && npx prisma generate`
- **Publish directory**: `backend`
- **Functions directory**: `backend/netlify/functions`

> These match the existing files: netlify config at repo root and the
> serverless entry at backend/netlify/functions/api.js.

Click **Deploy site**. The first build may fail until env vars are added; that’s expected.

### 1.3. Environment variables

In Netlify → your site → **Site settings → Environment variables** add:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
FRONTEND_URL=https://YOUR-GITHUB-USERNAME.github.io
NODE_ENV=production
```

- Replace `YOUR-GITHUB-USERNAME` with your real GitHub username.
- Use your actual PostgreSQL connection string for `DATABASE_URL`.

Click **Save** and then trigger a new deploy from the Netlify **Deploys** tab.

### 1.4. Run database migrations

Run migrations once from your local machine using the same DATABASE_URL:

```bash
cd backend
npm install

# Ensure .env has DATABASE_URL matching Netlify
cp .env.example .env   # if the file exists and you haven’t created .env yet
# edit .env to set DATABASE_URL correctly

npx prisma migrate deploy
```

If this succeeds, your database schema is ready.

### 1.5. Confirm backend is live

After a successful Netlify deploy, you’ll see a URL like:

```text
https://your-site-name.netlify.app
```

Check the health endpoint:

- Open `https://your-site-name.netlify.app/health`
- You should see JSON: `{ "status": "ok", ... }`

All API routes will be under:

- `https://your-site-name.netlify.app/api/...`

---

## 2. Frontend on GitHub Pages (Vite + React)

### 2.1. Enable GitHub Pages

1. Go to your repo on GitHub.
2. Open **Settings → Pages**.
3. Under **Source**, choose **GitHub Actions**.

This allows the existing workflow to publish the frontend.

### 2.2. Configure API URL secret

In GitHub: **Settings → Secrets and variables → Actions → New repository secret**

- **Name**: `VITE_API_URL`
- **Value**: `https://your-site-name.netlify.app/api`

Use the exact Netlify URL from step 1.5, with `/api` appended and **no trailing slash**.

### 2.3. Deploy frontend

The workflow at .github/workflows/deploy-frontend.yml runs on push to main.

From your local machine:

```bash
git add .
git commit -m "Deploy frontend and backend"
git push origin main
```

This will:

- Install dependencies in frontend/
- Build the app with `npm run build`
- Copy index.html to 404.html for SPA routing
- Publish frontend/dist to GitHub Pages

### 2.4. Access the frontend

After the workflow finishes (check the **Actions** tab), your app is at:

```text
https://YOUR-GITHUB-USERNAME.github.io
```

The frontend will call the backend at `VITE_API_URL` from the secret you set.

---

## 3. End-to-end Testing

1. Open `https://your-site-name.netlify.app/health` – should return status ok.
2. Open `https://YOUR-GITHUB-USERNAME.github.io` – frontend should load.
3. In the app:
   - Register a user.
   - Login.
   - As an admin, create a quiz.
   - Take a quiz as a student.
   - Visit admin analytics if you’re using that feature.

If anything fails, see the Troubleshooting section below.

---

## 4. Troubleshooting (Common Errors)

### 4.1. CORS errors

Symptoms: Browser console shows CORS blocked / origin not allowed.

- Ensure `FRONTEND_URL` on Netlify is **exactly**:
  - `https://YOUR-GITHUB-USERNAME.github.io`
- Redeploy backend after changing env vars.
- Confirm backend uses this value from config when setting CORS.

### 4.2. 404 on frontend routes (e.g. /dashboard)

- The GitHub Actions workflow copies `index.html` to `404.html`.
- Make sure Pages is using **GitHub Actions** as the source (not /docs or main).
- If you changed workflow names or paths, ensure it still uploads frontend/dist.

### 4.3. API calls failing (network error or 500)

- Check `VITE_API_URL` secret in GitHub:
  - No extra `/` at the end.
  - Includes `/api` (e.g. `https://your-site-name.netlify.app/api`).
- Check Netlify deploy logs for backend errors.
- Ensure DATABASE_URL is correct and reachable.

### 4.4. Database issues

- If migrations fail, run locally:

  ```bash
  cd backend
  npx prisma migrate deploy
  ```

- Ensure the DATABASE_URL used locally matches the one in Netlify.

### 4.5. Function timeout or slow responses

- Netlify free tier functions timeout after ~10s.
- Optimize heavy queries, or consider a paid plan if needed.

---

## 5. Local Development (No Deployment Involved)

### 5.1. Backend

```bash
cd backend
npm install

cp .env.example .env   # if example exists
# Edit .env to set DATABASE_URL to your local DB

npx prisma migrate dev
npm run dev
```

Backend will usually run at http://localhost:5000 (check server.js).

### 5.2. Frontend

```bash
cd frontend
npm install

cp .env.example .env   # if not already created
# Ensure VITE_API_URL=http://localhost:5000/api

npm run dev
```

Frontend will run at http://localhost:3000 and call the local backend.

---

## 6. Updating After Changes

### 6.1. Backend changes

```bash
git add backend/
git commit -m "Update backend logic"
git push origin main
```

- Netlify will auto-redeploy if the site is connected to GitHub.
- If using Netlify CLI, you can run `netlify deploy --prod` from backend/.

### 6.2. Frontend changes

```bash
git add frontend/
git commit -m "Update frontend UI"
git push origin main
```

- GitHub Actions workflow deploy-frontend.yml will rebuild and publish.

---

## 7. Production Checklist

- [ ] Database is production-grade (not local/dev instance).
- [ ] All env vars set correctly in Netlify (DATABASE_URL, JWT_SECRET, FRONTEND_URL).
- [ ] `VITE_API_URL` secret set correctly in GitHub (points to Netlify `/api`).
- [ ] CORS uses the correct frontend URL.
- [ ] Prisma migrations deploy successfully.
- [ ] `/health` endpoint returns 200 in production.
- [ ] User registration/login tested.
- [ ] Quiz creation and taking tested.
- [ ] Admin analytics page (if used) loads correctly.

---

## 8. Cost Overview (Typical)

- **GitHub Pages**: Free (100GB bandwidth/month).
- **Netlify**: Free tier (125K requests/month, 100GB bandwidth) is usually enough for small apps.
- **Database**:
  - Neon: free tier (~0.5GB)
  - Supabase: free tier (~500MB)
  - Render PostgreSQL: paid plans starting around $7/month

Total: typically **$0–$7/month**, depending on your database choice and traffic.

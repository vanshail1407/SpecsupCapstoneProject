# SpecsUp Deployment Guide for Vercel

This project is pre-configured for full-stack deployment on [Vercel](https://vercel.com/).

The setup includes:
- **Frontend**: React + Vite SPA built to `frontend/dist`.
- **Backend**: Python FastAPI deployed as a Vercel Serverless Function via `api/index.py`.
- **Database**: Seeded SQLite database automatically copied to `/tmp/specsup.db` on cold start to support serverless operations.
- **Routing**: `vercel.json` routes `/api/*` to the FastAPI backend and all other requests to the React SPA.

---

## Method 1: Deploy via GitHub (Recommended)

1. **Push your code to GitHub**:
   If not already pushed, initialize Git and push the project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Deploy SpecsUp to Vercel"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

2. **Import into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new) and log in with GitHub.
   - Select your repository (`specsup`).
   - In the project configuration:
     - **Framework Preset**: Vite (detected automatically).
     - **Root Directory**: `./` (leave default).
     - **Build Command**: `cd frontend && npm run build` (set in `vercel.json`).
     - **Output Directory**: `frontend/dist` (set in `vercel.json`).
   - Click **Deploy**.

3. **Done!**
   Vercel will build your frontend and configure your FastAPI serverless function. Your app will be live at `https://<your-project>.vercel.app`.

---

## Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from project root**:
   From `C:\Users\VANSH AIL\.gemini\antigravity\scratch\specsup`:
   ```bash
   vercel
   ```
   Follow the CLI prompts (accept default settings).

4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

---

## Important Note on Serverless Database Persistence

- Vercel Serverless Functions have an ephemeral filesystem. Any changes made to SQLite in `/tmp/specsup.db` during runtime are retained for active container instances, but reset when functions go cold.
- For permanent production storage, connect an external cloud database (such as **Supabase PostgreSQL** or **Neon PostgreSQL**) by setting the `DATABASE_URL` or `SUPABASE_URL` / `SUPABASE_KEY` environment variables in your Vercel Project Dashboard.

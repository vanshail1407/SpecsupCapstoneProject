# SpecsUp Deployment Guide

SpecsUp uses a React + Vite frontend, an Express/Node.js backend, and MongoDB.
Deploy the frontend and backend as separate services: Vercel can host the frontend,
while the backend needs a Node.js host that supports a persistent web process.

---

## Deploy the backend

1. Create a Node.js service using `backend/` as its root directory.
2. Install dependencies with `npm install` and start the service with `npm start`.
3. Configure `MONGO_URI`, `JWT_SECRET`, and `NODE_ENV` in the service environment.
4. Confirm the service responds at `/api/health`.

## Deploy the frontend to Vercel

1. Import the repository into [Vercel](https://vercel.com/new) and set the project root to the repository root.
2. Use the build command `cd frontend && npm run build` and output directory `frontend/dist`.
3. Set the build-time environment variable `VITE_API_BASE_URL` to the deployed backend's base URL (no trailing slash).
4. Deploy. The Vercel rewrite serves the frontend SPA; API requests go directly to the configured backend URL.

To deploy from the command line:
   ```bash
   vercel --prod
   ```

Use a managed MongoDB deployment for production and allow network access from the backend host.

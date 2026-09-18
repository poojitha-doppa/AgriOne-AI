# Deployment Guide (Vercel + Render)

This project is deployed as:
- Frontend on Vercel
- Backend on Render

## 1) Deploy Backend on Render

## Option A: Blueprint (recommended)

1. Push your code to GitHub (already done).
2. In Render, click New + then Blueprint.
3. Select this repository.
4. Render reads render.yaml from repo root and prepares the backend service.
5. In Render dashboard, fill required environment variables:
   - MONGO_URI
   - JWT_SECRET
   - ADMIN_PHONE
   - ADMIN_PASSWORD
   - ALLOWED_ORIGINS
   - NEWS_API_KEY (optional but recommended)
   - GEMINI_API_KEY and/or OPENROUTER_API_KEY (as per your AI provider)
   - ROBOFLOW_API_KEY and ROBOFLOW_URL (for crop image workflow)
6. Deploy.
7. Verify health endpoint: https://your-render-service.onrender.com/api/health

## Option B: Manual service creation

1. In Render, click New + then Web Service.
2. Connect this GitHub repository.
3. Configure:
   - Root Directory: backend
   - Build Command: npm ci
   - Start Command: npm start
   - Runtime: Node
4. Add the same environment variables listed above.
5. Deploy and verify /api/health.

## 2) Deploy Frontend on Vercel

1. In Vercel, click Add New... then Project.
2. Import this GitHub repository.
3. Configure:
   - Framework Preset: Vite
   - Root Directory: frontend
   - Build Command: npm run build
   - Output Directory: dist
4. Add environment variable:
   - VITE_API_BASE_URL = https://your-render-service.onrender.com
5. Deploy.

The frontend has vercel.json configured for SPA route rewrites.

## 3) Connect Frontend and Backend

After Vercel URL is available:
1. Set backend ALLOWED_ORIGINS in Render to include:
   - https://your-project.vercel.app
   - (optional) preview URL patterns you use
2. Redeploy backend if needed.

## 4) Post-Deployment Smoke Tests

1. Open frontend URL.
2. Log in / sign up flow works.
3. Dashboard loads weather and headlines.
4. AI assistant chat works in English and Telugu.
5. News page loads without 500 errors.
6. Crop and scheme flows return valid responses.

## 5) Troubleshooting

- CORS error in browser:
  - Fix ALLOWED_ORIGINS in Render backend env.
- Frontend cannot call API:
  - Verify VITE_API_BASE_URL in Vercel env.
- Backend unhealthy:
  - Check Render logs and confirm MONGO_URI and JWT_SECRET are set.
- News empty or degraded:
  - Confirm NEWS_API_KEY, then test fallback behavior.

## 6) Production Checklist

- Secrets are set only in hosting env dashboards, not in git.
- .env files are not committed.
- Backend /api/health returns status ok.
- Frontend build succeeds on Vercel.
- CORS allows only trusted frontend domains.

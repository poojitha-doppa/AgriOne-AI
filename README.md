# Agri_Mytra

Agri_Mytra is an AI-powered agriculture assistant for farmers, with support for English and Telugu.

It includes:
- Crop analysis support
- Government scheme discovery
- Localized agri news
- Weather insights and advisory
- AI assistant with voice and text flows

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind, Framer Motion
- Backend: Node.js, Express, MongoDB (Mongoose)
- AI/External APIs: Gemini/OpenRouter, News API, Roboflow

## Project Structure

```text
Agri_Mytra/
  backend/    # Express API, controllers, services, DB models
  frontend/   # React app (Vite)
```

## Quick Start (Local)

## 1) Backend

```bash
cd backend
npm install
```

Create `backend/.env` from `backend/.env.example` and set real values.

Run backend:

```bash
npm run dev
```

Production run:

```bash
npm start
```

## 2) Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env` from `frontend/.env.example`.

Run frontend:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

## Environment Variables

Backend (`backend/.env`):
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `ADMIN_PHONE`
- `ADMIN_PASSWORD`
- `ROBOFLOW_API_KEY`
- `ROBOFLOW_URL`
- `ROBOFLOW_CONFIDENCE_CONFIRMED`
- `ROBOFLOW_CONFIDENCE_LOW`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `LLM_PROVIDER`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `OPENROUTER_VISION_MODEL`
- `OPENROUTER_SITE_URL`
- `OPENROUTER_APP_NAME`
- `NEWS_API_KEY`

Frontend (`frontend/.env`):
- `VITE_API_BASE_URL`

## Deployment Notes

- Frontend deploy target: static hosting (Vercel/Netlify/etc.)
- Backend deploy target: Node service or Docker
- Set `VITE_API_BASE_URL` to deployed backend URL
- Ensure backend CORS allows your frontend production domain
- Configure MongoDB network access and production secrets

Detailed steps are documented in `DEPLOYMENT.md`.

## Health Check

Once backend is live:

- `GET /api/health`

## Core API Prefix

- `/api/auth`
- `/api/crop`
- `/api/schemes`
- `/api/news`
- `/api/ai-assistant`
- `/api/chat`

## Language Support

- English (`en`)
- Telugu (`te`)

UI, AI assistant guidance text, and key content flows are localized.

## License

Private project for hackathon/deployment usage.

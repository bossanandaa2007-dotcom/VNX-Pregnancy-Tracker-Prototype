# VNX Pregnancy Tracker Prototype

Monorepo containing the frontend app (`Vernex MomCare/`) and backend API (`Vernex MomCare_Backend/`).

## Project Structure

- `Vernex MomCare/`: Vite + React frontend
- `Vernex MomCare_Backend/`: Node.js + Express + MongoDB backend

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB connection string
- Google Gemini API key

## Environment Variables

### Frontend (`Vernex MomCare/.env`)

- `VITE_API_URL`: Backend base URL, for example `http://localhost:4000`

You can copy from `Vernex MomCare/.env.example`.

### Backend (`Vernex MomCare_Backend/.env`)

Required:

- `MONGO_URI`: MongoDB connection string
- `GEMINI_API_KEY`: Google Gemini API key

Optional:

- `PORT`: API port (default `4000`)
- `GEMINI_MODEL`: Gemini model override (default in app logic)
- `CORS_ORIGINS`: Comma-separated allowlist, for example `http://localhost:8080,http://localhost:5173`
- `CORS_CREDENTIALS`: `true` or `false`

You can copy from `Vernex MomCare_Backend/.env.example`.

## Local Setup

1. Install frontend dependencies:

```bash
cd "Vernex MomCare"
npm install
```

2. Install backend dependencies:

```bash
cd "../Vernex MomCare_Backend"
npm install
```

3. Start backend API:

```bash
npm start
```

4. Start frontend app (in a second terminal):

```bash
cd "../Vernex MomCare"
npm run dev
```

## Development Commands

### Frontend (`Vernex MomCare/`)

- `npm run dev`: Start dev server
- `npm run build`: Production build
- `npm run preview`: Preview production build
- `npm run lint`: Lint source

### Backend (`Vernex MomCare_Backend/`)

- `npm start`: Run API server (`node server.js`)

## Production Deployment Summary

### Frontend on Vercel

1. Import the repository in Vercel.
2. Set root directory to `Vernex MomCare`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add `VITE_API_URL` environment variable pointing to deployed backend URL.

### Backend on Render

1. Create a new Web Service from the same repository.
2. Set root directory to `Vernex MomCare_Backend`.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. Add environment variables from `.env.example` (`MONGO_URI`, `GEMINI_API_KEY`, optional `GEMINI_MODEL`, `CORS_ORIGINS`, `CORS_CREDENTIALS`).
6. Render provides `PORT`; backend uses `process.env.PORT`.

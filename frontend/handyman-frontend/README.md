# Handyman Marketplace Frontend (React + Vite)

This frontend is part of the full-stack demo in the repo root README.

## Run locally (dev)

Prereqs:

- Node.js 22+

Install + start:

```bash
npm ci
npm run dev
```

Open: `http://localhost:5173`

### Backend dependency

For local dev, Vite proxies:

- `/api/*` → `http://localhost:8080`
- `/hubs/*` (SignalR WebSockets) → `http://localhost:8080`

So make sure the backend is running on **port 8080** (the root `README.md` includes a command that sets `--urls http://localhost:8080`).

## Production (Docker)

In Docker, the frontend is built and served by **nginx** and exposed as `http://localhost:3000`.
nginx also reverse-proxies `/api/*` and `/hubs/*` to the backend container so the browser uses a single origin.

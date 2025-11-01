Microlandia Compendium — Agent Guide

Scope: Entire repository.

Purpose
- Provide concise conventions and operational tips for agents working in this repo so changes stay minimal, consistent, and easy to validate.

Project Overview
- Frontend: Angular 17 (standalone APIs) in `frontend/`.
- API: Node.js + Express + Mongoose in `api/`.
- Database: MongoDB (via Docker Compose).
- Typical ports: API `:8080`, static frontend `:8081` (dev with Angular CLI on `:4200`).

High‑Level Rules
- Make minimal, surgical changes; do not refactor unrelated code.
- Keep style consistent with existing files; prefer current patterns.
- Avoid adding new dependencies unless explicitly needed for the task.
- Update documentation/comments when changing behavior or configuration.
- Prefer fixing root causes over surface workarounds.
- Do not add license headers.

Runtime & Environments
- Frontend environments live under `frontend/src/environments/`.
  - Dev: `environment.ts` points to `http://localhost:8080/api`.
  - Prod: `environment.prod.ts` currently uses absolute `http://localhost:8080/api`.
    - If the static server proxies `/api` → API, you may switch this to `'/api'` — confirm deployment mode first.
- API port defaults to `8080`; Mongo URI via `MONGODB_URI` (see `docker-compose.yml`).

Local Run
- API & Mongo: `docker-compose up` (runs Mongo on `27017`, API on `8080`).
- Frontend dev: from `frontend/`, `npm start` (Angular CLI on `:4200`).
- Frontend prod: build with `npm run build` and serve `frontend/dist/microlandia-frontend/` (often on `:8081`).

CORS & Preflight
- The API is configured to handle CORS and OPTIONS preflight.
- If tightening CORS, set an explicit origin (e.g., `http://localhost:8081`) instead of `origin: true` and validate POST/PUT/DELETE paths still work.

Validation Tips
- For frontend/API connectivity issues, verify the compiled bundle references the intended `apiBaseUrl` (search in `dist/*/main.*.js`).
- Use the browser Network tab to check preflight (OPTIONS) vs. actual request status codes.

When Modifying Config
- Keep port mappings consistent with `docker-compose.yml` unless asked to change.
- If you change environment URLs, call out whether a reverse proxy is in use and the impact on CORS.


Microlandia Compendium – Field Microorganism Observations
========================================================

Overview
--------
- Angular frontend (standalone, Angular 17) for searching and adding observations
- Node/Express REST API with MongoDB (Mongoose)
- Docker Compose to run API + MongoDB
- Frontend can be hosted as static files (e.g., S3/CloudFront)

Data model
----------
- researcherName (string, required)
- commonName (string, required)
- scientificName (string, required)
- habitat (string, required)
- fieldNotes (string, optional)

Project structure
-----------------
- `frontend/` – Angular app
- `api/` – Express/Mongoose API
- `docker-compose.yml` – API + MongoDB stack

Quick start
-----------
Prereqs: Docker Desktop (or Engine) for running the stack; Node 20+ for local builds of the frontend if desired.

1) Run API + MongoDB in Docker

```
docker compose up --build
```

This exposes:
- API: `http://localhost:8080/api`
- MongoDB: `mongodb://localhost:27017/microlandia`

Health check: `GET http://localhost:8080/api/health`

2) Configure frontend API URL

Edit `frontend/src/environments/environment.ts` if needed:

```
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api'
};
```

3) Build the Angular frontend

```
cd frontend
npm install
npm run build
```

The static site will be in `frontend/dist/microlandia-frontend/`.

4) Host the frontend
- Simple local test: `npx http-server dist/microlandia-frontend` (or any static server)
- Production: Upload files in `dist/microlandia-frontend/` to an S3 bucket (optionally fronted by CloudFront). Ensure CORS allows requests to the API domain.

REST API
--------
Base URL: `/api`

- `GET /api/observations` – list/search. Query params: `researcherName`, `commonName`, `scientificName`, `habitat`, `q` (searches notes/common/scientific name). Returns array.
- `POST /api/observations` – create. Body: `{ researcherName, commonName, scientificName, habitat, fieldNotes }`
- `GET /api/observations/:id` – fetch by id
- `PUT /api/observations/:id` – update by id (same fields as create)
- `DELETE /api/observations/:id` – delete by id

Environment variables (API)
---------------------------
- `MONGODB_URI` (default `mongodb://localhost:27017/microlandia`, compose sets to `mongodb://mongo:27017/microlandia`)
- `PORT` (default `8080`)

Notes
-----
- The frontend uses Angular standalone components and the HttpClient to call the API.
- The API uses Mongoose timestamps; each document has `createdAt` and `updatedAt`.
- You can later add auth, file uploads (e.g., photos), geolocation, and richer filtering/pagination.

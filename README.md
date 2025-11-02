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


Offline Viewer (frontend-offline)
---------------------------------
The `frontend-offline/` site lets you browse a read‑only copy of the compendium without connecting to the API. It consumes the export the main app produces.

Export contents
- `compendium.csv` — tabular dataset
- `compendium.json` — full dataset with relative `imagePath` entries
- `images/` — PNG files referenced by `imagePath` (e.g., `images/<id>.png`)

How to use the offline viewer
1. In the main app, click the “Export” link in the header to download a ZIP.
2. Extract the ZIP into a folder; you should see `compendium.json`, `compendium.csv`, and an `images/` subfolder.
3. Copy the files from `frontend-offline/` (index.html, app.js, styles.css) into that same folder so they sit alongside `compendium.json` and `images/`.
4. Serve the folder over HTTP (recommended):
   - `npx http-server .`
   - Open the printed URL (for example `http://127.0.0.1:8080`).

Features (offline)
- Fast client‑side search and researcher dropdown.
- Tap any row to see a detail view with the larger image and full fields.
- Strictly read‑only: there is no Add/Edit/Delete and no network requests.

Notes
- Most browsers block `fetch` from `file://`; using a simple HTTP server avoids this.
- You can host the offline bundle (index.html + app.js + styles.css) anywhere static files are served, together with the exported `compendium.json` and `images/`.

Microlandia Compendium — Field Microorganism Observations
=======================================================

Overview
--------
- Angular 17 frontend (standalone APIs) for browsing and managing observations
- Node/Express REST API with MongoDB (Mongoose)
- Docker Compose for API + MongoDB
- Optional static hosting for the frontend (e.g., S3 + CloudFront)
- Offline, read‑only viewer in `frontend-offline/` that works with exported data

Frontend highlights
-------------------
- Responsive UI with playful “microbe Pokédex” theme and animated header background
- Collapsible Search with live filtering (no submit button)
- Researcher filter via custom dark dropdown (consistent on mobile/desktop)
- Tap a row to edit; Add screen available from header
- Canvas sketch per observation with:
  - 16‑colour palette (Canadian “Colour”), size slider, Erase, Clear
  - Camera capture (handheld) to insert a photo and annotate it
- Thumbnails shown in the grid for entries with images/sketches
- Share overlay with QR code (configurable via environment)
- Export entire compendium as ZIP (CSV + JSON + images/)

API highlights
--------------
- CORS (including preflight) enabled
- Filtering by multiple fields with case‑insensitive partial matches
- Distinct researchers endpoint to populate the dropdown
- Mongoose timestamps on documents

Data model
----------
- researcherName (string, required)
- commonName (string, required)
- scientificName (string, optional)
- habitat (string, optional)
- fieldNotes (string, optional)
- imageData (string, optional, base64 PNG data URL)
- createdAt, updatedAt (timestamps)

Project structure
-----------------
- `frontend/` — Angular app
- `api/` — Express/Mongoose API
- `frontend-offline/` — Static offline viewer (no API)
- `docker-compose.yml` — API + MongoDB stack

Quick start
-----------
Prereqs: Docker Desktop (or Engine) to run API + DB; Node 20+ for frontend.

1) Run API + MongoDB in Docker

```
docker compose up --build
```

Exposes:
- API: `http://localhost:8080/api`
- MongoDB: `mongodb://localhost:27017/microlandia`

Health: `GET http://localhost:8080/api/health`

2) Configure frontend environments

Edit `frontend/src/environments/environment.ts` (and `.prod.ts`) as needed:

```
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api',
  shareQrUrl: 'http://localhost:4200/'
};
```

3) Build the Angular frontend

```
cd frontend
npm install
npm run build
```

Artifacts: `frontend/dist/microlandia-frontend/`.

4) Host the frontend
- Local: `npx http-server dist/microlandia-frontend`
- Production: upload to S3 (optionally behind CloudFront). Set `apiBaseUrl` to the API domain, and `shareQrUrl` to your app URL.

Export (CSV + JSON + Images)
----------------------------
- Use the “Export” link in the header
- ZIP includes:
  - `compendium.csv` — `_id, researcherName, commonName, scientificName, habitat, fieldNotes, createdAt, updatedAt, imagePath`
  - `compendium.json` — array with the same fields (no `imageData`), includes relative `imagePath`
  - `images/` — `images/<id>.png` for items with images

Offline viewer (`frontend-offline/`)
-----------------------------------
Browse the exported compendium without an API.

What you need
- `compendium.json` and `images/` from the export ZIP
- The offline site files: `frontend-offline/index.html`, `app.js`, `styles.css`
- Optional: `frontend-offline/config.json` with a `shareUrl` for the QR overlay

Usage
1. Extract the export ZIP into a folder
2. Copy the contents of `frontend-offline/` into that same folder (so `index.html`, `app.js`, `styles.css` sit alongside `compendium.json` and `images/`)
3. (Optional) Create `config.json`:

```
{
  "shareUrl": "https://your.app.url/"
}
```

4. Serve the folder over HTTP (recommended):

```
npx http-server .
```

Notes
- Offline is read‑only: no Add/Edit/Delete; tap rows to view details
- Uses a vendored browser QR library and local `config.json` (no network required to generate QR)
- `.gitignore` excludes `frontend-offline/compendium.json` and `frontend-offline/images/`

REST API
--------
Base URL: `/api`

- `GET /api/observations` — list/search. Query: `researcherName`, `commonName`, `scientificName`, `habitat`, `q`
- `POST /api/observations` — create. Body: `{ researcherName, commonName, scientificName?, habitat?, fieldNotes?, imageData? }`
- `GET /api/observations/:id` — fetch by id
- `PUT /api/observations/:id` — update by id
- `DELETE /api/observations/:id` — delete by id
- `GET /api/researchers` — distinct list of non‑empty researcher names

API environment variables
-------------------------
- `MONGODB_URI` (default `mongodb://localhost:27017/microlandia`, compose sets `mongodb://mongo:27017/microlandia`)
- `PORT` (default `8080`)

Deployment notes (ECS + Compose)
--------------------------------
- API can be deployed via Docker ECS context and a compose override; MongoDB in ECS requires persistence (EFS) or use a managed service (Atlas/DocumentDB)
- Frontend recommended on S3 + CloudFront

License
-------
MIT License. See the `LICENSE` file for full text.



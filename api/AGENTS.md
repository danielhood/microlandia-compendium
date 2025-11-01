API Agent Guide (Express + Mongoose)

Scope: `api/` subtree.

Runtime & Structure
- ESM enabled (`"type": "module"`). Use `import`/`export` syntax.
- Entry: `src/index.js`; Mongoose models under `src/models/`.
- Default port: `8080` (overridable via `PORT`).
- Mongo URI via `MONGODB_URI` (Docker Compose sets `mongodb://mongo:27017/microlandia`).

HTTP API
- Base path: `/api`.
- Observations CRUD:
  - `GET /api/observations`
  - `POST /api/observations`
  - `GET /api/observations/:id`
  - `PUT /api/observations/:id`
  - `DELETE /api/observations/:id`
- Health: `GET /api/health`.

CORS
- CORS is enabled and preflight (OPTIONS) is handled.
- To restrict origins, set an explicit origin (e.g., `http://localhost:8081`). Validate that POST/PUT/DELETE continue to pass preflight.

Coding Guidelines
- Use async/await with try/catch per route; return clear status codes and JSON bodies.
- Keep schema changes backward‑compatible; avoid breaking changes without migration plan.
- Log errors to server console; don’t leak stack traces to clients.

Running Locally
- With Docker: `docker-compose up` from repo root (brings up Mongo and API).
- Without Docker: ensure local Mongo on `mongodb://localhost:27017/microlandia` or set `MONGODB_URI`, then `npm start`.

Validation
- If clients receive 405 on write operations, confirm the request is reaching the API (`:8080`) and not a static server (`:8081`). Check CORS preflight status.


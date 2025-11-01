Frontend Agent Guide (Angular 17)

Scope: `frontend/` subtree.

Architecture & Conventions
- Standalone components and providers; no NgModules.
- Change detection relies on ZoneJS. Ensure `import 'zone.js';` exists in `src/main.ts`.
- Routing is declared in `src/app/app.routes.ts` and provided via `provideRouter(routes)` in `main.ts`.
- Use Angular `HttpClient` with `provideHttpClient(withInterceptorsFromDi())` (already configured in `main.ts`).
- Styles use SCSS (`src/styles.scss`); keep styles minimal and component‑scoped when possible.

Environments
- `src/environments/environment.ts` (dev) → `http://localhost:8080/api`.
- `src/environments/environment.prod.ts` (prod) → currently absolute `http://localhost:8080/api`.
  - If the static server proxies `/api`, set prod to `'/api'` and verify CORS/proxy config.

Build & Serve
- Dev: `npm start` → CLI on `:4200` with serve config `development`.
- Build: `npm run build` → uses `production` configuration and file replacement for environments.
- Artifacts: `dist/microlandia-frontend/`.

Coding Guidelines
- Keep components standalone; import only required Angular modules (e.g., `CommonModule`, `FormsModule`).
- Avoid adding third‑party UI libs unless requested.
- Keep HTTP base URLs centralized via `environment` imports; do not hardcode URLs in components/services.
- Prefer typed models in `src/app/models/` for API contracts.

Troubleshooting
- Blank screen: verify ZoneJS import in `main.ts` and check console errors.
- API calls pointing to wrong port: confirm the active environment and inspect the compiled `main.*.js` for `apiBaseUrl`.


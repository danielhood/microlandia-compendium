export const environment = {
  production: true,
  // In production build when serving the SPA from a static server on :8081
  // the API runs on a different origin (:8080). Use an absolute URL to avoid
  // posting to the static server and getting 405.
  apiBaseUrl: 'http://localhost:8080/api'
};

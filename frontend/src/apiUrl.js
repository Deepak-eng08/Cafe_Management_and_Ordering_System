// API base URL.
// - VITE_API_URL overrides everything when set.
// - In dev (Vite on :5173), fall back to the backend on the same host :5000.
// - In production the built app is served by the backend itself, so an empty
//   base keeps requests same-origin (no mixed-content / port problems).
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : "");
